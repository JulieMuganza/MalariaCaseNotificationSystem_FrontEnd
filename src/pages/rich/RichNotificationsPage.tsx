import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ChevronRightIcon,
  SearchIcon,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  useSurveillanceBasePath,
  useSurveillancePartnerLabel,
} from './useSurveillanceBasePath';

const TIER_ALL = 'All' as const;
type TierFilter =
  | typeof TIER_ALL
  | 'CHW'
  | 'Health Center'
  | 'District Hospital'
  | 'Referral Hospital'
  | 'RICH'
  | 'PFTH'
  | 'SFR'
  | 'Admin';

const TIER_CHIPS: TierFilter[] = [
  TIER_ALL,
  'CHW',
  'Health Center',
  'District Hospital',
  'Referral Hospital',
  'RICH',
  'PFTH',
  'SFR',
];

type SourceRoleFilter =
  | 'All'
  | 'CHW'
  | 'Health Center'
  | 'District Hospital'
  | 'Referral Hospital';

type EventFilter = 'All' | 'Deceased' | 'Discharged' | 'Referral' | 'Severe';

function inferSourceRole(message: string): SourceRoleFilter {
  const m = message.toLowerCase();
  if (m.includes('chw')) return 'CHW';
  if (m.includes('health center') || m.includes('hc')) return 'Health Center';
  if (m.includes('district hospital') || m.includes('dist hsp') || m.includes('dh ')) return 'District Hospital';
  if (m.includes('referral hospital') || m.includes('referral')) return 'Referral Hospital';
  return 'All';
}

function inferEvent(title: string, message: string): EventFilter {
  const t = `${title} ${message}`.toLowerCase();
  if (t.includes('deceased') || t.includes('death')) return 'Deceased';
  if (t.includes('discharge') || t.includes('went home')) return 'Discharged';
  if (t.includes('referral') || t.includes('transfer')) return 'Referral';
  if (t.includes('severe')) return 'Severe';
  return 'All';
}

