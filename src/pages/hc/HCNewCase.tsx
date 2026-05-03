import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DISTRICTS, SECTORS_BY_DISTRICT, type District } from '../../data/mockData';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';
import { apiFetch } from '../../lib/api';
import type { MalariaCase } from '../../types/domain';
import { useFirstLineBasePath } from './useFirstLineBasePath';

function cardBtn(active: boolean) {
  return `rounded-xl border px-3 py-2 text-sm font-medium transition ${
    active
      ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
  }`;
}

export function HCNewCase() {
  const navigate = useNavigate();
  const base = useFirstLineBasePath();
  const isHealthPost = base === '/lc';
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { refresh } = useCasesApi();
  const en = language === 'en';

  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [patientName, setPatientName] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('');
  const [dob, setDob] = useState('');
  const [insuranceYesNo, setInsuranceYesNo] = useState<'Yes' | 'No' | ''>('');
  const [insuranceType, setInsuranceType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sexOptions = en
    ? [
        { value: 'Male' as const, label: 'Male' },
        { value: 'Female' as const, label: 'Female' },
      ]
    : [
        { value: 'Male' as const, label: 'Gabo' },
        { value: 'Female' as const, label: 'Gore' },
      ];
  const yesNoOptions = en
    ? [
        { value: 'Yes' as const, label: 'Yes' },
        { value: 'No' as const, label: 'No' },
      ]
    : [
        { value: 'Yes' as const, label: 'Yego' },
        { value: 'No' as const, label: 'Oya' },
      ];
  const insuranceTypeOptions = en
    ? ['Mutuweli', 'RAMA', 'MMI', 'Other']
    : [
        { value: 'Mutuweli', label: 'Mutuweli' },
        { value: 'RAMA', label: 'RAMA' },
        { value: 'MMI', label: 'MMI' },
        { value: 'Other', label: 'Ibindi' },
      ];

  const sectors = district ? SECTORS_BY_DISTRICT[district as District] || [] : [];

  const age =
    dob ?
      Math.max(
        0,
        Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      )
    : null;

  function validate(): boolean {
    if (!district || !sector || !cell.trim() || !village.trim()) {
      toast.error(en ? 'District, sector, cell and village are required.' : 'Uzuza aho umurwayi abarizwa.');
      return false;
    }
    if (!patientName.trim() || !sex || !dob) {
      toast.error(en ? 'Patient name, sex and date of birth are required.' : 'Uzuza amazina, igitsina n’itariki y’amavuko.');
      return false;
    }
    if (!insuranceYesNo) {
      toast.error(en ? 'Insurance yes/no is required.' : 'Hitamo ubwishingizi.');
      return false;
    }
    if (insuranceYesNo === 'Yes' && !insuranceType) {
      toast.error(en ? 'Select insurance type.' : 'Hitamo ubwoko bw’ubwishingizi.');
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    const code = `HC-${Date.now()}`;
    try {
      await apiFetch<{ data: { case: MalariaCase } }>('/api/v1/cases', {
        method: 'POST',
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientCode: code,
          patientId: code,
          sex,
          dateOfBirth: dob,
          district,
          sector,
          cell: cell.trim(),
          village: village.trim(),
          maritalStatus: 'Single',
          familySize: 1,
          educationLevel: 'Primary',
          occupation: 'None',
          economicStatus: 'Low',
          distanceToHC: '< 1hr',
          transportMode: 'Walk',
          hasInsurance: insuranceYesNo === 'Yes',
          insuranceType: insuranceYesNo === 'Yes' ? insuranceType : undefined,
          nightOutings: false,
          dateFirstSymptom: new Date().toISOString().slice(0, 10),
          timeToSeekCare: 'In 24hrs',
          usedTraditionalMedicine: false,
          consultedCHW: false,
          rdtsAvailable: false,
          chwRapidTestResult: 'Negative',
          consultedHealthPost: false,
          consultedHealthCenter: true,
          consultedHospital: false,
          symptoms: [],
          houseWallStatus: 'Trees+not cemented',
          mosquitoEntry: false,
          breedingSites: [],
          preventionMeasures: [],
          hcPatientReceivedDateTime: new Date().toISOString(),
          chwTransferDateTime: new Date().toISOString(),
          chwReferralTransport: 'Walk',
        }),
      });
      await refresh();
      toast.success(en ? 'Case created. Continue care in clinical management.' : 'Dosiye yakozwe. Komeza ubuvuzi.');
      navigate(`${base}/triage`, { state: { tab: 'at_hc' } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : en ? 'Failed to create case' : 'Kurema dosiye byanze');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(base)}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ChevronLeftIcon size={16} /> {en ? 'Back' : 'Subira inyuma'}
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">
          {en
            ? isHealthPost
              ? 'New health post direct case'
              : 'New HC direct case'
            : isHealthPost
              ? 'Dosiye nshya ku Ivuriro Riciriritse'
              : 'Dosiye nshya ku kigo'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {en
            ? isHealthPost
              ? 'Register a patient who came directly to the health post (no CHW).'
              : 'Register a patient who came directly to the health center (no CHW).'
            : isHealthPost
              ? 'Andikisha umurwayi wageze ku Ivuriro Riciriritse atavuye kuri CHW.'
              : 'Andikisha umurwayi wageze ku kigo atavuye kuri CHW.'}
        </p>
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-widest text-gray-500">
          {en ? 'Location / home' : 'Aho atuye'}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <select className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={district} onChange={(e) => { setDistrict(e.target.value); setSector(''); }}>
            <option value="">{en ? 'District' : 'Akarere'}</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">{en ? 'Sector' : 'Umurenge'}</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" placeholder={en ? 'Cell' : 'Akagari'} value={cell} onChange={(e) => setCell(e.target.value)} />
          <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" placeholder={en ? 'Village' : 'Umudugudu'} value={village} onChange={(e) => setVillage(e.target.value)} />
        </div>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-widest text-gray-500">
          {en ? 'Personal information' : 'Amakuru y\'umurwayi'}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" placeholder={en ? 'Patient name' : 'Izina ry\'umurwayi'} value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{en ? 'Gender' : 'Igitsina'}</p>
            <div className="flex gap-2">
              {sexOptions.map((s) => (
                <button key={s.value} type="button" className={cardBtn(sex === s.value)} onClick={() => setSex(s.value)}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{en ? 'Auto age' : 'Imyaka'}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">{age ?? '—'}</div>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{en ? 'Insurance' : 'Ubwishingizi'}</p>
          <div className="flex gap-2">
            {yesNoOptions.map((v) => (
              <button
                key={v.value}
                type="button"
                className={cardBtn(insuranceYesNo === v.value)}
                onClick={() => {
                  setInsuranceYesNo(v.value);
                  if (v.value === 'No') setInsuranceType('');
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          {insuranceYesNo === 'Yes' && (
            <div className="mt-2 flex flex-wrap gap-2">
              {insuranceTypeOptions.map((i) => {
                const item = typeof i === 'string' ? { value: i, label: i } : i;
                return (
                  <button key={item.value} type="button" className={cardBtn(insuranceType === item.value)} onClick={() => setInsuranceType(item.value)}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(base)}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeftIcon size={16} /> {en ? 'Cancel' : 'Reka'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <SendIcon size={16} /> {en ? 'Create and continue care' : 'Kora dosiye ukomeze ubuvuzi'}
          </button>
        </div>
      </div>
    </div>
  );
}
