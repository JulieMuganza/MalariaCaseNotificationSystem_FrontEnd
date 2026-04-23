import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIcon,
  HeartPulseIcon,
  SyringeIcon,
  Building2Icon,
  ChevronDownIcon,
  CheckSquareIcon,
  SquareIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import {
  PEDIATRIC_DANGER_SIGNS,
  PEDIATRIC_DANGER_SIGNS_PARENT,
  SEVERE_SYMPTOMS,
  getSymptomLabel,
} from '../../data/mockData';
import type { MalariaCase } from '../../types/domain';

const SPECIALIZED_UNITS = [
  'ICU',
  'Dialysis unit',
  'HDU / high-dependency',
  'Pediatric ICU',
  'Isolation',
  'Other',
] as const;

/** Same 12 severe malaria signs as CHW / HC (`SEVERE_SYMPTOMS` in mockData). */

const INPATIENT_CARE_OPTIONS = [
  'IV artesunate / antimalarial continued',
  'IV fluids / resuscitation',
  'Inotropic / vasopressor support',
  'Mechanical ventilation',
  'Renal replacement / dialysis',
  'Blood transfusion',
  'Parenteral antibiotics',
  'Close nursing / HDU observation',
  'Nutritional support',
] as const;

function parsePipeList(s: string | undefined): string[] {
  if (!s?.trim()) return [];
  if (s.includes('|')) {
    return s
      .split('|')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return s
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean);
}

function serializePipeList(items: string[]): string | undefined {
  const t = items.filter(Boolean).join(' | ');
  return t || undefined;
}

function rwInpatientLabel(label: string): string {
  const labels: Record<string, string> = {
    'IV artesunate / antimalarial continued':
      'Artesunate ya IV / imiti ya malariya yakomeje',
    'IV fluids / resuscitation': 'Amazi ya IV / gusubiza ubuzima',
    'Inotropic / vasopressor support':
      'Imiti ifasha umutima n umuvuduko w amaraso',
    'Mechanical ventilation': 'Gufashwa guhumeka n imashini',
    'Renal replacement / dialysis': 'Dialysis / gufasha impyiko',
    'Blood transfusion': 'Gusimbuza amaraso',
    'Parenteral antibiotics': 'Antibiyotike zitangwa mu mutsi',
    'Close nursing / HDU observation':
      'Kwitabwaho bya hafi / igenzura rya HDU',
    'Nutritional support': 'Ubufasha mu mirire',
  };
  return labels[label] ?? label;
}

function rwUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    ICU: 'ICU',
    'Dialysis unit': 'Santasiyo ya Dialysis',
    'HDU / high-dependency': 'HDU / ubuvuzi bwimbitse',
    'Pediatric ICU': "ICU y'abana",
    Isolation: 'Aho kwigunga',
    Other: 'Ibindi',
  };
  return labels[unit] ?? unit;
}

type PatchFn = (
  caseRef: string,
  body: Record<string, unknown>
) => Promise<MalariaCase>;

