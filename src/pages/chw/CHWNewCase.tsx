import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  SaveIcon,
  SendIcon,
  CheckCircleIcon } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ALL_DISTRICTS,
  SECTORS_BY_DISTRICT,
  SEVERE_SYMPTOMS,
  getSymptomLabel,
} from '../../data/mockData';
import type { District } from '../../data/mockData';
import type { MalariaCase } from '../../types/domain';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { apiFetch } from '../../lib/api';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
const STEPS = [
  'Location',
  'Demographics',
  'RDT & symptoms',
  'Review',
];

const ARRIVAL_TRANSPORT_DEFAULT = 'Walk';

function StepIndicator({ current, total }: {current: number;total: number;}) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-1 lg:px-0">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 flex items-center">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= current ? 'bg-teal-600' : 'bg-gray-200'
            }`}
          />
        </div>
      ))}
    </div>
  );

}
function FieldLabel({
  children,
  required



}: {children: React.ReactNode;required?: boolean;}) {
  return (
    <label className="block text-xs font-medium text-gray-500 mb-1.5">
      {children} {required && <span className="text-danger-500">*</span>}
    </label>);

}
function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder







}: {label: string;value: string;onChange: (v: string) => void;options: string[];required?: boolean;placeholder?: string;}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors">
        
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((o) =>
        <option key={o} value={o}>
            {o}
          </option>
        )}
      </select>
    </div>);

}
function RadioCards({
  label,
  value,
  onChange,
  options,
  required






}: {label: string;value: string;onChange: (v: string) => void;options: string[];required?: boolean;}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((o) =>
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${value === o ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
          
            {o}
          </button>
        )}
      </div>
    </div>);

}
export function CHWNewCase() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { refreshNotifications } = useAuth();
  const { refresh } = useCasesApi();
  const [step, setStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [, setSending] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // Form state
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [gps, setGps] = useState('');
  const [patientName, setPatientName] = useState('');
  const [sex, setSex] = useState('');
  const [dob, setDob] = useState('');
  const [insuranceYesNo, setInsuranceYesNo] = useState<'Yes' | 'No' | ''>('');
  const [insuranceType, setInsuranceType] = useState('');
  const [rapidTestResult, setRapidTestResult] = useState<'Positive' | 'Negative' | ''>('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [chwPrimaryReferral, setChwPrimaryReferral] = useState<
    'HEALTH_CENTER' | 'LOCAL_CLINIC'
  >('HEALTH_CENTER');

  /** Patient location — all districts (same routing rules everywhere; not limited to CHW home province). */
  const districtOptions = useMemo((): District[] => [...ALL_DISTRICTS] as District[], []);

  useEffect(() => {
    if (
      district &&
      !districtOptions.includes(district as District)
    ) {
      setDistrict('');
      setSector('');
    }
  }, [district, districtOptions]);

  const sectors = district ?
  SECTORS_BY_DISTRICT[district as District] || [] :
  [];
  const age = dob ?
  Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  ) :
  null;
  // Auto-save
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSaved(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (rapidTestResult === 'Negative') {
      setSymptoms([]);
      setChwPrimaryReferral('HEALTH_CENTER');
    }
  }, [rapidTestResult]);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function validateLocationStep(): boolean {
    if (!district.trim() || !sector.trim()) {
      toast.error(
        language === 'en' ? 'Select district and sector.' : 'Hitamo akarere n’umurenge.'
      );
      return false;
    }
    if (!cell.trim() || !village.trim()) {
      toast.error(
        language === 'en'
          ? 'Cell and village are required.'
          : 'Akagari n’umudugudu ni ngombwa.'
      );
      return false;
    }
    return true;
  }

  function validateDemographicsStep(): boolean {
    if (!patientName.trim()) {
      toast.error(language === 'en' ? 'Enter patient name.' : 'Andika izina.');
      return false;
    }
    if (!sex) {
      toast.error(language === 'en' ? 'Select sex.' : 'Hitamo igitsina.');
      return false;
    }
    if (!dob) {
      toast.error(
        language === 'en' ? 'Enter date of birth.' : 'Andika itariki y’amavuko.'
      );
      return false;
    }
    if (insuranceYesNo === '') {
      toast.error(
        language === 'en'
          ? 'Indicate whether the patient has health insurance.'
          : 'Garagaza ko afite ubwishingizi.'
      );
      return false;
    }
    if (insuranceYesNo === 'Yes' && !insuranceType) {
      toast.error(
        language === 'en'
          ? 'Select an insurance type.'
          : 'Hitamo ubwoko bw’ubwishingizi.'
      );
      return false;
    }
    return true;
  }

  function validateRdtSymptomsStep(): boolean {
    if (rapidTestResult !== 'Positive' && rapidTestResult !== 'Negative') {
      toast.error(
        language === 'en'
          ? 'Record the rapid test result.'
          : 'Andika ibisubizo by’ikizamini cyihuse.'
      );
      return false;
    }
    if (rapidTestResult === 'Positive' && symptoms.length === 0) {
      toast.error(
        language === 'en'
          ? 'Select at least one severe symptom when the test is positive.'
          : 'Hitamo nibura kimwe mu bimenyetso by’ikarire y’imalariya ikomeye.'
      );
      return false;
    }
    return true;
  }

  function validateAllForSubmit(): boolean {
    return (
      validateLocationStep() &&
      validateDemographicsStep() &&
      validateRdtSymptomsStep()
    );
  }

  function tryAdvanceFromStep(): boolean {
    if (step === 0) return validateLocationStep();
    if (step === 1) return validateDemographicsStep();
    if (step === 2) return validateRdtSymptomsStep();
    return true;
  }
  function buildCreateCaseBody(): Record<string, unknown> {
    const code = `PC-${Date.now()}`;
    const dobStr = dob || '2000-01-01';
    
    return {
      patientName: patientName.trim() || 'Unknown',
      patientCode: code,
      patientId: code,
      sex: sex === 'Female' ? 'Female' : 'Male',
      dateOfBirth: dobStr,
      district,
      sector,
      cell: cell.trim() || 'Unknown',
      village: village.trim() || 'Unknown',
      gpsCoordinates: gps || undefined,
      maritalStatus: 'Single',
      familySize: 1,
      educationLevel: 'Primary',
      occupation: 'None',
      economicStatus: 'Low',
      distanceToHC: '< 1hr',
      transportMode: ARRIVAL_TRANSPORT_DEFAULT,
      hasInsurance: insuranceYesNo === 'Yes',
      insuranceType:
        insuranceYesNo === 'Yes' && insuranceType ? insuranceType : undefined,
      nightOutings: false,
      nightOutingHours: undefined,
      dateFirstSymptom: new Date().toISOString().slice(0, 10),
      timeToSeekCare: 'In 24hrs',
      usedTraditionalMedicine: false,
      consultedCHW: false,
      consultedCHWDate: undefined,
      rdtsAvailable:
        rapidTestResult === 'Positive' || rapidTestResult === 'Negative',
      chwRapidTestResult: rapidTestResult as 'Positive' | 'Negative',
      consultedHealthPost: false,
      consultedHealthCenter: false,
      consultedHospital: false,
      symptoms: rapidTestResult === 'Positive' ? symptoms : [],
      houseWallStatus: 'Trees+not cemented',
      mosquitoEntry: false,
      breedingSites: [],
      preventionMeasures: [],
      llinAge: undefined,
      llinSource: undefined,
      llinStatus: undefined,
      sleepsUnderLLIN: undefined,
      chwTransferDateTime: new Date().toISOString(),
      chwReferralTransport: 'Self',
      ...(rapidTestResult === 'Positive' && symptoms.length > 0
        ? { chwPrimaryReferral }
        : {}),
    };
  }

  async function handleSubmit() {
    setShowConfirm(false);
    if (!validateAllForSubmit()) {
      return;
    }
    setSending(true);
    try {
      await apiFetch<{ data: { case: MalariaCase } }>('/api/v1/cases', {
        method: 'POST',
        body: JSON.stringify(buildCreateCaseBody()),
      });
      await refresh();
      await refreshNotifications();
      setSubmitted(true);
      setTimeout(() => {
        navigate('/chw');
      }, 2500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit case');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="w-full max-w-6xl px-4 lg:px-0">
        <div className="flex items-center gap-3 mb-2">
          <button 
            type="button" 
            onClick={() => navigate('/chw')}
            className="p-1.5 -ml-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Go back"
          >
            <ChevronLeftIcon size={24} />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              {language === 'en' ? 'New Case Report' : 'Raporo Nshya'}
            </h2>
            {lastSaved && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[11px] font-semibold text-gray-500">
                <SaveIcon size={12} /> Auto-saved
              </span>
            )}
          </div>
        </div>
        <div className="pl-10">
          <p className="text-xs font-medium text-gray-500 mb-3">
            Step {step + 1} of {STEPS.length}: <span className="text-teal-700 font-bold">{STEPS[step]}</span>
          </p>
          <StepIndicator current={step} total={STEPS.length} />
        </div>
      </div>

      {/* Form Content */}
      <div className="w-full px-4 pb-4 overflow-y-auto lg:px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 space-y-8"
          >
            
            {/* STEP 0: Location */}
            {step === 0 &&
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <p className="text-xs text-gray-500 md:col-span-2 -mt-2">
                  {language === 'en'
                    ? 'Select the patient’s district and location (all provinces). First-line facility routing uses this district.'
                    : 'Hitamo akarere n’aho umurwayi aherereye (intara zose). Ikigo cy’ibanze gisanga ikimenyetso kuri aka karere.'}
                </p>
                <SelectField
                label="District"
                value={district}
                onChange={(v) => {
                  setDistrict(v);
                  setSector('');
                }}
                options={districtOptions}
                required />
              
                {district && sectors.length === 0 ?
              <div>
                  <FieldLabel required>Sector</FieldLabel>
                  <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  required
                  placeholder="Enter sector name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                </div> :
 
              <SelectField
                label="Sector"
                value={sector}
                onChange={setSector}
                options={sectors}
                required
                placeholder={
                district ? 'Select sector...' : 'Select district first'
                } />
              }
              
                <div>
                  <FieldLabel required>Cell</FieldLabel>
                  <input
                  type="text"
                  value={cell}
                  onChange={(e) => setCell(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                </div>
                <div>
                  <FieldLabel required>Village</FieldLabel>
                  <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>GPS Coordinates</FieldLabel>
                  <div className="flex gap-2">
                    <input
                    type="text"
                    value={gps}
                    readOnly
                    placeholder="Tap to capture"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm bg-gray-50" />
                  
                    <button
                    type="button"
                    onClick={() => {
                      setGps('-2.3456, 29.7654');
                      toast.success('GPS captured');
                    }}
                    className="px-4 py-3 bg-teal-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-teal-800 transition-colors">
                    
                      <MapPinIcon size={16} /> Capture
                    </button>
                  </div>
                </div>
              </div>
            }

            {/* STEP 1: Demographics */}
            {step === 1 &&
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <FieldLabel required>Patient name</FieldLabel>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-1">
                  <RadioCards
                  label="Sex"
                  value={sex}
                  onChange={setSex}
                  options={['Male', 'Female']}
                  required />
                </div>
              
                <div>
                  <FieldLabel required>Date of Birth</FieldLabel>
                  <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                  {age !== null &&
                <p className="text-xs text-teal-700 mt-1 font-medium">
                      Age: {age} years ({age < 5 ? 'Under 5' : '5 and above'})
                    </p>
                }
                </div>
                <div className="md:col-span-2">
                  <RadioCards
                    label="Health insurance"
                    value={insuranceYesNo}
                    onChange={(v) => {
                      setInsuranceYesNo(v as 'Yes' | 'No');
                      if (v === 'No') setInsuranceType('');
                    }}
                    options={['Yes', 'No']}
                    required
                  />
                </div>

                {insuranceYesNo === 'Yes' && (
                  <div className="md:col-span-2">
                    <RadioCards
                      label="Insurance type"
                      value={insuranceType}
                      onChange={setInsuranceType}
                      options={['CBHI', 'RAMA', 'MMI', 'Other']}
                      required
                    />
                  </div>
                )}
              </div>
            }

            {/* STEP 2: Rapid test + severe symptoms (if positive) */}
            {step === 2 && (
              <>
                <div className="space-y-4 mb-6">
                  <RadioCards
                    label={
                      language === 'en'
                        ? 'Rapid diagnostic test (malaria)'
                        : 'Ikizamini cyihuse (imalariya)'
                    }
                    value={rapidTestResult}
                    onChange={(v) =>
                      setRapidTestResult(v as 'Positive' | 'Negative')
                    }
                    options={['Positive', 'Negative']}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {language === 'en'
                      ? 'If the test is positive, select severe malaria signs below. Alerts are sent only when at least one sign is selected. A negative test saves the case without sending an alert.'
                      : 'Niba ari positive, hitamo ibimenyetso biri hasi. Ubutumwa buhamya bukoreshwa gusa niba hari ibimenyetso. Niba ari negative, dosiye ibikwa nta butumwa.'}
                  </p>
                </div>

                {rapidTestResult === 'Positive' && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      {language === 'en'
                        ? 'Select all severe malaria symptoms observed:'
                        : 'Hitamo ibimenyetso byose bya malariya ikomeye:'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {SEVERE_SYMPTOMS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSymptom(s)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${symptoms.includes(s) ? 'border-danger-300 bg-danger-50 text-danger-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${symptoms.includes(s) ? 'border-danger-500 bg-danger-500' : 'border-gray-300'}`}
                          >
                            {symptoms.includes(s) && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6l3 3 5-5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {getSymptomLabel(s, language)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {symptoms.length > 0 && (
                      <p className="text-xs font-semibold text-danger-600 bg-danger-50 px-3 py-2 rounded-lg">
                        {symptoms.length} symptom
                        {symptoms.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                    {symptoms.length > 0 && (
                      <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                        <RadioCards
                          label={
                            language === 'en'
                              ? 'Refer this severe case to'
                              : 'Ohereza iyi mpfura ku'
                          }
                          value={
                            chwPrimaryReferral === 'LOCAL_CLINIC'
                              ? language === 'en'
                                ? 'Local clinic'
                                : 'Ivuriro rito'
                              : language === 'en'
                                ? 'Health center'
                                : 'Ikigo nderabuzima'
                          }
                          onChange={(v) => {
                            const lc =
                              v === 'Local clinic' || v === 'Ivuriro rito';
                            setChwPrimaryReferral(
                              lc ? 'LOCAL_CLINIC' : 'HEALTH_CENTER'
                            );
                          }}
                          options={
                            language === 'en'
                              ? ['Health center', 'Local clinic']
                              : ['Ikigo nderabuzima', 'Ivuriro rito']
                          }
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                {rapidTestResult === 'Negative' && (
                  <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    {language === 'en'
                      ? 'No severe-malaria alert will be sent. This case will be closed at CHW as non-severe malaria (no transfer).'
                      : 'Nta butumwa bw’ikarire ikomeye buzoherezwa. Urashobora kohereza kugira ngo ubike iyi visit.'}
                  </p>
                )}
              </>
            )}

            {/* STEP 3: Review */}
            {step === 3 &&
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  <div className="space-y-6">
                    <ReviewSection
                      title="Location"
                      items={[
                        ['District', district],
                        ['Sector', sector],
                        ['Cell', cell],
                        ['Village', village],
                        ['GPS', gps],
                        ['Date/Time Sent', new Date().toLocaleString(language === 'en' ? 'en-RW' : 'fr-RW')]
                      ]}
                    />
                  
                    <ReviewSection
                      title="RDT & symptoms"
                      items={[
                        [
                          'Rapid test',
                          rapidTestResult || '—',
                        ],
                        [
                          'Severe symptoms',
                          rapidTestResult === 'Positive'
                            ? `${symptoms.length} selected`
                            : '—',
                        ],
                        [
                          'Journey outcome',
                          rapidTestResult === 'Positive' && symptoms.length > 0
                            ? 'Referral starts (severe case alert)'
                            : 'Closed at CHW (non-severe, no transfer)',
                        ],
                        [
                          language === 'en' ? 'Referral destination' : 'Aho kohereza',
                          rapidTestResult === 'Positive' && symptoms.length > 0
                            ? chwPrimaryReferral === 'LOCAL_CLINIC'
                              ? language === 'en'
                                ? 'Local clinic'
                                : 'Ivuriro rito'
                              : language === 'en'
                                ? 'Health center'
                                : 'Ikigo nderabuzima'
                            : '—',
                        ],
                        ...symptoms.map((s) => [
                          getSymptomLabel(s, language),
                          '✓',
                        ] as [string, string]),
                      ]}
                    />
                  </div>

                  <ReviewSection
                    title="Patient"
                    items={[
                      ['Name', patientName],
                      ['Sex', sex],
                      ['DOB', dob],
                      ['Age', age ? `${age} years` : ''],
                      [
                        'Insurance',
                        insuranceYesNo === 'Yes'
                          ? insuranceType || 'Yes'
                          : insuranceYesNo === 'No'
                            ? 'No'
                            : '',
                      ],
                    ]}
                  />
                </div>
            }
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-4 py-4 max-w-6xl w-full flex gap-3 shrink-0 lg:px-0">
        {step > 0 &&
        <button
          onClick={() => setStep((s) => s - 1)}
          className="flex items-center gap-1 px-6 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <ChevronLeftIcon size={18} /> Back
          </button>
        }
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (!tryAdvanceFromStep()) return;
              setStep((s) => s + 1);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 hover:shadow-md transition-all active:scale-[0.98]"
          >
            Next <ChevronRightIcon size={18} />
          </button>
        ) : (

          <button
            type="button"
            onClick={() => {
              if (!validateAllForSubmit()) return;
              setShowConfirm(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 shadow-md shadow-teal-600/30 transition-all active:scale-[0.98]"
          >
            <SendIcon size={18} /> Submit Case Report
          </button>
        )}
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title={
          rapidTestResult === 'Positive' && symptoms.length > 0
            ? language === 'en'
              ? 'Send alert?'
              : 'Ohereza ubutumwa?'
            : language === 'en'
              ? 'Save case?'
              : 'Bika dosiye?'
        }
        message={
          rapidTestResult === 'Positive' && symptoms.length > 0
            ? language === 'en'
              ? chwPrimaryReferral === 'LOCAL_CLINIC'
                ? 'This will notify the local clinic and RICH about this suspected severe malaria case. Ensure the patient is referred according to protocol.'
                : 'This will notify the health center and RICH about this suspected severe malaria case. Ensure the patient is referred according to protocol.'
              : chwPrimaryReferral === 'LOCAL_CLINIC'
                ? 'Ibi bizamenyesha ivuriro rito n’RICH ku mpfura y’imalariya ikomeye. Kohereza umurwayi uko biteganyijwe.'
                : 'Ibi bizamenyesha ikigo n’RICH ku mpfura y’imalariya ikomeye. Kohereza umurwayi uko biteganyijwe.'
            : language === 'en'
              ? 'No alert will be sent. The case will be saved and marked as resolved at CHW (non-severe malaria, no transfer).'
              : 'Nta butumwa buzoherezwa. Dosiye irabika mu buryo bwawe.'
        }
        confirmText={
          rapidTestResult === 'Positive' && symptoms.length > 0
            ? language === 'en'
              ? 'Send alert'
              : 'Ohereza'
            : language === 'en'
              ? 'Save'
              : 'Bika'
        }
        confirmColor="amber"
      />
        
      <AnimatePresence>
        {submitted && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon size={40} className="text-teal-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">
                {rapidTestResult === 'Positive' && symptoms.length > 0
                  ? language === 'en'
                    ? 'Alert sent successfully'
                    : 'Ubutumwa bwoherejwe'
                  : language === 'en'
                    ? 'Case saved'
                    : 'Dosiye yabitswe'}
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                {rapidTestResult === 'Positive' && symptoms.length > 0
                  ? language === 'en'
                    ? chwPrimaryReferral === 'LOCAL_CLINIC'
                      ? 'The local clinic has been notified. Routing you to the dashboard...'
                      : 'The health center has been notified. Routing you to the dashboard...'
                    : chwPrimaryReferral === 'LOCAL_CLINIC'
                      ? 'Ivuriro rito ryamenyeshejwe. Tujya ku rubuga rwawe...'
                      : 'Ikigo cyamenyeshejwe. Tujya ku rubuga rwawe...'
                  : language === 'en'
                    ? 'No alert was sent. Case closed at CHW as non-severe malaria. Routing you to the dashboard...'
                    : 'Nta butumwa bwoherejwe. Tujya ku rubuga rwawe...'}
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 2.5, ease: "linear" }} 
                  className="h-full bg-teal-500" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>);

}
function ReviewSection({
  title,
  items
}: {title: string;items: [string, string][];}) {
  return (
    <div className="p-4">
      <h4 className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-3">
        {title}
      </h4>
      <div className="space-y-1.5">
        {items.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs items-center border-b border-gray-100/50 pb-1 last:border-0 last:pb-0">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="font-medium text-gray-900 text-right max-w-[60%] bg-white px-2 py-0.5 rounded-md border border-gray-100">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

}