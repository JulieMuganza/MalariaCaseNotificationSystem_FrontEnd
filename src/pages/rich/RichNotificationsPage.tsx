import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ChevronRightIcon,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import type { Notification } from '../../types/domain';
import {
  useSurveillanceBasePath,
  useSurveillancePartnerLabel,
} from './useSurveillanceBasePath';

const TIER_ALL = 'All' as const;
type TierFilter =
  | typeof TIER_ALL
  | 'CHW'
  | 'Health Post'
  | 'Health Center'
  | 'District Hospital'
  | 'Referral Hospital';

/**
 * Surveillance inbox rows often share the same targetRole (e.g. RICH) while the body
 * describes CHW → HC → DH flow. Infer which tiers each alert relates to from text.
 */
function tiersForNotification(n: Notification): TierFilter[] {
  const blob = `${n.title}\n${n.message ?? ''}\n${n.recipientRoles ?? ''}`.toLowerCase();
  const tiers = new Set<TierFilter>();

  if (
    /\bchw\b|chw->|chw→|from chw|community health worker|cheo\b/i.test(blob)
  ) {
    tiers.add('CHW');
  }
  if (
    /\bhealth post\b|local clinic|ivuriro riciriritse|->\s*health\s+post|hp->|hp→/i.test(
      blob
    )
  ) {
    tiers.add('Health Post');
  }
  if (
    /\bhealth center\b|health centre|ikigo nderabuzima|ikigo|->\s*health\s+center|hc->|hc→/i.test(
      blob
    )
  ) {
    tiers.add('Health Center');
  }
  if (
    /\bdistrict hospital\b|district hosp|dist\.?\s*hsp|dh->|dh→|\bdh\b(?=\s|:|,|\.)/i.test(
      blob
    )
  ) {
    tiers.add('District Hospital');
  }
  if (
    /\breferral hospital\b|referral hosp|referral->|->\s*referral|provincial referral/i.test(
      blob
    )
  ) {
    tiers.add('Referral Hospital');
  }

  return [...tiers];
}

function tierMatchesSelection(n: Notification, tier: TierFilter): boolean {
  if (tier === TIER_ALL) return true;
  return tiersForNotification(n).includes(tier);
}

export function RichNotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const base = useSurveillanceBasePath();
  const partnerLabel = useSurveillancePartnerLabel();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const en = language === 'en';

  const [tier, setTier] = useState<TierFilter>(TIER_ALL);
  const [markingAll, setMarkingAll] = useState(false);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [notifications]
  );

  const unreadInList = useMemo(
    () => sorted.filter((n) => !n.read).length,
    [sorted]
  );

  const filtered = useMemo(() => {
    return sorted.filter((n) => {
      if (!tierMatchesSelection(n, tier)) return false;
      return true;
    });
  }, [sorted, tier]);

  /** Case refs that appear more than once — highlight shared context */
  const refCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of sorted) {
      if (!n.caseId) continue;
      m.set(n.caseId, (m.get(n.caseId) ?? 0) + 1);
    }
    return m;
  }, [sorted]);

  const tierTabs: Array<{ value: TierFilter; label: string }> = [
    { value: TIER_ALL, label: en ? 'All' : 'Byose' },
    { value: 'CHW', label: 'CHW' },
    { value: 'Health Post', label: en ? 'Health Post' : 'Ivuriro Riciriritse' },
    { value: 'Health Center', label: en ? 'Health Center' : 'Ikigo Nderabuzima' },
    { value: 'District Hospital', label: en ? 'District Hospital' : "Ibitaro by'akarere" },
    { value: 'Referral Hospital', label: en ? 'Referral Hospital' : 'Ibitaro byo kohereza' },
  ];

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--role-accent)]">
            {partnerLabel}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {en ? 'Notification center' : 'Amakuru'}
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            {en
              ? 'Care-pathway alerts for your province. Use filters below.'
              : "Amakuru y'inzira y'ubuvuzi mu gihugu cyawe. Koresha amahitamo hepfo."}
          </p>
        </div>
        <button
          type="button"
          disabled={markingAll || unreadInList === 0}
          onClick={() => {
            setMarkingAll(true);
            void markAllNotificationsRead().finally(() => setMarkingAll(false));
          }}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BellIcon size={16} className="text-gray-500" aria-hidden />
          {en ? 'Mark all read' : 'Soma byose'}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
          {tierTabs.map((tab) => {
            const active = tier === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTier(tab.value)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-[color:var(--role-accent)] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
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
