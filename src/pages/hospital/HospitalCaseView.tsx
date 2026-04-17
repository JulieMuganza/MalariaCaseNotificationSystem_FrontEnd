import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  InfoIcon,
  ArrowUpRightIcon,
  Stethoscope,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useHospitalBasePath } from './useHospitalBasePath';
import type { MalariaCase } from '../../types/domain';
import { ReferralHospitalCaseOverview } from './ReferralHospitalCaseOverview';
import { mergedSymptoms } from './caseHelpers';

type HospitalTab = 'pathway' | 'overview' | 'record';

export function HospitalCaseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const base = useHospitalBasePath();
  const { getCaseByRef, patchCase, ensureCaseLoaded, refresh } = useCasesApi();
  const loadAttempted = useRef<string | null>(null);
  const [caseLoadFinished, setCaseLoadFinished] = useState(false);
  const [caseLoadReason, setCaseLoadReason] = useState<
    null | 'forbidden' | 'not_found' | 'error'
  >(null);
  const [loggingArrival, setLoggingArrival] = useState(false);
  const [pathBusy, setPathBusy] = useState(false);
  const [mgmtNotes, setMgmtNotes] = useState('');
  const [obsDays, setObsDays] = useState(3);
  const [activeTab, setActiveTab] = useState<HospitalTab>('record');

  useEffect(() => {
    if (!id) {
      setCaseLoadFinished(true);
      return;
    }
    loadAttempted.current = null;
    setCaseLoadFinished(false);
    setCaseLoadReason(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (getCaseByRef(id)) {
      setCaseLoadReason(null);
      setCaseLoadFinished(true);
      return;
    }
    if (loadAttempted.current === id) return;
    loadAttempted.current = id;
    void (async () => {
      let didRedirect = false;
      try {
        setCaseLoadReason(null);
        const res = await ensureCaseLoaded(id);
        if (!res.ok) {
          setCaseLoadReason(res.reason);
          return;
        }
        if (res.case.id !== id) {
          didRedirect = true;
          navigate(`${base}/case/${res.case.id}`, { replace: true });
          return;
        }
        void refresh();
      } finally {
        if (!didRedirect) setCaseLoadFinished(true);
      }
    })();
  }, [id, base, getCaseByRef, navigate, refresh, ensureCaseLoaded]);

  const c = id ? getCaseByRef(id) : undefined;

  useEffect(() => {
    if (!c) return;
    setMgmtNotes(c.hospitalManagementMedication ?? '');
    setObsDays(c.dhObservationPlannedDays ?? 3);
  }, [c?.id]);

  useEffect(() => {
    if (!c || !user) return;
    if (
      user.role === 'District Hospital' &&
      c.transferredToReferralHospital
    ) {
      setActiveTab('record');
    } else if (user.role === 'Referral Hospital') {
      setActiveTab('overview');
    } else if (user.role !== 'District Hospital') {
      setActiveTab('record');
    }
  }, [c?.id, user?.role, c?.transferredToReferralHospital]);

  if (!c && !caseLoadFinished) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
    );
  }
  if (!c) {
    if (caseLoadReason === 'forbidden') {
      return (
        <div className="mx-auto max-w-lg space-y-3 py-12 text-center">
          <p className="text-sm font-semibold text-gray-900">
            You can’t open this case from here
          </p>
          <p className="text-sm text-gray-600">
            {user?.role === 'District Hospital' ?
              'If this case was transferred to a referral / provincial hospital, open it from the referral hospital portal, or check that your account district matches the case.'
            : user?.role === 'Referral Hospital' ?
              'The case may not be transferred to your facility yet, or it may belong to another district.'
            : 'Access to this record was denied.'}
          </p>
          <button
            type="button"
            onClick={() =>
              navigate(
                user?.role === 'District Hospital' ?
                  `${base}/triage`
                : `${base}/cases`
              )
            }
            className="text-sm font-medium text-[color:var(--role-accent)] underline">
            Back to list
          </button>
        </div>
      );
    }
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {caseLoadReason === 'not_found' ?
          'Case not found'
        : 'Could not load this case. Try again from the case list.'}
      </div>
    );
  }

  const isDH = user?.role === 'District Hospital';
  const isReferral = user?.role === 'Referral Hospital';
  const isSurveillancePartner =
    user?.role === 'RICH' ||
    user?.role === 'PFTH' ||
    user?.role === 'SFR';
  const showDhPathway = isDH && !c.transferredToReferralHospital;
  const backListPath =
    isDH ? `${base}/triage` : `${base}/cases`;
  const mergedForRecord = mergedSymptoms(c);

  const tabs: { id: HospitalTab; label: string; icon: typeof Stethoscope }[] =
    showDhPathway ?
      [
        { id: 'pathway', label: 'Clinical pathway', icon: Stethoscope },
        { id: 'record', label: 'Patient record', icon: UserCircle2 },
      ]
    : isReferral ?
      [{ id: 'overview', label: 'Overview', icon: Stethoscope }]
    : [{ id: 'record', label: 'Patient record', icon: UserCircle2 }];

  const showTabStrip = tabs.length > 1;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(backListPath)}
        className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ChevronLeftIcon size={16} /> Back to list
      </button>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Case file
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {c.patientName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-mono text-xs text-slate-500">{c.id}</span>
            {' · '}
            <span className="font-mono text-xs">{c.patientCode}</span>
            {' · '}
            {c.sex}, {c.age}y · {c.district}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {showDhPathway ? (
        <div className="space-y-6">
          <DistrictHospitalPathway
            key={c.id}
            c={c}
            patchCase={patchCase}
            userName={user?.name}
            pathBusy={pathBusy}
            setPathBusy={setPathBusy}
            loggingArrival={loggingArrival}
            setLoggingArrival={setLoggingArrival}
            mgmtNotes={mgmtNotes}
            setMgmtNotes={setMgmtNotes}
            obsDays={obsDays}
            setObsDays={setObsDays}
            listPath={backListPath}
          />
          <HospitalAssessmentPanel c={c} />
        </div>
      ) : isReferral ? (
        <div className="space-y-6">
          <ReferralHospitalCaseOverview
            c={c}
            patchCase={patchCase}
            userName={user?.name}
            loggingArrival={loggingArrival}
            setLoggingArrival={setLoggingArrival}
          />
          <HospitalAssessmentPanel c={c} />
        </div>
      ) : (
        <>
          {showTabStrip && (
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const on = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      on ?
                        isSurveillancePartner ?
                          'bg-[#6930c3]/10 text-[#4a148c] ring-1 ring-[#6930c3]/25'
                        : 'bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)] ring-1 ring-[color:var(--role-accent)]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} strokeWidth={2} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

      {activeTab === 'record' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SummaryCard
              title="Demographics"
              items={[
                ['Sex / Age', `${c.sex}, ${c.age}y (${c.ageGroup})`],
                ['Location', `${c.village}, ${c.sector}, ${c.district}`],
                [
                  'Insurance',
                  c.hasInsurance ? c.insuranceType || 'Yes' : 'No',
                ],
              ]}
            />
            <SummaryCard
              title="Disease history"
              items={isSurveillancePartner ?
                [
                  [
                    'First symptom (from CHW)',
                    new Date(c.dateFirstSymptom).toLocaleDateString(),
                  ],
                  [
                    'CHW -> HC transfer time',
                    c.chwTransferDateTime ?
                      new Date(c.chwTransferDateTime).toLocaleString()
                    : 'Not recorded',
                  ],
                  [
                    'HC -> District transfer time',
                    c.hcPatientTransferredToHospitalDateTime ?
                      new Date(c.hcPatientTransferredToHospitalDateTime).toLocaleString()
                    : 'Not recorded',
                  ],
                  [
                    'Treatment received (CHW/HC)',
                    c.hcPreTreatment?.length ?
                      c.hcPreTreatment.join(', ')
                    : 'Not recorded',
                  ],
                ]
              : [
                  [
                    'First symptom',
                    new Date(c.dateFirstSymptom).toLocaleDateString(),
                  ],
                  ['Time to care', c.timeToSeekCare],
                  ['Distance to HC', c.distanceToHC],
                ]}
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Symptoms</h3>
            <p className="mt-1 text-xs text-slate-500">
              Combined from CHW referral, health center record, and triage (de-duplicated).
            </p>
            {mergedForRecord.length > 0 ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-800">
                {mergedForRecord.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Not recorded</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
              <div>
                <span className="text-slate-500">Symptom count (HC record)</span>
                <p className="font-semibold text-slate-900">{c.symptomCount}</p>
              </div>
              <div>
                <span className="text-slate-500">CHW rapid test</span>
                <p className="font-semibold text-slate-900">
                  {c.chwRapidTestResult ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">HC severe malaria test</span>
                <p className="font-semibold text-slate-900">
                  {c.severeMalariaTestResult ?? 'Not recorded'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
}

function HospitalAssessmentPanel({ c }: { c: MalariaCase }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900">
        Clinical summary & hospital record
      </h3>
      <p className="text-xs text-slate-500">
        Read-only summary; pathway actions are above. Severe malaria test and
        outcomes feed surveillance notifications automatically.
      </p>
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div>
          <span className="text-slate-500">Severe malaria test</span>
          <p className="mt-1 font-semibold text-slate-900">
            {c.severeMalariaTestResult || '—'}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Outcome</span>
          <p className="mt-1 font-semibold text-slate-900">
            {c.finalOutcomeHospital || c.outcome || '—'}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Hospital received patient</span>
          <p className="mt-1 font-medium text-slate-900">
            {c.hospitalReceivedDateTime ?
              new Date(c.hospitalReceivedDateTime).toLocaleString()
            : '—'}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Discharge</span>
          <p className="mt-1 font-medium text-slate-900">
            {c.hospitalDischargeDateTime ?
              new Date(c.hospitalDischargeDateTime).toLocaleString()
            : '—'}
          </p>
        </div>
      </div>
      {c.severeMalariaTestResult === 'Positive' && c.hospitalManagementMedication && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-950">
          <strong>Management / medicines</strong> (full detail for RICH; partial
          for HC/CHW in notifications): {c.hospitalManagementMedication}
        </div>
      )}
      {c.phaseRetourEligible && (
        <p className="flex items-start gap-2 rounded-xl bg-[#6930c3]/10 px-3 py-2 text-xs text-[#4a148c]">
          <InfoIcon size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>Phase retour:</strong> when criteria are met, HC and CHW
            receive a partial update; RICH receives the full record.
          </span>
        </p>
      )}
    </div>
  );
}

type PathwayPatch = (
  caseRef: string,
  body: Record<string, unknown>
) => Promise<MalariaCase>;

function DistrictHospitalPathway({
  c,
  patchCase,
  userName,
  pathBusy,
  setPathBusy,
  loggingArrival,
  setLoggingArrival,
  mgmtNotes,
  setMgmtNotes,
  obsDays,
  setObsDays,
  listPath,
}: {
  c: MalariaCase;
  patchCase: PathwayPatch;
  userName?: string;
  setPathBusy: (v: boolean) => void;
  pathBusy: boolean;
  loggingArrival: boolean;
  setLoggingArrival: (v: boolean) => void;
  mgmtNotes: string;
  setMgmtNotes: (v: string) => void;
  obsDays: number;
  setObsDays: (v: number) => void;
  listPath: string;
}) {
  const navigate = useNavigate();
  const clinicalStorageKey = `dh-clinical-course-${c.id}`;
  const [clinicalCourse, setClinicalCourse] = useState<
    'idle' | 'improving' | 'adjusted' | 'not_improving'
  >(() => {
    try {
      const raw = sessionStorage.getItem(clinicalStorageKey);
      if (raw) {
        const v = JSON.parse(raw) as string;
        if (
          v === 'idle' ||
          v === 'improving' ||
          v === 'adjusted' ||
          v === 'not_improving'
        ) {
          return v;
        }
      }
    } catch {
      /* ignore */
    }
    return 'idle';
  });
  const [transferring, setTransferring] = useState(false);
  const [referralTransport, setReferralTransport] = useState<
    '' | 'Self' | 'With relative' | 'Ambulance'
  >(() => c.dhReferralToReferralHospitalTransport ?? '');

  useEffect(() => {
    setReferralTransport(c.dhReferralToReferralHospitalTransport ?? '');
  }, [c.id, c.dhReferralToReferralHospitalTransport]);

  useEffect(() => {
    try {
      sessionStorage.setItem(clinicalStorageKey, JSON.stringify(clinicalCourse));
    } catch {
      /* ignore */
    }
  }, [clinicalStorageKey, clinicalCourse]);

  /** If observation already progressed before this UI (oral ready / saved notes), reopen the improving path */
  useEffect(() => {
    if (clinicalCourse !== 'idle') return;
    const obs = Boolean(c.dhObservationStartedAt);
    const dis = Boolean(c.hospitalDischargeDateTime);
    if (!obs || dis) return;
    const hasNotes = Boolean(c.hospitalManagementMedication?.trim());
    if (c.dhOralTreatmentReadyAt || hasNotes) {
      setClinicalCourse('improving');
    }
  }, [
    c.dhObservationStartedAt,
    c.dhOralTreatmentReadyAt,
    c.hospitalManagementMedication,
    clinicalCourse,
  ]);

  const hcLines = c.hcPreTreatment?.length ? c.hcPreTreatment : [];
  const symptomLines = mergedSymptoms(c);
  const received = Boolean(c.hospitalReceivedDateTime);
  const pre = c.dhHcPreTransferReceived;
  const obsStarted = Boolean(c.dhObservationStartedAt);
  const oralReady = Boolean(c.dhOralTreatmentReadyAt);
  const discharged = Boolean(c.hospitalDischargeDateTime);
  const showIVToDischargePath =
    obsStarted &&
    !discharged &&
    (clinicalCourse === 'improving' || clinicalCourse === 'adjusted');

  const run = async (fn: () => Promise<void>) => {
    setPathBusy(true);
    try {
      await fn();
    } finally {
      setPathBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--role-accent)]/25 bg-[color:var(--role-accent-soft)] p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[color:var(--role-accent)]">
          Severe malaria — district hospital pathway
        </h3>
      </div>

      {/* Health center handoff — compact: meta left, symptoms right */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-800">
          Health center handoff
        </p>
        <div className="mt-3 grid gap-4 text-sm text-slate-800 md:grid-cols-2 md:items-start">
          <div className="space-y-3 md:pr-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                HC severe malaria test
              </span>
              <p className="mt-0.5 text-sm font-medium leading-snug">
                {c.severeMalariaTestResult ?? 'Not recorded'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Means of transport
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600">
                How the patient came from the health center to this district
                hospital.
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">
                {c.hcReferralToHospitalTransport ?? '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Transferred toward this hospital
              </span>
              <p className="mt-0.5 text-sm font-medium leading-snug">
                {c.hcPatientTransferredToHospitalDateTime ?
                  new Date(
                    c.hcPatientTransferredToHospitalDateTime
                  ).toLocaleString()
                : '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-600">
                Pre-transfer treatment at HC
              </span>
              {hcLines.length > 0 ?
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-slate-800">
                  {hcLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              : <p className="mt-1 text-xs text-slate-600">—</p>}
            </div>
          </div>
          <div className="rounded-lg border border-blue-100/80 bg-white/70 p-3 md:min-h-[120px]">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Symptoms
            </span>
            {symptomLines.length > 0 ?
              <ul className="mt-2 max-h-52 list-inside list-disc space-y-0.5 overflow-y-auto text-xs leading-relaxed">
                {symptomLines.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            : <p className="mt-2 text-xs text-slate-600">—</p>}
          </div>
        </div>
      </div>

      {/* Reception */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Reception
        </p>
        {received ?
          <p className="mt-3 text-sm text-slate-800">
            <span className="font-medium text-slate-600">Received at hospital:</span>{' '}
            {new Date(c.hospitalReceivedDateTime!).toLocaleString()}
          </p>
        : <div className="mt-4">
            <button
              type="button"
              disabled={loggingArrival || pathBusy}
              onClick={() =>
                run(async () => {
                  setLoggingArrival(true);
                  try {
                    await patchCase(c.id, {
                      hospitalReceivedDateTime: new Date().toISOString(),
                      status: c.status === 'Escalated' ? 'Admitted' : c.status,
                      timelineEvent: {
                        event: 'Patient received at district hospital',
                        actorName: userName ?? 'District Hospital',
                        actorRole: 'District Hospital',
                      },
                    });
                    toast.success('Recorded');
                  } catch (e) {
                    toast.error(
                      e instanceof Error ? e.message : 'Could not save'
                    );
                  } finally {
                    setLoggingArrival(false);
                  }
                })
              }
              className="shrink-0 rounded-xl bg-[color:var(--role-accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {loggingArrival ? 'Saving…' : 'We received the patient'}
            </button>
          </div>
        }
      </div>

      {/* Step 1 — Pre-transfer confirmation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Step 1 · Pre-transfer treatment
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pathBusy || !received}
            onClick={() =>
              run(async () => {
                await patchCase(c.id, {
                  dhHcPreTransferReceived: true,
                  timelineEvent: {
                    event:
                      'HC pre-transfer treatment confirmed received at district hospital',
                    actorName: userName ?? 'District Hospital',
                    actorRole: 'District Hospital',
                  },
                });
                toast.success('Recorded: pre-transfer received');
              })
            }
            className="rounded-xl bg-[color:var(--role-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Yes — pre-transfer received
          </button>
          <button
            type="button"
            disabled={pathBusy || !received}
            onClick={() =>
              run(async () => {
                await patchCase(c.id, {
                  dhHcPreTransferReceived: false,
                  timelineEvent: {
                    event:
                      'HC pre-transfer not received or incomplete — plan to give at DH',
                    actorName: userName ?? 'District Hospital',
                    actorRole: 'District Hospital',
                  },
                });
                toast.success('Recorded — complete pre-transfer at DH');
              })
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            No / incomplete — give at DH
          </button>
        </div>
        {pre === false && (
          <button
            type="button"
            disabled={pathBusy || !received}
            onClick={() =>
              run(async () => {
                await patchCase(c.id, {
                  dhHcPreTransferReceived: true,
                  timelineEvent: {
                    event: 'Pre-transfer treatment completed at district hospital',
                    actorName: userName ?? 'District Hospital',
                    actorRole: 'District Hospital',
                  },
                });
                toast.success('Pre-transfer at DH recorded');
              })
            }
            className="mt-3 rounded-xl bg-[color:var(--role-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Pre-transfer now completed at district hospital
          </button>
        )}
        {pre !== undefined && (
          <p className="mt-3 text-xs text-slate-500">
            Status:{' '}
            <span className="font-semibold text-slate-800">
              {pre ? 'Pre-transfer OK' : 'Complete pre-transfer at DH'}
            </span>
          </p>
        )}
      </div>

      {/* Step 2 — Observation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Step 2 · Observation (IV care, 1–7 days)
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">
              Planned observation (days)
            </label>
            <select
              value={obsDays}
              onChange={(e) => setObsDays(Number(e.target.value))}
              disabled={obsStarted || pathBusy}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={
              pathBusy ||
              !received ||
              pre === undefined ||
              obsStarted ||
              discharged
            }
            onClick={() =>
              run(async () => {
                await patchCase(c.id, {
                  dhObservationPlannedDays: obsDays,
                  dhObservationStartedAt: new Date().toISOString(),
                  status: 'Admitted',
                  timelineEvent: {
                    event: `Observation / IV care started (${obsDays} day plan)`,
                    actorName: userName ?? 'District Hospital',
                    actorRole: 'District Hospital',
                  },
                });
                toast.success('Observation started');
              })
            }
            className="rounded-xl bg-[#007ea7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006494] disabled:opacity-50"
          >
            {obsStarted ? 'Observation in progress' : 'Start observation (admit IV)'}
          </button>
        </div>
        {obsStarted && c.dhObservationStartedAt && (
          <p className="text-xs text-slate-600">
            Started {new Date(c.dhObservationStartedAt).toLocaleString()}
            {c.dhObservationPlannedDays ?
              ` · plan ${c.dhObservationPlannedDays} day(s)`
            : ''}
          </p>
        )}

        {obsStarted && !discharged && clinicalCourse === 'idle' && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Observation
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pathBusy}
                onClick={() =>
                  run(async () => {
                    setClinicalCourse('improving');
                    await patchCase(c.id, {
                      timelineEvent: {
                        event: 'Observation update — clinically improving',
                        actorName: userName ?? 'District Hospital',
                        actorRole: 'District Hospital',
                      },
                    });
                    toast.success('Recorded');
                  })
                }
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Improving
              </button>
              <button
                type="button"
                disabled={pathBusy}
                onClick={() =>
                  run(async () => {
                    setClinicalCourse('adjusted');
                    await patchCase(c.id, {
                      timelineEvent: {
                        event:
                          'Observation update — treatment adjusted (see management notes)',
                        actorName: userName ?? 'District Hospital',
                        actorRole: 'District Hospital',
                      },
                    });
                    toast.success('Recorded');
                  })
                }
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Adjusted dosing
              </button>
              <button
                type="button"
                disabled={pathBusy}
                onClick={() =>
                  run(async () => {
                    setClinicalCourse('not_improving');
                    await patchCase(c.id, {
                      timelineEvent: {
                        event:
                          'Observation update — not improving; referral required',
                        actorName: userName ?? 'District Hospital',
                        actorRole: 'District Hospital',
                      },
                    });
                    toast.success('Recorded');
                  })
                }
                className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100"
              >
                Not improving — need referral
              </button>
            </div>
          </div>
        )}
      </div>

      {showIVToDischargePath && (
        <>
          {/* Step 3 — Management notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Step 3 · IV / inpatient management notes
            </p>
            <textarea
              value={mgmtNotes}
              onChange={(e) => setMgmtNotes(e.target.value)}
              rows={4}
              disabled={pathBusy || discharged}
              placeholder="IV artesunate, fluids, antibiotics, monitoring…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={pathBusy || discharged || !obsStarted}
              onClick={() =>
                run(async () => {
                  await patchCase(c.id, {
                    hospitalManagementMedication: mgmtNotes.trim() || undefined,
                    timelineEvent: {
                      event: 'Hospital management / dosing updated',
                      actorName: userName ?? 'District Hospital',
                      actorRole: 'District Hospital',
                    },
                  });
                  toast.success('Management notes saved');
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Save notes
            </button>
          </div>

          {/* Step 4 — Oral ready */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Step 4 · Oral treatment (step-down)
            </p>
            <button
              type="button"
              disabled={pathBusy || !obsStarted || oralReady || discharged}
              onClick={() =>
                run(async () => {
                  await patchCase(c.id, {
                    dhOralTreatmentReadyAt: new Date().toISOString(),
                    timelineEvent: {
                      event: 'Patient ready for oral treatment (step-down)',
                      actorName: userName ?? 'District Hospital',
                      actorRole: 'District Hospital',
                    },
                  });
                  toast.success('Oral treatment step recorded');
                })
              }
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {oralReady ? 'Oral treatment recorded' : 'Mark ready for oral treatment'}
            </button>
            {oralReady && c.dhOralTreatmentReadyAt && (
              <p className="text-xs text-slate-600">
                {new Date(c.dhOralTreatmentReadyAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Step 5 — Discharge home */}
          <div className="rounded-2xl border border-[color:var(--role-accent)]/25 bg-[color:var(--role-accent-soft)] p-6 shadow-sm space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--role-accent)]">
              Step 5 · Discharge home (improved)
            </p>
            <button
              type="button"
              disabled={pathBusy || discharged || !oralReady}
              onClick={() =>
                run(async () => {
                  await patchCase(c.id, {
                    status: 'Discharged',
                    hospitalDischargeDateTime: new Date().toISOString(),
                    finalOutcomeHospital: 'Recovered',
                    outcome: 'Treated & Discharged',
                    timelineEvent: {
                      event: 'Patient discharged home — improved on oral treatment',
                      actorName: userName ?? 'District Hospital',
                      actorRole: 'District Hospital',
                    },
                  });
                  toast.success('Discharge recorded');
                })
              }
              className="rounded-xl bg-[color:var(--role-accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {discharged ? 'Discharged' : 'Discharge patient home (oral follow-up)'}
            </button>
            {discharged && c.hospitalDischargeDateTime && (
              <p className="text-xs font-medium text-[color:var(--role-accent)]">
                {new Date(c.hospitalDischargeDateTime).toLocaleString()}
              </p>
            )}
          </div>
        </>
      )}

      {/* Referral — only after “not improving”; hide after discharge */}
      {!discharged && clinicalCourse === 'not_improving' && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-rose-950">
            <ArrowUpRightIcon size={18} />
            Referral / provincial hospital transfer
          </h3>
          <div>
            <label className="mb-1 block text-xs font-semibold text-rose-900">
              Means of transport to referral hospital
            </label>
            <p className="mb-2 text-[11px] text-rose-800/90">
              How this patient will travel from the district hospital to the
              referral / provincial facility.
            </p>
            <select
              value={referralTransport}
              onChange={(e) =>
                setReferralTransport(
                  e.target.value as '' | 'Self' | 'With relative' | 'Ambulance'
                )
              }
              disabled={transferring}
              className="w-full max-w-sm rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="">Select transport…</option>
              <option value="Self">Self</option>
              <option value="With relative">With relative</option>
              <option value="Ambulance">Ambulance</option>
            </select>
          </div>
          <button
            type="button"
            disabled={transferring || !referralTransport}
            onClick={async () => {
              if (!referralTransport) return;
              setTransferring(true);
              try {
                await patchCase(c.id, {
                  dhTransferredToReferralHospitalDateTime:
                    new Date().toISOString(),
                  dhReferralToReferralHospitalTransport: referralTransport,
                  timelineEvent: {
                    event: `Patient transferred to referral hospital (transport: ${referralTransport})`,
                    actorName: userName ?? 'District Hospital',
                    actorRole: 'District Hospital',
                  },
                });
                toast.success('Referral hospital and RICH notified');
                navigate(listPath);
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : 'Transfer failed'
                );
              } finally {
                setTransferring(false);
              }
            }}
            className="w-full rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 disabled:opacity-60 sm:w-auto"
          >
            {transferring ?
              'Sending…'
            : 'Confirm transfer to referral hospital'}
          </button>
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h4>
      <div className="space-y-2 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