export function RichNotificationsPage() {
  const { notifications, markNotificationRead, refreshNotifications } =
    useAuth();
  const base = useSurveillanceBasePath();
  const partnerLabel = useSurveillancePartnerLabel();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const en = language === 'en';

  const [tier, setTier] = useState<TierFilter>(TIER_ALL);
  const [sourceRole, setSourceRole] = useState<SourceRoleFilter>('All');
  const [eventType, setEventType] = useState<EventFilter>('All');
  const [search, setSearch] = useState('');

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [notifications]
  );

  const filtered = useMemo(() => {
    return sorted.filter((n) => {
      if (tier !== TIER_ALL && n.targetRole !== tier) return false;
      if (sourceRole !== 'All' && inferSourceRole(n.message || '') !== sourceRole) return false;
      if (eventType !== 'All' && inferEvent(n.title, n.message || '') !== eventType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.caseId && n.caseId.toLowerCase().includes(q)) ||
        (n.recipientRoles && n.recipientRoles.toLowerCase().includes(q))
      );
    });
  }, [sorted, tier, sourceRole, eventType, search]);

  /** Case refs that appear more than once — highlight shared context */
  const refCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of sorted) {
      if (!n.caseId) continue;
      m.set(n.caseId, (m.get(n.caseId) ?? 0) + 1);
    }
    return m;
  }, [sorted]);

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--role-accent)]">
            {partnerLabel}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {en ? 'Notification center' : 'Amakuru'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-gray-500">
            {en
              ? 'Alerts for your scope: who they were sent to (CHW, health center, district, referral, surveillance partners), phase, dates, and case links. Use filters to focus one tier.'
              : 'Amakuru yose mu sisitemu.'}
          </p>
        </div>
        <div className="flex h-10 items-center rounded-xl bg-[color:var(--role-accent)] px-4 text-sm font-semibold text-white">
          <BellIcon size={16} className="mr-2 opacity-90" />
          {filtered.length} / {sorted.length}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              en ? 'Search title, message, case ref, recipient…' : 'Shakisha…'
            }
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[color:var(--role-accent)] focus:ring-2 focus:ring-[color:var(--role-accent)]/20"
          />
        </div>
        <button
          type="button"
          onClick={() => void refreshNotifications()}
          className="shrink-0 rounded-xl border border-[color:var(--role-accent)]/25 bg-[color:var(--role-accent)]/10 px-4 py-2.5 text-sm font-semibold text-[color:var(--role-accent)] hover:bg-[color:var(--role-accent)]/15"
        >
          {en ? 'Refresh' : 'Ongera'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIER_CHIPS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              tier === t
                ? 'bg-[color:var(--role-accent)] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === TIER_ALL ? (en ? 'All tiers' : 'Byose') : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={sourceRole}
          onChange={(e) => setSourceRole(e.target.value as SourceRoleFilter)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
        >
          <option value="All">{en ? 'All source roles' : 'Inkomoko zose'}</option>
          <option value="CHW">CHW</option>
          <option value="Health Center">{en ? 'Health Center' : 'Ikigo Nderabuzima'}</option>
          <option value="District Hospital">{en ? 'District Hospital' : 'Ibitaro by\'akarere'}</option>
          <option value="Referral Hospital">{en ? 'Referral Hospital' : 'Ibitaro byo kohereza'}</option>
        </select>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventFilter)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
        >
          <option value="All">{en ? 'All notification types' : 'Ubwoko bwose'}</option>
          <option value="Deceased">{en ? 'Patient deceased' : 'Umurwayi yapfuye'}</option>
          <option value="Discharged">{en ? 'Patient discharged' : 'Umurwayi yasohotse'}</option>
          <option value="Referral">{en ? 'Referral / transfer' : 'Kohereza'}</option>
          <option value="Severe">{en ? 'Severe malaria updates' : 'Ivugurura ry\'indwara ikomeye'}</option>
        </select>
      </div>

      <ul className="space-y-4">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <p className="text-sm font-medium text-gray-400">
              {en ? 'No notifications match.' : 'Nta makuru.'}
            </p>
          </li>
        ) : (
          filtered.map((n) => {
            const shared =
              n.caseId && (refCounts.get(n.caseId) ?? 0) > 1;
            const source = inferSourceRole(n.message || '');
            return (
              <li
                key={n.id}
                className={`rounded-2xl border p-6 shadow-sm ${
                  n.read
                    ? 'border-gray-100 bg-white'
                    : 'border-[color:var(--role-accent)]/30 bg-[color:var(--role-accent)]/10 ring-1 ring-[color:var(--role-accent)]/15'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-base font-bold text-gray-900">{n.title}</p>
                  <span className="text-sm font-medium text-gray-500">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                    {n.targetRole}
                  </span>
                  {source !== 'All' && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                      {en ? 'Source' : 'Inkomoko'}: {source}
                    </span>
                  )}
                  {n.phase && (
                    <span className="rounded-full bg-[color:var(--role-accent)]/15 px-2.5 py-0.5 text-[10px] font-black text-[color:var(--role-accent)]">
                      {en ? 'Phase' : 'Icyiciro'}: {n.phase}
                    </span>
                  )}
                  {n.contentLevel && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">
                      {n.contentLevel}
                    </span>
                  )}
                  {shared && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-100">
                      <Layers size={12} />
                      {en ? 'Same case — multiple tiers' : 'Kimwe — inzego nyinshi'}
                    </span>
                  )}
                </div>
                {n.recipientRoles && (
                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    {en ? 'Recipients' : 'Abakira'}: {n.recipientRoles}
                  </p>
                )}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {n.message || (en ? '(No message body)' : 'Nta butumwa')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => void markNotificationRead(n.id)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {en ? 'Mark read' : 'Soma'}
                    </button>
                  )}
                  {n.caseId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!n.read) await markNotificationRead(n.id);
                        navigate(`${base}/case/${n.caseId}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-[color:var(--role-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                    >
                      {en ? 'Open case' : 'Fungura dosiye'}
                      <ChevronRightIcon size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