export function ReferralHospitalCaseOverview({
  c,
  patchCase,
  userName,
  loggingArrival,
  setLoggingArrival,
}: {
  c: MalariaCase;
  patchCase: PatchFn;
  userName?: string;
  loggingArrival: boolean;
  setLoggingArrival: (v: boolean) => void;
}) {
  const { i18n } = useTranslation();
  const language: 'en' | 'rw' = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';

  const [busy, setBusy] = useState(false);
  const [unit, setUnit] = useState(c.referralSpecializedCareUnit ?? '');
  const [specializedDays, setSpecializedDays] = useState<number>(1);
  const [showPediatricDangerSigns, setShowPediatricDangerSigns] = useState(false);
  const [showDeathModal, setShowDeathModal] = useState(false);

  useEffect(() => {
    setUnit(c.referralSpecializedCareUnit ?? '');
  }, [c.id, c.referralSpecializedCareUnit]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const hcLines = c.hcPreTreatment?.length ? c.hcPreTreatment : [];
  const fromHealthPost = c.chwPrimaryReferral === 'LOCAL_CLINIC';
  const firstLineFacilityEn = fromHealthPost ? 'Health Post' : 'Health Center';
  const firstLineFacilityRw = fromHealthPost
    ? 'Ivuriro Riciriritse'
    : 'Ikigo nderabuzima';
  const receivedHere = Boolean(c.referralHospitalReceivedDateTime);
  const showSpecializedUnitSection =
    c.referralClinicalTrend === 'worsening' ||
    c.status === 'Escalated' ||
    Boolean(c.referralSpecializedCareAt);

  const selectedFindings = parsePipeList(c.referralSymptomsUpdate);
  const selectedInpatient = parsePipeList(c.referralInpatientNotes);
  const hasPediatricDangerSignsSelected = selectedFindings.some((s) =>
    PEDIATRIC_DANGER_SIGNS.includes(
      s as (typeof PEDIATRIC_DANGER_SIGNS)[number]
    )
  );

  const severeSymptomKeySet = useMemo(
    () => new Set<string>([...SEVERE_SYMPTOMS]),
    []
  );
  /** Older saves used a different checklist; allow clearing those entries. */
  const legacyReferralFindings = useMemo(
    () => selectedFindings.filter((f) => !severeSymptomKeySet.has(f)),
    [selectedFindings, severeSymptomKeySet]
  );

  useEffect(() => {
    if (
      selectedFindings.some((s) =>
        PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number])
      )
    ) {
      setShowPediatricDangerSigns(true);
    }
  }, [selectedFindings]);

  const coreReferralSymptoms = useMemo(
    () =>
      SEVERE_SYMPTOMS.filter(
        (s) =>
          s !== PEDIATRIC_DANGER_SIGNS_PARENT &&
          !PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number])
      ),
    []
  );

  const togglePipeField = async (
    field: 'referralSymptomsUpdate' | 'referralInpatientNotes',
    label: string,
    currentList: string[]
  ) => {
    const next = currentList.includes(label)
      ? currentList.filter((x) => x !== label)
      : [...currentList, label];
    const serialized = serializePipeList(next);
    await patchCase(c.id, {
      [field]: serialized,
      timelineEvent: {
        event:
          field === 'referralSymptomsUpdate' ?
            `Referral severe symptoms updated (${label})`
          : `Inpatient care selections updated (${label})`,
        actorName: userName ?? 'Referral Hospital',
        actorRole: 'Referral Hospital',
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Receipt */}
      {c.transferredToReferralHospital && !c.referralHospitalReceivedDateTime && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--role-accent)]/25 bg-[color:var(--role-accent-soft)] px-5 py-4">
          <p className="text-sm font-medium text-[color:var(--role-accent)]">
            {en
              ? 'Confirm that the patient has arrived at your referral / provincial hospital.'
              : "Emeza ko umurwayi yageze ku bitaro byoherezwaho."}
          </p>
          <button
            type="button"
            disabled={loggingArrival}
            onClick={() =>
              run(async () => {
                setLoggingArrival(true);
                try {
                  await patchCase(c.id, {
                    referralHospitalReceivedDateTime: new Date().toISOString(),
                    status: c.status === 'Escalated' ? 'Admitted' : c.status,
                    timelineEvent: {
                      event: 'Patient received at referral hospital',
                      actorName: userName ?? 'Referral Hospital',
                      actorRole: 'Referral Hospital',
                    },
                  });
                  toast.success(
                    en
                      ? 'Receipt logged — review continuity of care'
                      : "Byanditswe — reba ubukurikirane bw'ubuvuzi"
                  );
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : en
                        ? 'Could not save'
                        : 'Ntibyabashije kubikwa'
                  );
                } finally {
                  setLoggingArrival(false);
                }
              })
            }
            className="rounded-xl bg-[color:var(--role-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loggingArrival
              ? (en ? 'Saving…' : 'Birabikwa…')
              : (en ? 'Log patient received' : 'Andika ko yakiriwe')}
          </button>
        </div>
      )}

      {/* Continuity of care — first-line + district */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <SyringeIcon className="text-[color:var(--role-accent)]" size={20} />
          <h3 className="text-sm font-bold text-slate-900">
            {en
              ? `Continuity of care (${firstLineFacilityEn} -> district -> you)`
              : `Ubukurikirane bw'ubuvuzi (${firstLineFacilityRw} -> ibitaro by'akarere -> mwe)`}
          </h3>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-900">
              {en
                ? `${firstLineFacilityEn} — pre-transfer`
                : `${firstLineFacilityRw} — mbere yo kohereza`}
            </p>
            {hcLines.length > 0 ?
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-800">
                {hcLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            : <p className="mt-2 text-sm text-slate-600">
                {en ? 'Not recorded in app.' : 'Ntibyanditswe muri sisitemu.'}
              </p>}
            <p className="mt-3 text-xs text-slate-500">
              {en ? 'Toward hospital:' : "Yerekeza ku bitaro:"}{' '}
              {c.hcPatientTransferredToHospitalDateTime ?
                new Date(
                  c.hcPatientTransferredToHospitalDateTime
                ).toLocaleString()
              : '—'}{' '}
              · {en ? 'Transport' : 'Uko yagezeyo'}:{' '}
              {c.hcReferralToHospitalTransport ?? '—'}
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--role-accent)]/20 bg-[color:var(--role-accent-soft)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--role-accent)]">
              {en
                ? 'District hospital — IV / management'
                : "Ibitaro by'akarere — IV / imicungire"}
            </p>
            <p className="mt-2 text-sm text-slate-800">
              <span className="text-slate-500">
                {en ? 'Received at DH:' : "Yakiriwe ku bitaro by'akarere:"}
              </span>{' '}
              {c.hospitalReceivedDateTime ?
                new Date(c.hospitalReceivedDateTime).toLocaleString()
              : '—'}
            </p>
            {c.dhObservationPlannedDays != null && (
              <p className="mt-1 text-sm text-slate-800">
                <span className="text-slate-500">
                  {en ? 'Observation plan:' : "Gahunda y'igenzura:"}
                </span>{' '}
                {en
                  ? `${c.dhObservationPlannedDays} day(s)`
                  : `${c.dhObservationPlannedDays} iminsi`}
                {c.dhObservationStartedAt ?
                  ` · ${
                    en ? 'started' : 'byatangiye'
                  } ${new Date(c.dhObservationStartedAt).toLocaleString()}`
                : ''}
              </p>
            )}
            <p className="mt-3 text-xs font-semibold text-slate-600">
              {en
                ? 'Management / dosing log (district)'
                : "Raporo y'imicungire / ingano y'imiti (akarere)"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {c.hospitalManagementMedication?.trim() ?
                c.hospitalManagementMedication
              : '—'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          <strong>
            {en
              ? 'Transfer from district escalated:'
              : "Iyoherezwa riturutse ku bitaro by'akarere:"}
          </strong>{' '}
          {c.dhTransferredToReferralHospitalDateTime ?
            new Date(
              c.dhTransferredToReferralHospitalDateTime
            ).toLocaleString()
          : '—'}
        </p>
      </div>

      {/* Severe symptoms */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ActivityIcon className="text-[color:var(--role-accent)]" size={20} />
          <h3 className="text-sm font-bold text-slate-900">
            {en ?
              'Severe malaria symptoms (referral assessment)'
            : "Ibimenyetso bya malariya ikomeye (isuzuma ku bitaro)"}
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          {en ?
            'Same severe signs as the CHW form — select all that apply.'
            : 'Ibimenyetso nk ibya CHW — hitamo byose bihuye n umurwayi.'}
        </p>
        {legacyReferralFindings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
            <p className="font-semibold">
              {en ?
                'Previously saved labels (older list) — tap to remove:'
                : 'Andi mazina yabitswe kera — kanda ureke:'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {legacyReferralFindings.map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={busy || !receivedHere}
                  onClick={() =>
                    run(async () => {
                      await togglePipeField(
                        'referralSymptomsUpdate',
                        label,
                        selectedFindings
                      );
                    })
                  }
                  className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-left font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  × {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {coreReferralSymptoms.map((label) => {
            const on = selectedFindings.includes(label);
            const display = getSymptomLabel(label, language);
            return (
              <div key={label} className="contents">
                <button
                  type="button"
                  disabled={busy || !receivedHere}
                  onClick={() =>
                    run(async () => {
                      await togglePipeField(
                        'referralSymptomsUpdate',
                        label,
                        selectedFindings
                      );
                    })
                  }
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                    on ?
                      'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  {on ?
                    <CheckSquareIcon size={18} className="shrink-0" />
                  : <SquareIcon size={18} className="shrink-0 text-slate-400" />}
                  {display}
                </button>

                {label === 'Prostration' && (
                  <>
                    <button
                      type="button"
                      disabled={busy || !receivedHere}
                      onClick={() => setShowPediatricDangerSigns((prev) => !prev)}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                        showPediatricDangerSigns || hasPediatricDangerSignsSelected ?
                          'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      } disabled:opacity-50`}
                    >
                      <span>{getSymptomLabel(PEDIATRIC_DANGER_SIGNS_PARENT, language)}</span>
                      <ChevronDownIcon
                        size={16}
                        className={`transition-transform ${
                          showPediatricDangerSigns ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showPediatricDangerSigns &&
                      PEDIATRIC_DANGER_SIGNS.map((p) => {
                        const onP = selectedFindings.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            disabled={busy || !receivedHere}
                            onClick={() =>
                              run(async () => {
                                await togglePipeField(
                                  'referralSymptomsUpdate',
                                  p,
                                  selectedFindings
                                );
                              })
                            }
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                              onP ?
                                'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                              : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                            } disabled:opacity-50`}
                          >
                            {onP ?
                              <CheckSquareIcon size={18} className="shrink-0" />
                            : <SquareIcon size={18} className="shrink-0 text-slate-400" />}
                            {getSymptomLabel(p, language)}
                          </button>
                        );
                      })}
                  </>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Inpatient / ICU / dialysis — chip pickers */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <HeartPulseIcon className="text-[color:var(--role-accent)]" size={20} />
          <h3 className="text-sm font-bold text-slate-900">
            {en
              ? 'Treatments & supportive care (inpatient)'
              : "Ubuvuzi n'ubufasha (mu bitaro)"}
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          {en
            ? 'Document what was done for this patient (drugs, fluids, organ support, level of care) — not the same as the symptom/finding checklist above. Tap to toggle.'
            : "Andika ibyakozwe kuri uyu murwayi (imiti, amazi, ubufasha bw'ibice by'umubiri, urwego rw'ubuvuzi) — si kimwe n'urutonde rw'ibimenyetso ruri hejuru. Kanda uhitemo."}
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {INPATIENT_CARE_OPTIONS.map((label) => {
            const on = selectedInpatient.includes(label);
            return (
              <button
                key={label}
                type="button"
                disabled={busy || !receivedHere}
                onClick={() =>
                  run(async () => {
                    await togglePipeField(
                      'referralInpatientNotes',
                      label,
                      selectedInpatient
                    );
                  })
                }
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                  on ?
                    'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                {on ?
                  <CheckSquareIcon size={18} className="shrink-0" />
                : <SquareIcon size={18} className="shrink-0 text-slate-400" />}
                {en ? label : rwInpatientLabel(label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trend decision */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          {en
            ? 'Clinical trend after observation'
            : "Imiterere y'uburwayi nyuma y'igenzura"}
        </h3>
        <p className="text-xs text-slate-600">
          {en
            ? 'After observation/inpatient care, set the trend to guide next action.'
            : "Nyuma y'igenzura/ubuvuzi bwo mu bitaro, shyiraho imiterere kugira ngo igikorwa gikurikiraho kimenyekane."}
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['improving', en ? 'Improving' : 'Ari gutera imbere'],
              ['stable', en ? 'Stable' : 'Ari ku rugero rumwe'],
              ['worsening', en ? 'Unstable / worsening' : 'Ntiyifashe neza / arushaho kuremba'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={busy || !receivedHere}
              onClick={() =>
                run(async () => {
                  await patchCase(c.id, {
                    referralClinicalTrend: value,
                    timelineEvent: {
                      event: `Clinical trend at referral: ${label}`,
                      actorName: userName ?? 'Referral Hospital',
                      actorRole: 'Referral Hospital',
                    },
                  });
                  toast.success(
                    en ? 'Trend updated' : "Imiterere y'uburwayi yavuguruwe"
                  );
                })
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition ${
                c.referralClinicalTrend === value ?
                  'bg-[color:var(--role-accent)] text-white ring-[color:var(--role-accent)]'
                : 'bg-white text-slate-800 ring-slate-200 hover:bg-slate-50'
              } disabled:opacity-50`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Specialized unit */}
      {showSpecializedUnitSection && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Building2Icon className="text-amber-800" size={20} />
            <h3 className="text-sm font-bold text-amber-950">
              {en
                ? 'Specialized unit (unstable/escalated cases)'
                : "Santasiyo yihariye (imirwayi irembye/yazamuwe)"}
            </h3>
          </div>
          <p className="text-sm text-amber-950/90">
            {en
              ? 'For unstable or worsening cases, record specialized unit placement and expected duration.'
              : "Ku mirwayi irembye cyangwa irushaho kuremba, andika aho yashyizwe n'igihe ateganyijwe kuhaguma."}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-950/80">
                {en ? 'Unit' : 'Santasiyo'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={busy || !receivedHere}
                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">{en ? 'Select…' : 'Hitamo…'}</option>
                {SPECIALIZED_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {en ? u : rwUnitLabel(u)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-950/80">
                {en ? 'Duration (days)' : 'Igihe (iminsi)'}
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={specializedDays}
                onChange={(e) =>
                  setSpecializedDays(Math.max(1, Number(e.target.value) || 1))
                }
                disabled={busy || !receivedHere}
                className="w-28 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={busy || !receivedHere || !unit.trim()}
              onClick={() =>
                run(async () => {
                  await patchCase(c.id, {
                    referralSpecializedCareUnit: unit.trim(),
                    referralSpecializedCareAt: new Date().toISOString(),
                    timelineEvent: {
                      event: `Patient moved to ${unit.trim()} at referral hospital (${specializedDays} day plan)`,
                      actorName: userName ?? 'Referral Hospital',
                      actorRole: 'Referral Hospital',
                    },
                  });
                  toast.success(
                    en
                      ? 'Specialized unit transfer recorded'
                      : 'Kwimurira kuri santasiyo yihariye byanditswe'
                  );
                })
              }
              className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {en
                ? 'Record specialized unit plan'
                : 'Andika gahunda ya santasiyo yihariye'}
            </button>
          </div>
          {c.referralSpecializedCareAt && c.referralSpecializedCareUnit && (
            <p className="text-xs font-medium text-amber-950">
              {c.referralSpecializedCareUnit} ·{' '}
              {new Date(c.referralSpecializedCareAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Outcomes */}
      <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          {en ? 'Outcome' : 'Ibyavuyemo'}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {en
            ? 'Finalize with stable discharge or death for surveillance.'
            : "Rangiza dosiye ushyiraho gusezererwa cyangwa urupfu ku igenzura."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !receivedHere || c.status === 'Discharged'}
            onClick={() =>
              run(async () => {
                await patchCase(c.id, {
                  status: 'Discharged',
                  finalOutcomeHospital: 'Recovered',
                  outcome: 'Treated & Discharged',
                  hospitalDischargeDateTime: new Date().toISOString(),
                  timelineEvent: {
                    event:
                      'Patient clinically stable — discharged from referral hospital',
                    actorName: userName ?? 'Referral Hospital',
                    actorRole: 'Referral Hospital',
                  },
                });
                toast.success(
                  en
                    ? 'Stable discharge recorded'
                    : 'Gusezererwa byanditswe'
                );
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
          >
            {en ? 'Record stable discharge' : 'Andika gusezererwa'}
          </button>
          <button
            type="button"
            disabled={busy || !receivedHere || c.status === 'Deceased'}
            onClick={() => setShowDeathModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
          >
            {en ? 'Record death' : 'Andika urupfu'}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showDeathModal}
        onClose={() => setShowDeathModal(false)}
        title={en ? 'Record patient death?' : "Andika urupfu rw'umurwayi?"}
        message={
          en
            ? 'This will mark the case as deceased and notify the facilities.'
            : 'Ibi bizashyira dosiye ku rupfu kandi bimenyeshe ibigo.'
        }
        confirmText={en ? 'Confirm death' : 'Emeza urupfu'}
        confirmColor="danger"
        onConfirm={() =>
          run(async () => {
            await patchCase(c.id, {
              status: 'Deceased',
              finalOutcomeHospital: 'Deceased',
              outcome: 'Deceased',
              outcomeNotes:
                (c.outcomeNotes ? `${c.outcomeNotes}\n` : '') +
                `Death recorded at referral hospital ${new Date().toISOString()}`,
              timelineEvent: {
                event: 'Patient deceased — outcome recorded at referral hospital',
                actorName: userName ?? 'Referral Hospital',
                actorRole: 'Referral Hospital',
              },
            });
            setShowDeathModal(false);
            toast.success(
              en
                ? 'Outcome recorded — notifications queued'
                : "Ibyavuyemo byanditswe — ubutumwa bwoherejwe"
            );
          })
        }
      />
    </div>
  );
}
