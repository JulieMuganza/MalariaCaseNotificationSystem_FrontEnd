import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ActivityIcon,
  PlusIcon,
  ClockIcon,
  StethoscopeIcon,
  SaveIcon,
  MapPinIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  HC_TRIAGE_SYMPTOMS,
  PEDIATRIC_DANGER_SIGNS,
  PEDIATRIC_DANGER_SIGNS_PARENT,
  getSymptomLabel,
} from '../../data/mockData';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { ApiRequestError } from '../../lib/api';
import { useFirstLineBasePath } from './useFirstLineBasePath';
import {
  coerceFacilityTransport,
  FACILITY_TRANSPORT_LABELS,
  FACILITY_TRANSPORT_VALUES,
  type FacilityTransportMode,
} from '../../constants/facilityTransport';

function errorMessage(e: unknown): string {
  if (e instanceof ApiRequestError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Unknown error';
}

const sectionHeaderClass =
  'mb-4 flex items-center gap-2 border-b border-gray-100 pb-3';
const sectionTitleClass = 'text-sm font-semibold text-gray-900';

type HcTransport = FacilityTransportMode;
const HC_TEST_OPTIONS = ['TDR', 'Blood stream'] as const;
const PRE_TRANSFER_OPTIONS = ['Injectable', 'Pills'] as const;
const PRE_TRANSFER_OPTION_LABELS: Record<
  (typeof PRE_TRANSFER_OPTIONS)[number],
  { en: string; rw: string }
> = {
  Injectable: { en: 'Injectable', rw: 'Urushinge' },
  Pills: { en: 'Pills', rw: 'Ibinini' },
};

/** MalariaSync HC pathway is severe malaria only — species fixed for national reporting context */
const HC_MALARIA_SPECIES = 'Falciparum';

export function HCCaseManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const { getCaseByRef, loading, patchCase, refresh, ensureCaseLoaded } =
    useCasesApi();
  const { user } = useAuth();
  const base = useFirstLineBasePath();
  const isLocalClinic = user?.role === 'Local Clinic';
  const facilityLabelEn = isLocalClinic ? 'Health Post' : 'Health Center';
  const facilityLabelRw = isLocalClinic ? 'Ivuriro Riciriritse' : 'Ikigo Nderabuzima';
  const loadAttemptedForId = useRef<string | null>(null);
  const [fetchingCase, setFetchingCase] = useState(false);
  const [caseLoadReason, setCaseLoadReason] = useState<
    null | 'forbidden' | 'not_found' | 'error'
  >(null);

  useEffect(() => {
    loadAttemptedForId.current = null;
    setCaseLoadReason(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (getCaseByRef(id)) return;
    if (loadAttemptedForId.current === id) return;
    loadAttemptedForId.current = id;

    let alive = true;
    setFetchingCase(true);
    void (async () => {
      try {
        setCaseLoadReason(null);
        const res = await ensureCaseLoaded(id);
        if (!alive) return;
        if (!res.ok) {
          setCaseLoadReason(res.reason);
          return;
        }
        void refresh();
      } finally {
        if (alive) setFetchingCase(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, getCaseByRef, refresh, ensureCaseLoaded]);

  const c = id ? getCaseByRef(id) : undefined;
  const hasReferralSnapshot = Boolean(
    (c?.chwSymptoms?.length ?? 0) > 0 || c?.chwRapidTestResult
  );
  const wasReferredByChw = Boolean(
    c?.timeline?.some((entry) => String(entry.role).toUpperCase() === 'CHW')
  );

  const [weight, setWeight] = useState<number | ''>(c?.weight || '');
  const [triageSymptoms, setTriageSymptoms] = useState<string[]>([]);
  const [showPediatricDangerSigns, setShowPediatricDangerSigns] = useState(false);
  const hasPediatricDangerSignsSelected = triageSymptoms.some((s) =>
    PEDIATRIC_DANGER_SIGNS.includes(
      s as (typeof PEDIATRIC_DANGER_SIGNS)[number]
    )
  );
  const [testResult, setTestResult] = useState<'Positive' | 'Negative' | ''>(
    c?.severeMalariaTestResult || ''
  );
  const [treatmentLog, setTreatmentLog] = useState<{drug: string, dose: string, route: string, time: string}[]>(c?.hcTreatments || []);
  const [selectedDrug, setSelectedDrug] = useState<'Artesunate' | 'Artemeter'>('Artesunate');
  const [referralTransport, setReferralTransport] = useState<HcTransport>(
    coerceFacilityTransport(c?.hcReferralToHospitalTransport, 'Walk')
  );
  const [arrivalTransport, setArrivalTransport] = useState(
    coerceFacilityTransport(c?.transportMode, 'Walk')
  );
  const [selectedTests, setSelectedTests] = useState<string[]>(
    c?.testType ? c.testType.split(';').map((x) => x.trim()).filter(Boolean) : []
  );
  const [preTransferType, setPreTransferType] = useState<
    (typeof PRE_TRANSFER_OPTIONS)[number]
  >('Injectable');
  const [treatmentGivenAtFacility, setTreatmentGivenAtFacility] = useState<
    'Yes' | 'No' | ''
  >('');

  const [showEscalate, setShowEscalate] = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!c) return;
    setWeight(c.weight || '');
    setTriageSymptoms(
      (c.symptoms || []).filter((s) =>
        (HC_TRIAGE_SYMPTOMS as readonly string[]).includes(s)
      )
    );
    setTestResult(c.severeMalariaTestResult || '');
    setTreatmentLog(c.hcTreatments || []);
    setReferralTransport(
      coerceFacilityTransport(c.hcReferralToHospitalTransport, 'Walk')
    );
    setArrivalTransport(coerceFacilityTransport(c.transportMode, 'Walk'));
    setSelectedTests(
      c.testType ? c.testType.split(';').map((x) => x.trim()).filter(Boolean) : []
    );
    const lines = c.hcPreTreatment ?? [];
    const noTreatmentRecorded = lines.some((line) =>
      line.toLowerCase().includes('pre-transfer treatment given: no')
    );
    if (noTreatmentRecorded) {
      setTreatmentGivenAtFacility('No');
      setPreTransferType('Injectable');
    } else {
      const modeLine = lines.find((line) =>
        line.toLowerCase().startsWith('pre-transfer mode:')
      );
      const parsedMode = modeLine?.split(':')[1]?.trim();
      if (parsedMode === 'Injectable' || parsedMode === 'Pills') {
        setPreTransferType(parsedMode);
        setTreatmentGivenAtFacility('Yes');
      } else if (parsedMode === 'Out of stock') {
        setPreTransferType('Injectable');
        setTreatmentGivenAtFacility('No');
      } else if (
        lines.some((line) =>
          /artesunate|artemeter|mg\/kg|pre-transfer mode:/i.test(line)
        )
      ) {
        setTreatmentGivenAtFacility('Yes');
        setPreTransferType('Injectable');
      } else {
        setTreatmentGivenAtFacility('');
        setPreTransferType('Injectable');
      }
    }
  }, [c?.id]);

  useEffect(() => {
    if (testResult === 'Negative') {
      setTreatmentGivenAtFacility('');
    }
  }, [testResult]);

  useEffect(() => {
    if (
      triageSymptoms.some((s) =>
        PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number])
      )
    ) {
      setShowPediatricDangerSigns(true);
    }
  }, [triageSymptoms]);

  const suggestedDose = useMemo(() => {
    if (!weight || typeof weight !== 'number') return null;
    if (selectedDrug === 'Artesunate') {
      const perKg = weight <= 20 ? 3.0 : 2.4;
      return { val: (weight * perKg).toFixed(1), unit: 'mg', label: `Artesunate (${perKg}mg/kg)` };
    }
    return { val: (weight * 3.2).toFixed(1), unit: 'mg', label: 'Artemeter IM (3.2mg/kg)' };
  }, [weight, selectedDrug]);

  /** Must run on every render (before any return) — same deps as treatment/pre-transfer UI. */
  const preTransferLines = useMemo(() => {
    const modeLine = `Pre-transfer mode: ${preTransferType}`;
    const doseLines = treatmentLog.map(
      (e) => `${e.drug} ${e.dose} ${e.route} @ ${new Date(e.time).toLocaleString()}`
    );
    return [modeLine, ...doseLines];
  }, [preTransferType, treatmentLog]);

  const coreTriageSymptoms = useMemo(
    () =>
      HC_TRIAGE_SYMPTOMS.filter(
        (s) =>
          s !== PEDIATRIC_DANGER_SIGNS_PARENT &&
          !PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number])
      ),
    []
  );

  /** Must run before any conditional return — same deps as patch payload / treatment UI. */
  const hcPreTreatmentPayload = useMemo(() => {
    if (testResult === 'Negative') return [];
    if (testResult === 'Positive' && treatmentGivenAtFacility === 'No') {
      return ['Pre-transfer treatment given: No'];
    }
    if (testResult === 'Positive' && treatmentGivenAtFacility === 'Yes') {
      return preTransferLines.length > 0 ? preTransferLines : (c?.hcPreTreatment ?? []);
    }
    return preTransferLines.length > 0 ? preTransferLines : (c?.hcPreTreatment ?? []);
  }, [
    testResult,
    treatmentGivenAtFacility,
    preTransferLines,
    c?.hcPreTreatment,
  ]);

  if ((loading || fetchingCase) && !c) {
    return (
      <div className="p-20 text-center text-sm font-medium text-gray-400 animate-pulse">
        {en ? 'Loading clinical file…' : 'Birakurura…'}
      </div>
    );
  }
  if (!c) {
    if (caseLoadReason === 'forbidden') {
      return (
        <div className="mx-auto max-w-lg p-12 text-center">
          <p className="text-sm font-semibold text-gray-900">
            {en ? 'You can’t open this case' : 'Ntushobora gufungura iyi dosiye'}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {en ?
              'It may belong to another district or your role may not include this record.'
            : 'Byaba mu karere cyangwa se ntacyo uburenganzira.'}
          </p>
        </div>
      );
    }
    return (
      <div className="p-20 text-center text-sm font-medium text-gray-500">
        {caseLoadReason === 'not_found' ?
          en ?
            'Clinical file not found'
          : 'Ntabwo byabonetse'
        : en ?
          'Could not load this case'
        : 'Ntibyashobotse'}
      </div>
    );
  }

  const normalizedSymptoms =
    triageSymptoms.length > 0
      ? triageSymptoms
      : c?.symptoms?.length
        ? c.symptoms
        : (c?.chwSymptoms ?? []);

  const severeMalariaPositive = testResult === 'Positive';

  const saveClinicalData = async (extraUpdate: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      await patchCase(c.id, {
        severeMalariaTestResult: testResult || undefined,
        plasmodiumSpecies: HC_MALARIA_SPECIES,
        testType: selectedTests.length ? selectedTests.join('; ') : undefined,
        hcPreTreatment: hcPreTreatmentPayload,
        transportMode: arrivalTransport,
        symptoms: normalizedSymptoms,
        ...extraUpdate,
      });
      toast.success(en ? 'Clinical record updated' : 'Amakuru yabitswe');
      return true;
    } catch (e) {
      toast.error(
        en ? `Save failed: ${errorMessage(e)}` : `Kubika byanze: ${errorMessage(e)}`
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  async function executeEscalationToDistrict() {
    setShowEscalate(false);
    if (!c) return;
    if (testResult !== 'Positive') {
      toast.error(
        en
          ? 'Referral applies when severe malaria test is positive.'
          : 'Kohereza bisaba ko ikizamini giteganya malariya ikomeye ari positive.'
      );
      return;
    }
    if (treatmentGivenAtFacility === '') {
      toast.error(
        en
          ? 'Select whether treatment was given before referring.'
          : 'Hitamo ko ubuvuzi bwatanzwe mbere yo kohereza.'
      );
      return;
    }
    if (normalizedSymptoms.length === 0) {
      toast.error(
        en
          ? 'Select at least one symptom before referring to district hospital.'
          : "Hitamo nibura ikimenyetso kimwe mbere yo kohereza ku bitaro by'akarere."
      );
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const referredWithTreatment = treatmentGivenAtFacility === 'Yes';
    try {
      await patchCase(c.id, {
        severeMalariaTestResult: testResult || undefined,
        plasmodiumSpecies: HC_MALARIA_SPECIES,
        testType: selectedTests.length ? selectedTests.join('; ') : undefined,
        hcPreTreatment: hcPreTreatmentPayload,
        transportMode: arrivalTransport,
        symptoms: normalizedSymptoms,
        status: 'Escalated',
        hcPatientTransferredToHospitalDateTime: now,
        hcReferralToHospitalTransport: referralTransport,
        hcPatientReceivedDateTime: c.hcPatientReceivedDateTime ?? now,
        timelineEvent: {
          event:
            referredWithTreatment ?
              isLocalClinic
                ? 'Patient referred from health post to district hospital (pre-transfer treatment on record)'
                : 'Patient referred from health center to district hospital (pre-transfer treatment on record)'
            : isLocalClinic ?
              'Patient referred from health post to district hospital (no pre-transfer treatment)'
            : 'Patient referred from health center to district hospital (no pre-transfer treatment)',
          actorName: user?.name ?? (isLocalClinic ? 'Health Post' : 'Health Center'),
          actorRole: isLocalClinic ? 'Health Post' : 'Health Center',
        },
      });
      toast.success(
        en
          ? 'District hospital and RICH have been notified.'
          : 'Byamenyeshejwe ku bitaro n’RICH.'
      );
      navigate(base);
    } catch (e) {
      const detail = errorMessage(e);
      toast.error(
        en
          ? `Referral failed: ${detail}`
          : `Kohereza byanze: ${detail}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(base)}
            className="group mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[color:var(--role-accent)]"
          >
            <ChevronLeftIcon size={16} className="transition-transform group-hover:-translate-x-0.5" />
            {en ? 'Back to dashboard' : 'Subira inyuma'}
          </button>
          <div className="flex flex-wrap items-center gap-3">
             <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{c.patientName}</h1>
             <StatusBadge status={c.status} isHealthPost={isLocalClinic} />
          </div>
          <p className="mt-2 text-sm font-medium tracking-tight text-gray-500">
            ID: <span className="font-mono text-gray-400">#{c.id.slice(-8).toUpperCase()}</span> • {c.age} {en ? 'Years' : 'Imyaka'} • {c.sex === 'Female' ? (en ? 'Female' : 'Gore') : c.sex === 'Male' ? (en ? 'Male' : 'Gabo') : c.sex} • {c.village}, {c.district}
          </p>
        </div>
        <div className="flex items-center gap-3">
           {(c.status === 'Pending' || c.status === 'Referred') && (
             <button
               onClick={() =>
                 saveClinicalData({
                   status: 'HC Received',
                   hcPatientReceivedDateTime: new Date().toISOString(),
                 })
               }
               className="flex items-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
             >
               <CheckCircleIcon size={16} /> {en ? 'Confirm Reception' : 'Yakira Umurwayi'}
             </button>
           )}
           <button
             onClick={() => saveClinicalData()}
             disabled={saving}
             className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-95"
           >
             <SaveIcon size={14} /> {en ? 'Save Changes' : 'Bika Amakuru'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-8">
          {hasReferralSnapshot ? (
            <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-6 shadow-sm">
              <div className={sectionHeaderClass}>
                <StethoscopeIcon
                  size={16}
                  className="text-[color:var(--role-accent)]"
                />
                <h2 className={sectionTitleClass}>
                  {wasReferredByChw
                    ? en
                      ? 'CHW notification (referral)'
                      : 'Ubutumwa bw’Umujyanama'
                    : en
                      ? 'Direct patient intake'
                      : `Umurwayi wakiriwe kuri ${facilityLabelRw.toLowerCase()}`}
                </h2>
              </div>
              {wasReferredByChw && c.chwRapidTestResult ? (
                <p className="mb-3 text-sm font-semibold text-gray-800">
                  {en ? 'Rapid test (CHW): ' : 'Ikizamini cyihuse: '}
                  <span className="text-[color:var(--role-accent)]">
                    {c.chwRapidTestResult}
                  </span>
                </p>
              ) : !wasReferredByChw ? (
                <p className="mb-3 text-sm font-semibold text-gray-800">
                  {en ? 'Rapid test: ' : 'Ikizamini cyihuse: '}
                  <span className="text-[color:var(--role-accent)]">
                    {!c.chwRapidTestResult || c.chwRapidTestResult === 'Negative'
                      ? en
                        ? 'Not taken'
                        : 'Ntacyakozwe'
                      : c.chwRapidTestResult}
                  </span>
                </p>
              ) : null}
              {c.chwSymptoms && c.chwSymptoms.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                  {c.chwSymptoms.map((s) => (
                    <li key={s}>{getSymptomLabel(s, language)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">
                  {wasReferredByChw
                    ? en
                      ? 'No severe symptoms were recorded by the CHW on this referral.'
                      : 'Nta bimenyetso by’ikarire byanditswe na CHW.'
                    : en
                      ? `This patient was registered directly at the ${facilityLabelEn.toLowerCase()}.`
                      : `Uyu murwayi yanditswe kuri ${facilityLabelRw.toLowerCase()} aturutse iwe.`}
                </p>
              )}
            </section>
          ) : null}

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className={sectionHeaderClass}>
              <MapPinIcon size={16} className="text-[color:var(--role-accent)]" />
              <h2 className={sectionTitleClass}>
                {en ? 'Patient arrival at facility' : 'Uko umurwayi yageze'}
              </h2>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              {en
                ? `How did the patient reach the ${facilityLabelEn.toLowerCase()}?`
                : `Umurwayi yageze ate kuri ${facilityLabelRw.toLowerCase()}?`}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {FACILITY_TRANSPORT_VALUES.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setArrivalTransport(opt)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    arrivalTransport === opt
                      ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {en ? FACILITY_TRANSPORT_LABELS[opt].en : FACILITY_TRANSPORT_LABELS[opt].rw}
                </button>
              ))}
            </div>
          </section>

          {/* Main Assessment Grid — equal columns; items-start avoids stretching short blocks */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
             {/* Triage Section */}
             <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className={sectionHeaderClass}>
                   <StethoscopeIcon size={16} className="text-[color:var(--role-accent)]" />
                   <h2 className={sectionTitleClass}>{en ? 'Clinical Triage' : 'Gushungura'}</h2>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                   {coreTriageSymptoms.map(s => (
                     <label 
                       key={s} 
                       className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${triageSymptoms.includes(s) ? 'bg-[color:var(--role-accent-soft)] border-[color:var(--role-accent)]/20' : 'bg-white border-gray-50 hover:bg-gray-50'}`}
                     >
                      <span className={`text-xs font-bold ${triageSymptoms.includes(s) ? 'text-[color:var(--role-accent)]' : 'text-gray-600'}`}>
                        {getSymptomLabel(s, language)}
                      </span>
                       <input 
                         type="checkbox" 
                         className="h-4 w-4 rounded border-gray-300 text-[color:var(--role-accent)] focus:ring-[color:var(--role-accent)]/30" 
                         checked={triageSymptoms.includes(s)}
                         onChange={() => setTriageSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                       />
                     </label>
                   ))}
                   <button
                     type="button"
                     onClick={() =>
                       setShowPediatricDangerSigns((prev) => !prev)
                     }
                     className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                       showPediatricDangerSigns || hasPediatricDangerSignsSelected
                         ? 'bg-[color:var(--role-accent-soft)] border-[color:var(--role-accent)]/20 text-[color:var(--role-accent)]'
                         : 'bg-white border-gray-50 text-gray-700 hover:bg-gray-50'
                     }`}
                   >
                     <span className="text-xs font-bold">
                       {getSymptomLabel(PEDIATRIC_DANGER_SIGNS_PARENT, language)}
                     </span>
                     <ChevronDownIcon
                       size={14}
                       className={`transition-transform ${
                         showPediatricDangerSigns ? 'rotate-180' : ''
                       }`}
                     />
                   </button>
                </div>
                {showPediatricDangerSigns && (
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {PEDIATRIC_DANGER_SIGNS.map((s) => (
                      <label
                        key={s}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${triageSymptoms.includes(s) ? 'bg-[color:var(--role-accent-soft)] border-[color:var(--role-accent)]/20' : 'bg-white border-gray-50 hover:bg-gray-50'}`}
                      >
                        <span className={`text-xs font-bold ${triageSymptoms.includes(s) ? 'text-[color:var(--role-accent)]' : 'text-gray-600'}`}>
                          {getSymptomLabel(s, language)}
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-[color:var(--role-accent)] focus:ring-[color:var(--role-accent)]/30"
                          checked={triageSymptoms.includes(s)}
                          onChange={() =>
                            setTriageSymptoms((prev) =>
                              prev.includes(s)
                                ? prev.filter((x) => x !== s)
                                : [...prev, s]
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}
             </section>

             <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                   <div className={sectionHeaderClass}>
                      <ActivityIcon size={16} className="text-[color:var(--role-accent)]" />
                      <h2 className={sectionTitleClass}>{en ? 'Diagnostic Gate' : 'Ibizamini'}</h2>
                   </div>
                   <div className="space-y-4">
                      <div className="flex bg-gray-50 p-1 rounded-xl">
                         {['Positive', 'Negative'].map(res => (
                           <button
                             key={res}
                             onClick={() => setTestResult(res as any)}
                             className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${testResult === res ? 'bg-white text-[color:var(--role-accent)] shadow-sm' : 'text-gray-400'}`}
                           >
                             {res}
                           </button>
                         ))}
                      </div>
                      <p className="text-xs leading-relaxed text-gray-500">
                        {en
                          ? 'Use this section to diagnose severe malaria. If the test is negative and symptoms do not match malaria, complete care and discharge.'
                          : 'Koresha iki gice mu gusuzuma malariya ikomeye. Niba ikizamini ni negative kandi ibimenyetso bitari bya malariya, ranga ubuvuzi ukoreshe gusezerera.'}
                      </p>
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {en ? 'Tests performed' : 'Ibizamini byakozwe'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {HC_TEST_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setSelectedTests((prev) =>
                                  prev.includes(opt)
                                    ? prev.filter((x) => x !== opt)
                                    : [...prev, opt]
                                )
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                                selectedTests.includes(opt)
                                  ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                                  : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                   </div>
                </section>

          </div>

          {/* Treatment History — full width so dose + log grid has room */}
          {severeMalariaPositive && (
                <section className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                   <div className={sectionHeaderClass}>
                      <ClockIcon size={16} className="text-[color:var(--role-accent)]" />
                      <h2 className={sectionTitleClass}>{en ? 'Treatment History' : 'Ubuvuzi bw\'ibanze'}</h2>
                   </div>

                   <p className="mb-4 text-xs font-medium text-gray-600">
                     {en
                       ? 'Was pre-transfer treatment given at this facility before referral?'
                       : 'Umuti watangiwe mbere yo kohereza ku bitaro by’akarere?'}
                   </p>
                   <div className="mb-6 flex flex-wrap gap-2">
                     {(['Yes', 'No'] as const).map((opt) => (
                       <button
                         key={opt}
                         type="button"
                         onClick={() => {
                           setTreatmentGivenAtFacility(opt);
                           if (opt === 'No') {
                             setWeight('');
                             setTreatmentLog([]);
                             setPreTransferType('Injectable');
                           }
                         }}
                         className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                           treatmentGivenAtFacility === opt
                             ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                             : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                         }`}
                       >
                         {opt === 'Yes'
                           ? en
                             ? 'Yes,  treatment given'
                             : 'Yego, hatanzwe umuti'
                           : en
                             ? 'No, refer without treatment'
                             : 'Oya, kohereza nta muti ahawe'}
                       </button>
                     ))}
                   </div>

                   {treatmentGivenAtFacility === 'No' && (
                     <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                       {en
                         ? 'Referral will send the patient to the district hospital with no pre-transfer treatment recorded. Choose transport and use Refer below.'
                         : 'Kohereza bizohereza umurwayi ku bitaro by’akarere nta muti watanzwe. Hitamo urugendo uhitemo Kohereza hepfo.'}
                     </p>
                   )}

                   {treatmentGivenAtFacility === 'Yes' && (
                   <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                      <div className="space-y-4">
                         <p className="text-xs font-semibold text-gray-800">
                           {en ? 'Assessment' : 'Ibipimo'}
                         </p>
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">{en ? 'Body Weight (kg)' : 'Ibiro'}</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value) || '')}
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 text-2xl font-black text-gray-900 focus:ring-2 focus:ring-[color:var(--role-accent)]/20 transition-all placeholder:text-gray-200"
                                placeholder="0.0"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase text-sm">kg</span>
                            </div>
                         </div>
                         <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
                            {['Artesunate', 'Artemeter'].map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSelectedDrug(d as any)}
                                className={`flex-1 min-w-0 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedDrug === d ? 'bg-white text-[color:var(--role-accent)] shadow-sm' : 'text-gray-400'}`}
                              >
                                {d}
                              </button>
                            ))}
                         </div>
                         
                         {suggestedDose ? (
                           <div className="rounded-2xl bg-[color:var(--role-accent)] p-6 text-white shadow-lg">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{en ? 'Calculated Dose' : 'Dosage'}</p>
                              <div className="text-4xl font-black mb-4">{suggestedDose.val}<span className="text-sm ml-1 opacity-60">MG</span></div>
                              <p className="text-xs font-bold leading-tight opacity-80 mb-6">{suggestedDose.label}</p>
                              <button
                                onClick={() => {
                                  const newEntry = { drug: selectedDrug, dose: `${suggestedDose.val}${suggestedDose.unit}`, route: selectedDrug === 'Artesunate' ? 'IV/IM' : 'IM', time: new Date().toISOString() };
                                  setTreatmentLog(prev => [...prev, newEntry]);
                                  toast.success(en ? 'Dose added' : 'Dose yongeweho');
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-[color:var(--role-accent)] font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-lg"
                              >
                                 <PlusIcon size={12} /> {en ? 'Log Dose' : 'Andika'}
                              </button>
                           </div>
                         ) : (
                           <div className="py-12 border border-dashed border-gray-200 rounded-2xl text-center text-[10px] font-black text-gray-300 uppercase tracking-widest px-6">
                              {en ? 'Enter weight to calculate dose' : 'Shyiramo ibiro'}
                           </div>
                         )}

                      </div>

                      <div className="space-y-3">
                         {treatmentLog.length === 0 ? (
                           <div className="py-8 text-center text-xs font-bold uppercase tracking-widest text-gray-300 italic">{en ? 'No records yet' : 'Ntabwo hari amakuru'}</div>
                         ) : (
                           <div className="divide-y divide-gray-50 border border-gray-50 rounded-2xl overflow-hidden">
                              {treatmentLog.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors group">
                                   <div className="flex items-center gap-4">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--role-accent-soft)] text-xs font-semibold text-[color:var(--role-accent)]">{treatmentLog.length - idx}</div>
                                      <div>
                                         <p className="text-xs font-bold text-gray-900">{entry.drug} • {entry.dose}</p>
                                         <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{entry.route} • {new Date(entry.time).toLocaleTimeString()}</p>
                                      </div>
                                   </div>
                                   <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircleIcon size={14} /></div>
                                </div>
                              ))}
                           </div>
                         )}

                         <section className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 shadow-sm">
                            <h4 className="mb-1 text-sm font-semibold text-gray-900">
                              {en ? 'Pre-transfer referral' : 'Kohereza mbere'}
                            </h4>

                            <p className="mb-2 text-xs font-medium text-gray-600">
                              {en ? 'Pre-transfer treatment mode' : "Uburyo bw'ubuvuzi mbere yo kohereza"}
                            </p>
                            <div className="space-y-2">
                              {PRE_TRANSFER_OPTIONS.map((opt) => (
                                <label
                                  key={opt}
                                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                    preTransferType === opt
                                      ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
                                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="hc-pretransfer-mode"
                                    className="h-4 w-4 border-gray-300 text-[color:var(--role-accent)] focus:ring-[color:var(--role-accent)]/30"
                                    checked={preTransferType === opt}
                                    onChange={() => setPreTransferType(opt)}
                                  />
                                  <span>{en ? PRE_TRANSFER_OPTION_LABELS[opt].en : PRE_TRANSFER_OPTION_LABELS[opt].rw}</span>
                                </label>
                              ))}
                            </div>
                         </section>
                      </div>
                   </div>
                   )}
                </section>
          )}

        </div>

        {/* Action Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:z-10 lg:self-start">
           <section className="relative overflow-hidden rounded-[32px] bg-[color:var(--role-accent)] p-8 text-white shadow-lg">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <h3 className="mb-2 text-base font-semibold text-white">
                {en ? 'Pre-transfer referral' : 'Kohereza'}
              </h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed font-medium">
                {testResult === 'Negative'
                  ? en
                    ? 'Negative severe malaria test: complete care and use home discharge. Referral is only when the test is positive.'
                    : 'Ikizamini ni negative: sezerera umurwayi. Kohereza ni iyo ikizamini ari positive.'
                  : en
                    ? 'When the test is positive, choose treatment history (yes/no), then refer or discharge as appropriate.'
                    : 'Niba ikizamini ari positive, hitamo ubuvuzi (ego/oya), hanyuma kohereza cyangwa gusezerera.'}
              </p>

              <p className="mb-2 text-xs font-medium text-white/70">
                {en ? 'Transport to district hospital' : 'Urugendo'}
              </p>
              <div className="space-y-2 mb-6">
                {FACILITY_TRANSPORT_VALUES.map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      referralTransport === opt
                        ? 'border-white/50 bg-white/15'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hc-transport"
                      className="h-4 w-4 border-white/40 text-white accent-white focus:ring-white/40"
                      checked={referralTransport === opt}
                      onChange={() => setReferralTransport(opt)}
                    />
                    <span>
                      {en
                        ? FACILITY_TRANSPORT_LABELS[opt].en
                        : FACILITY_TRANSPORT_LABELS[opt].rw}
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                 <button
                   type="button"
                   disabled={
                     testResult !== 'Positive' ||
                     treatmentGivenAtFacility === ''
                   }
                   onClick={() => setShowEscalate(true)}
                   className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                 >
                    <div className="text-left">
                       <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">{en ? 'Refer' : 'Ohereza'}</p>
                       <p className="text-sm font-bold">{en ? 'Refer to district hospital' : 'Kohereza ku bitaro by\'akarere'}</p>
                    </div>
                    <AlertTriangleIcon size={18} className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                 </button>

                 <button
                   onClick={() => setShowDischarge(true)}
                   className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group active:scale-[0.98]"
                 >
                    <div className="text-left">
                       <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{en ? 'Safe' : 'Hishyuwe'}</p>
                       <p className="text-sm font-bold">{en ? 'Home discharge' : 'Gusezera'}</p>
                    </div>
                    <CheckCircleIcon size={18} className="text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                 </button>
              </div>
           </section>
        </div>
      </div>

      <ConfirmModal
        open={showEscalate}
        onClose={() => setShowEscalate(false)}
        onConfirm={executeEscalationToDistrict}
        title={en ? 'Refer now?' : 'Ohereza ubu?'}
        message={
          en
            ? 'District hospital will receive this case now.'
            : "Ibitaro by'akarere birahita byakira iyi dosiye."
        }
        confirmText={en ? 'Send' : 'Ohereza'}
        confirmColor="amber"
      />

      <ConfirmModal
        open={showDischarge}
        onClose={() => setShowDischarge(false)}
        onConfirm={async () => { await saveClinicalData({ status: 'Resolved' }); navigate(base); }}
        title={en ? 'Discharge patient?' : 'Sezerera umurwayi?'}
        message={en ? 'Confirm patient recovery and tolerance of treatment.' : 'Emeza ko umurwayi yakize kandi yihanganiye ubuvuzi.'}
        confirmText={en ? 'Confirm discharge' : 'Emeza gusezerera'}
        confirmColor="success"
      />
    </div>
  );
}