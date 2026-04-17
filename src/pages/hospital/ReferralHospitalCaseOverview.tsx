import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIcon,
  HeartPulseIcon,
  SyringeIcon,
  Building2Icon,
  SkullIcon,
  CheckSquareIcon,
  SquareIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import {
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
  const receivedHere = Boolean(c.referralHospitalReceivedDateTime);
  const showSpecializedUnitSection =
    c.referralClinicalTrend === 'worsening' ||
    c.status === 'Escalated' ||
    Boolean(c.referralSpecializedCareAt);

  const selectedFindings = parsePipeList(c.referralSymptomsUpdate);
  const selectedInpatient = parsePipeList(c.referralInpatientNotes);

  const severeSymptomKeySet = useMemo(
    () => new Set<string>([...SEVERE_SYMPTOMS]),
    []
  );
  /** Older saves used a different checklist; allow clearing those entries. */
  const legacyReferralFindings = useMemo(
    () => selectedFindings.filter((f) => !severeSymptomKeySet.has(f)),
    [selectedFindings, severeSymptomKeySet]
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
            Confirm that the patient has arrived at your referral / provincial
            hospital.
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
                  toast.success('Receipt logged — review continuity of care');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Could not save');
                } finally {
                  setLoggingArrival(false);
                }
              })
            }
            className="rounded-xl bg-[color:var(--role-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loggingArrival ? 'Saving…' : 'Log patient received'}
          </button>
        </div>
      )}

      {/* Continuity of care — HC + District */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <SyringeIcon className="text-[color:var(--role-accent)]" size={20} />
          <h3 className="text-sm font-bold text-slate-900">
            Continuity of care (HC → district → you)
          </h3>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-900">
              Health center — pre-transfer
            </p>
            {hcLines.length > 0 ?
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-800">
                {hcLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            : <p className="mt-2 text-sm text-slate-600">Not recorded in app.</p>}
            <p className="mt-3 text-xs text-slate-500">
              Toward hospital:{' '}
              {c.hcPatientTransferredToHospitalDateTime ?
                new Date(
                  c.hcPatientTransferredToHospitalDateTime
                ).toLocaleString()
              : '—'}{' '}
              · Transport: {c.hcReferralToHospitalTransport ?? '—'}
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--role-accent)]/20 bg-[color:var(--role-accent-soft)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--role-accent)]">
              District hospital — IV / management
            </p>
            <p className="mt-2 text-sm text-slate-800">
              <span className="text-slate-500">Received at DH:</span>{' '}
              {c.hospitalReceivedDateTime ?
                new Date(c.hospitalReceivedDateTime).toLocaleString()
              : '—'}
            </p>
            {c.dhObservationPlannedDays != null && (
              <p className="mt-1 text-sm text-slate-800">
                <span className="text-slate-500">Observation plan:</span>{' '}
                {c.dhObservationPlannedDays} day(s)
                {c.dhObservationStartedAt ?
                  ` · started ${new Date(c.dhObservationStartedAt).toLocaleString()}`
                : ''}
              </p>
            )}
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Management / dosing log (district)
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {c.hospitalManagementMedication?.trim() ?
                c.hospitalManagementMedication
              : '—'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          <strong>Transfer from district escalated:</strong>{' '}
          {c.dhTransferredToReferralHospitalDateTime ?
            new Date(
              c.dhTransferredToReferralHospitalDateTime
            ).toLocaleString()
          : '—'}
        </p>
      </div>

      {/* Severe symptoms — same 12 as CHW */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ActivityIcon className="text-[color:var(--role-accent)]" size={20} />
          <h3 className="text-sm font-bold text-slate-900">
            {en ?
              'Severe malaria symptoms (referral assessment)'
            : 'Ibirwara by’imalariya ikomeye (isuzuma ku bitaro)'}
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          {en ?
            'Same severe signs as the CHW form — select all that apply.'
            : 'Aho bihuye n’ibimenyetso byatanzwe na CHW — hitamo byose bikwiye.'}
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
          {SEVERE_SYMPTOMS.map((label) => {
            const on = selectedFindings.includes(label);
            const display = getSymptomLabel(label, language);
            return (
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
            );
          })}
        </div>

      </div>

      {/* Inpatient / ICU / dialysis — chip pickers */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <HeartPulseIcon className="text-[color:var(--role-accent)]" size={20} />
          <h3 className="text-sm font-bold text-slate-900">
            Treatments & supportive care (inpatient)
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          Document what was <strong>done</strong> for this patient (drugs, fluids, organ support,
          level of care) — not the same as the <strong>symptom / finding</strong> checklist above.
          Tap to toggle.
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
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trend decision */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Clinical trend after observation
        </h3>
        <p className="text-xs text-slate-600">
          After observation/inpatient care, set the trend to guide next action.
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['improving', 'Improving'],
              ['stable', 'Stable'],
              ['worsening', 'Unstable / worsening'],
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
                  toast.success('Trend updated');
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
              Specialized unit (unstable/escalated cases)
            </h3>
          </div>
          <p className="text-sm text-amber-950/90">
            For unstable or worsening cases, record specialized unit placement and
            expected duration.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-950/80">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={busy || !receivedHere}
                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {SPECIALIZED_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-amber-950/80">
                Duration (days)
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
                  toast.success('Specialized unit transfer recorded');
                })
              }
              className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              Record specialized unit plan
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
        <h3 className="text-sm font-bold text-slate-900">Outcome</h3>
        <p className="mt-1 text-sm text-slate-600">
          Finalize with stable discharge or death for surveillance.
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
                toast.success('Stable discharge recorded');
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
          >
            Record stable discharge
          </button>
          <button
            type="button"
            disabled={busy || !receivedHere || c.status === 'Deceased'}
            onClick={() => setShowDeathModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
          >
            <SkullIcon size={18} />
            Record death
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showDeathModal}
        onClose={() => setShowDeathModal(false)}
        title="Record patient death?"
        message="This will mark the case as deceased and notify surveillance (RICH), the health center, and the reporting CHW. Only confirm when death is verified."
        confirmText="Confirm death"
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
            toast.success('Outcome recorded — notifications queued');
          })
        }
      />
    </div>
  );
}
