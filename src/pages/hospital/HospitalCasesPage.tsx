import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, ChevronRightIcon, FolderOpenIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { useHospitalBasePath } from './useHospitalBasePath';
import type { CaseStatus } from '../../types/domain';
import { districtHospitalInboxIncludes } from './caseHelpers';

const CLINICAL_STATUSES = [
  'Escalated',
  'Admitted',
  'Discharged',
  'Deceased',
] as const;

export function HospitalCasesPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { user } = useAuth();
  const { cases, loading, error, refresh } = useCasesApi();
  const base = useHospitalBasePath();
  const en = language === 'en';
  const isReferral = user?.role === 'Referral Hospital';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CaseStatus | 'All'>('All');

  const tierCases = useMemo(() => {
    if (isReferral) return cases;
    return cases.filter(districtHospitalInboxIncludes);
  }, [cases, isReferral]);

  const filtered = useMemo(() => {
    return tierCases
      .filter((c) => {
        if (filter === 'All') return true;
        if (filter === 'Discharged') {
          return c.status === 'Discharged' || c.status === 'Treated';
        }
        return c.status === filter;
      })
      .filter(
        (c) =>
          !search.trim() ||
          c.patientName.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase()) ||
          (c.patientCode &&
            c.patientCode.toLowerCase().includes(search.toLowerCase()))
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [tierCases, filter, search]);

  const statusFilters: (CaseStatus | 'All')[] = isReferral ?
      [
        'All',
        ...CLINICAL_STATUSES,
        'Pending',
        'Referred',
        'HC Received',
        'Resolved',
      ]
    : ['All', ...CLINICAL_STATUSES];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {isReferral ?
              en ?
                'Referral hospital'
              : 'Ibitaro bwohereza'
            : en ?
              'District hospital'
            : 'Ibitaro by\'akarere'}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {en ?
              isReferral ?
                'Hospital cases'
              : 'All cases'
            : 'Dosiye z\'ibitaro'}
          </h1>
          <p className="mt-1 max-w-xl text-xs text-slate-600 sm:text-sm">
            {en ?
              isReferral ?
                'Transferred cases for referral care.'
              : 'Full district list — open a case for the clinical file and pathway.'
            : 'Reba dosiye zawe.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {en ? 'Refresh' : 'Ongera'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {error}
        </div>
      )}

      <div className="relative">
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            en ? 'Search by name, case ID, or patient code…' : 'Shakisha…'
          }
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-[color:var(--role-accent)] focus:ring-2 focus:ring-[color:var(--role-accent)]/20"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === s ?
                'bg-[color:var(--role-accent)] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && filtered.length === 0 ?
        <div className="py-20 text-center text-sm font-medium text-slate-500">
          {en ? 'Loading cases…' : 'Birakurura…'}
        </div>
      : filtered.length === 0 ?
        <EmptyState
          title={en ? 'No cases match' : 'Nta dosiye'}
          description={
            en ?
              'Try another filter or search, or wait for new referrals from the health center.'
            : 'Gerageza indi mpamvu.'
          }
        />
      : <div className="space-y-2">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="flex items-stretch rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
            >
              <button
                type="button"
                onClick={() => navigate(`${base}/case/${c.id}`)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg pr-2 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--role-accent)] text-white">
                  <FolderOpenIcon size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {c.patientName}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {c.id} · {c.patientCode || '—'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {new Date(c.updatedAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={c.status} />
                <ChevronRightIcon className="shrink-0 text-slate-300" size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      }
    </div>
  );
}
