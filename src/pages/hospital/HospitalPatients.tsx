import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { EmptyState } from '../../components/shared/EmptyState';
import { hcPage } from '../../theme/appShell';
import { useHospitalBasePath } from './useHospitalBasePath';
import { districtHospitalInboxIncludes } from './caseHelpers';

export function HospitalPatients() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = useHospitalBasePath();
  const { cases } = useCasesApi();
  const [search, setSearch] = useState('');
  const isReferral = user?.role === 'Referral Hospital';

  const patientsList = useMemo(() => {
    const patientsMap = new Map<
      string,
      {
        name: string;
        code: string;
        sex: string;
        district: string;
        sector: string;
        lastSeen: string;
        caseCount: number;
      }
    >();
    const scopedCases =
      isReferral ?
        cases.filter(
          (c) =>
            Boolean(c.transferredToReferralHospital) ||
            Boolean(c.dhTransferredToReferralHospitalDateTime) ||
            Boolean(c.referralHospitalReceivedDateTime)
        )
      : cases.filter(districtHospitalInboxIncludes);
    for (const c of scopedCases) {
      if (!patientsMap.has(c.patientCode)) {
        patientsMap.set(c.patientCode, {
          name: c.patientName,
          code: c.patientCode,
          sex: c.sex,
          district: c.district,
          sector: c.sector,
          lastSeen: c.updatedAt,
          caseCount: 1,
        });
      } else {
        const p = patientsMap.get(c.patientCode)!;
        p.caseCount += 1;
        if (new Date(c.updatedAt) > new Date(p.lastSeen)) {
          p.lastSeen = c.updatedAt;
        }
      }
    }
    return Array.from(patientsMap.values()).sort(
      (a, b) =>
        new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [cases, isReferral]);

  const filtered = patientsList.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={hcPage.wrap}>
      <div className="flex flex-col gap-1">
        <h1 className={hcPage.title}>{en ? 'Patients' : 'Abarwayi'}</h1>
        <p className={hcPage.desc}>
          {en
            ? isReferral
              ? 'Open a patient to review referral, district, and current hospital journey.'
              : 'Open a patient to see their care journey and activity.'
            : 'Fungura umurwayi urebe inzira y’ubuvuzi n’ibikorwa.'}
        </p>
      </div>

      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={en ? 'Search patients…' : 'Shakisha abarwayi…'}
          className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-[color:var(--role-accent)] focus:ring-2 focus:ring-[color:var(--role-accent)]/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title={en ? 'No patients found' : 'Nta murwayi'}
              description={
                en ? 'Try a different search term.' : 'Gerageza indi mpamvu.'
              }
            />
          </div>
        ) : (
          filtered.map((p, i) => (
            <motion.button
              type="button"
              key={p.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() =>
                navigate(
                  `${base}/patients/${encodeURIComponent(p.code)}`
                )
              }
              className="group rounded-2xl border border-gray-100 bg-white p-5 text-left transition hover:border-[color:var(--role-accent)]/40 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-[color:var(--role-accent-soft)] text-sm font-bold text-[color:var(--role-accent)] transition group-hover:bg-[color:var(--role-accent)] group-hover:text-white">
                  {p.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-gray-900">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-gray-500">
                    {p.code}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {en ? 'Location' : 'Aho abarizwa'}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-700">
                    {p.district}, {p.sector}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {en ? 'Cases' : 'Imanza'}
                  </p>
                  <p className="text-xs font-medium text-gray-700">
                    {p.caseCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {en ? 'Sex' : 'Igitsina'}
                  </p>
                  <p className="text-xs font-medium text-gray-700">{p.sex}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {en ? 'Last activity' : 'Igikorwa gishya'}
                  </p>
                  <p className="text-xs font-medium text-gray-700">
                    {new Date(p.lastSeen).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end border-t border-gray-50 pt-4">
                <span className="text-xs font-bold text-[color:var(--role-accent)]">
                  {en ? 'View journey →' : 'Reba inzira →'}
                </span>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
