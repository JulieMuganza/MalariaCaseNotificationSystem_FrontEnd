import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, ChevronRightIcon, FolderOpenIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';
import { useHospitalBasePath } from '../hospital/useHospitalBasePath';
import { useSurveillancePartnerLabel } from './useSurveillanceBasePath';
import type { CaseStatus } from '../../types/domain';

const STATUS_FILTERS: (CaseStatus | 'All')[] = [
  'All',
  'Pending',
  'Referred',
  'HC Received',
  'Escalated',
  'Admitted',
  'Discharged',
  'Resolved',
  'Deceased',
];

export function RichCasesPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { cases, loading, error, refresh } = useCasesApi();
  const base = useHospitalBasePath();
  const partnerLabel = useSurveillancePartnerLabel();
  const en = language === 'en';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CaseStatus | 'All'>('All');

  const filtered = useMemo(() => {
    return cases
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
  }, [cases, filter, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--role-accent)]">
            {partnerLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {en ? 'National case registry' : 'Dosiye zose'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {en
              ? 'Every severe malaria case in the system: origin, pathway, outcomes, and transfers — open a row for full detail.'
              : 'Reba dosiye zose.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border border-[color:var(--role-accent)]/25 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--role-accent)] shadow-sm hover:bg-[color:var(--role-accent)]/10"
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
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-[color:var(--role-accent)] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && filtered.length === 0 ? (
        <div className="py-20 text-center text-sm font-medium text-slate-500">
          {en ? 'Loading cases…' : 'Birakurura…'}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={en ? 'No cases match' : 'Nta dosiye'}
          description={
            en
              ? 'Try another filter or search.'
              : 'Gerageza indi mpamvu.'
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              onClick={() => navigate(`${base}/case/${c.id}`)}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[color:var(--role-accent)]/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--role-accent)] text-sm font-bold text-white">
                <FolderOpenIcon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {c.patientName}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                  {c.id} · {c.patientCode || '—'} · {c.district}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(c.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={c.status} />
                <ChevronRightIcon className="text-slate-400" size={18} />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
