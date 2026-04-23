import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MapPinIcon,
  SaveIcon,
  SendIcon,
  CheckCircleIcon } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ALL_DISTRICTS,
  provinceFromDistrict,
  SECTORS_BY_DISTRICT,
  PEDIATRIC_DANGER_SIGNS,
  PEDIATRIC_DANGER_SIGNS_PARENT,
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
/** Default for `transportMode` on create (general travel to care). */
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
type OptionItem = string | { value: string; label: string };
function RadioCards({
  label,
  value,
  onChange,
  options,
  required
}: {label: string;value: string;onChange: (v: string) => void;options: OptionItem[];required?: boolean;}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((o) => {
          const item = typeof o === 'string' ? { value: o, label: o } : o;
          return (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${value === item.value ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
          
            {item.label}
          </button>
          );
        })}
      </div>
    </div>);

}
export function CHWNewCase() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
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
  const [showPediatricDangerSigns, setShowPediatricDangerSigns] = useState(false);
  const hasPediatricDangerSignsSelected = symptoms.some((s) =>
    PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number])
  );

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
      setShowPediatricDangerSigns(false);
    }
  }, [rapidTestResult]);

  useEffect(() => {
    if (symptoms.some((s) => PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number]))) {
      setShowPediatricDangerSigns(true);
    }
  }, [symptoms]);

  const coreSevereSymptoms = useMemo(
    () =>
      SEVERE_SYMPTOMS.filter(
        (s) =>
          s !== PEDIATRIC_DANGER_SIGNS_PARENT &&
          !PEDIATRIC_DANGER_SIGNS.includes(s as (typeof PEDIATRIC_DANGER_SIGNS)[number])
      ),
    []
  );

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
  const stepLabels = en
    ? ['Location', 'Demographics', 'RDT & symptoms', 'Review']
    : ['Aho aherereye', 'Imyirondoro y\'umurwayi', 'RDT n\'ibimenyetso', 'Isuzuma rya nyuma'];
  const sexOptions = en
    ? [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
      ]
    : [
        { value: 'Male', label: 'Gabo' },
        { value: 'Female', label: 'Gore' },
      ];
  const yesNoOptions = en
    ? [
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' },
      ]
    : [
        { value: 'Yes', label: 'Yego' },
        { value: 'No', label: 'Oya' },
      ];
  const rapidOptions = en
    ? [
        { value: 'Positive', label: 'Positive' },
        { value: 'Negative', label: 'Negative' },
      ]
    : [
        { value: 'Positive', label: 'Positifu' },
        { value: 'Negative', label: 'Negatifu' },
      ];
  const insuranceTypeOptions = en
    ? ['CBHI', 'RAMA', 'MMI', 'Other']
    : [
        { value: 'CBHI', label: 'CBHI' },
        { value: 'RAMA', label: 'RAMA' },
        { value: 'MMI', label: 'MMI' },
        { value: 'Other', label: 'Ibindi' },
      ];

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
      ...(district.trim()
        ? { province: provinceFromDistrict(district) }
        : {}),
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
      chwReferralTransport: 'Walk' as const,
      ...(rapidTestResult === 'Positive' && symptoms.length > 0
        ? { chwPrimaryReferral: 'HEALTH_CENTER' as const }
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
      toast.error(
        e instanceof Error
          ? e.message
          : en
            ? 'Failed to submit case'
            : 'Kohereza dosiye byanze'
      );
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
            title={en ? 'Go back' : 'Subira inyuma'}
          >
            <ChevronLeftIcon size={24} />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              {en ? 'New Case Report' : 'Raporo nshya y\'umurwayi'}
            </h2>
            {lastSaved && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[11px] font-semibold text-gray-500">
                <SaveIcon size={12} /> {en ? 'Auto-saved' : 'Byabitswe byikora'}
              </span>
            )}
          </div>
        </div>
        <div className="pl-10">
          <p className="text-xs font-medium text-gray-500 mb-3">
            {en ? 'Step' : 'Intambwe'} {step + 1} {en ? 'of' : 'kuri'} {stepLabels.length}:{' '}
            <span className="text-teal-700 font-bold">{stepLabels[step]}</span>
          </p>
          <StepIndicator current={step} total={stepLabels.length} />
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
                    ? 'Select the patient’s location'
                    : 'Hitamo aho umurwayi aherereye'}
                </p>
                <SelectField
                label={en ? 'District' : 'Akarere'}
                value={district}
                onChange={(v) => {
                  setDistrict(v);
                  setSector('');
                }}
                options={districtOptions}
                required
                placeholder={en ? 'Select district...' : 'Hitamo akarere...'} />
              
                {district && sectors.length === 0 ?
              <div>
                  <FieldLabel required>{en ? 'Sector' : 'Umurenge'}</FieldLabel>
                  <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  required
                  placeholder={en ? 'Enter sector name' : 'Andika umurenge'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                </div> :
 
              <SelectField
                label={en ? 'Sector' : 'Umurenge'}
                value={sector}
                onChange={setSector}
                options={sectors}
                required
                placeholder={
                district
                  ? en ? 'Select sector...' : 'Hitamo umurenge...'
                  : en ? 'Select district first' : 'Banza uhitemo akarere'
                } />
              }
              
                <div>
                  <FieldLabel required>{en ? 'Cell' : 'Akagari'}</FieldLabel>
                  <input
                  type="text"
                  value={cell}
                  onChange={(e) => setCell(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                </div>
                <div>
                  <FieldLabel required>{en ? 'Village' : 'Umudugudu'}</FieldLabel>
                  <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>{en ? 'GPS coordinates' : 'Imibare ya GPS'}</FieldLabel>
                  <div className="flex gap-2">
                    <input
                    type="text"
                    value={gps}
                    readOnly
                    placeholder={en ? 'Tap to capture' : 'Kanda ufate GPS'}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm bg-gray-50" />
                  
                    <button
                    type="button"
                    onClick={() => {
                      setGps('-2.3456, 29.7654');
                      toast.success(en ? 'GPS captured' : 'GPS yafashwe');
                    }}
                    className="px-4 py-3 bg-teal-700 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-teal-800 transition-colors">
                    
                      <MapPinIcon size={16} /> {en ? 'Capture' : 'Fata'}
                    </button>
                  </div>
                </div>
              </div>
            }

            {/* STEP 1: Demographics */}
            {step === 1 &&
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <FieldLabel required>{en ? 'Patient name' : 'Izina ry\'umurwayi'}</FieldLabel>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={en ? 'Full name' : 'Amazina yose'}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-1">
                  <RadioCards
                  label={en ? 'Sex' : 'Igitsina'}
                  value={sex}
                  onChange={setSex}
                  options={sexOptions}
                  required />
                </div>
              
                <div>
                  <FieldLabel required>{en ? 'Date of birth' : 'Itariki y\'amavuko'}</FieldLabel>
                  <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-colors" />
                
                  {age !== null &&
                <p className="text-xs text-teal-700 mt-1 font-medium">
                      {en ? 'Age' : 'Imyaka'}: {age} {en ? 'years' : 'imyaka'} ({age < 5 ? (en ? 'Under 5' : 'Munsi ya 5') : (en ? '5 and above' : '5 kuzamura')})
                    </p>
                }
                </div>
                <div className="md:col-span-2">
                  <RadioCards
                    label={en ? 'Health insurance' : 'Ubwishingizi bwo kwivuza'}
                    value={insuranceYesNo}
                    onChange={(v) => {
                      setInsuranceYesNo(v as 'Yes' | 'No');
                      if (v === 'No') setInsuranceType('');
                    }}
                    options={yesNoOptions}
                    required
                  />
                </div>

                {insuranceYesNo === 'Yes' && (
                  <div className="md:col-span-2">
                    <RadioCards
                      label={en ? 'Insurance type' : 'Ubwoko bw\'ubwishingizi'}
                      value={insuranceType}
                      onChange={setInsuranceType}
                      options={insuranceTypeOptions}
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
                    options={rapidOptions}
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
                      {coreSevereSymptoms.map((s) => (
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
                      <button
                        type="button"
                        onClick={() =>
                          setShowPediatricDangerSigns((prev) => !prev)
                        }
                        className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          showPediatricDangerSigns || hasPediatricDangerSignsSelected
                            ? 'border-danger-300 bg-danger-50 text-danger-800'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {getSymptomLabel(PEDIATRIC_DANGER_SIGNS_PARENT, language)}
                        </span>
                        <ChevronDownIcon
                          size={16}
                          className={`transition-transform ${
                            showPediatricDangerSigns ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    {showPediatricDangerSigns && (
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {PEDIATRIC_DANGER_SIGNS.map((s) => (
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
                    )}
                    {symptoms.length > 0 && (
                      <p className="text-xs font-semibold text-danger-600 bg-danger-50 px-3 py-2 rounded-lg">
                        {symptoms.length} {en ? 'symptom' : 'ikimenyetso'}
                        {symptoms.length > 1 ? (en ? 's' : '') : ''} {en ? 'selected' : 'byahiswemo'}
                      </p>
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
                      title={en ? 'Location' : 'Aho aherereye'}
                      items={[
                        [en ? 'District' : 'Akarere', district],
                        [en ? 'Sector' : 'Umurenge', sector],
                        [en ? 'Cell' : 'Akagari', cell],
                        [en ? 'Village' : 'Umudugudu', village],
                        ['GPS', gps],
                        [en ? 'Date/time sent' : 'Itariki/isaha byoherejwe', new Date().toLocaleString(en ? 'en-RW' : 'rw-RW')]
                      ]}
                    />
                  
                    <ReviewSection
                      title={en ? 'RDT & symptoms' : 'RDT n\'ibimenyetso'}
                      items={[
                        [
                          en ? 'Rapid test' : 'Ikizamini cyihuse',
                          rapidTestResult || '—',
                        ],
                        [
                          en ? 'Severe symptoms' : 'Ibimenyetso bikomeye',
                          rapidTestResult === 'Positive'
                            ? `${symptoms.length} ${en ? 'selected' : 'byatoranyijwe'}`
                            : '—',
                        ],
                        [
                          en ? 'Journey outcome' : 'Ibyavuye mu rugendo',
                          rapidTestResult === 'Positive' && symptoms.length > 0
                            ? (en ? 'Referral starts (severe case alert)' : 'Kohereza biratangira (ubutumwa bw\'ikibazo gikomeye)')
                            : (en ? 'Closed at CHW (non-severe, no transfer)' : 'Byafunzwe kuri CHW (si ikibazo gikomeye)'),
                        ],
                        ...symptoms.map((s) => [
                          getSymptomLabel(s, language),
                          '✓',
                        ] as [string, string]),
                      ]}
                    />
                  </div>

                  <ReviewSection
                    title={en ? 'Patient' : 'Umurwayi'}
                    items={[
                      [en ? 'Name' : 'Izina', patientName],
                      [en ? 'Sex' : 'Igitsina', sex ? sexOptions.find((o) => o.value === sex)?.label || sex : ''],
                      ['DOB', dob],
                      [en ? 'Age' : 'Imyaka', age ? `${age} ${en ? 'years' : 'imyaka'}` : ''],
                      [
                        en ? 'Insurance' : 'Ubwishingizi',
                        insuranceYesNo === 'Yes'
                          ? insuranceType || (en ? 'Yes' : 'Yego')
                          : insuranceYesNo === 'No'
                            ? (en ? 'No' : 'Oya')
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
            <ChevronLeftIcon size={18} /> {en ? 'Back' : 'Subira inyuma'}
          </button>
        }
        {step < stepLabels.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (!tryAdvanceFromStep()) return;
              setStep((s) => s + 1);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 hover:shadow-md transition-all active:scale-[0.98]"
          >
            {en ? 'Next' : 'Komeza'} <ChevronRightIcon size={18} />
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
            <SendIcon size={18} /> {en ? 'Submit case report' : 'Ohereza raporo y\'umurwayi'}
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
              ? 'Send now?'
              : 'Ohereza ubu?'
            : language === 'en'
              ? 'Save now?'
              : 'Bika ubu?'
        }
        message={
          rapidTestResult === 'Positive' && symptoms.length > 0
            ? language === 'en'
              ? 'Health center will get this alert now.'
              : 'Ikigo nderabuzima kirahita kibona ubu butumwa.'
            : language === 'en'
              ? 'No alert will be sent. This case will be saved at CHW.'
              : 'Nta butumwa bwoherezwa. Dosiye irabikwa kuri CHW.'
        }
        confirmText={
          rapidTestResult === 'Positive' && symptoms.length > 0
            ? language === 'en'
              ? 'Send'
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
                    ? 'The health center has been notified. Routing you to the dashboard...'
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