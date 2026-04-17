import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  HeartPulseIcon,
  ClipboardCheckIcon,
  SkullIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  BedDoubleIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { useTranslation } from 'react-i18next';
import { useHospitalBasePath } from './useHospitalBasePath';
import { districtHospitalInboxIncludes } from './caseHelpers';
import type { MalariaCase } from '../../types/domain';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const cardClass =
  'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm';

/** Statuses that count as under hospital-tier care in the UI */
const CLINICAL_STATUSES = [
  'Escalated',
  'Admitted',
  'Discharged',
  'Deceased',
] as const;

const OUTCOME_CHART_COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#f43f5e'];

export function HospitalDashboard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { user, notifications, refreshNotifications } = useAuth();
  const { cases, stats, loading, error, refresh } = useCasesApi();
  const base = useHospitalBasePath();
  const en = language === 'en';
  const isReferral = user?.role === 'Referral Hospital';
  const inboxRole = isReferral ? 'Referral Hospital' : 'District Hospital';

  const tierCases = useMemo(() => {
    if (isReferral) return cases;
    return cases.filter(districtHospitalInboxIncludes);
  }, [cases, isReferral]);

  const clinicalCases = tierCases.filter((c) =>
    CLINICAL_STATUSES.includes(
      c.status as (typeof CLINICAL_STATUSES)[number]
    )
  );

  /** Ongoing work only — hide completed outcomes. At district, hide cases already sent to referral. */
  const liveCases = useMemo(() => {
    const terminal = new Set(['Discharged', 'Deceased', 'Resolved']);
    return clinicalCases.filter((c) => {
      if (terminal.has(c.status)) return false;
      if (!isReferral && c.transferredToReferralHospital) return false;
      return true;
    });
  }, [clinicalCases, isReferral]);

  const todayStr = new Date().toDateString();
  const receivedToday = tierCases.filter((c) => {
    if (
      c.hospitalReceivedDateTime &&
      new Date(c.hospitalReceivedDateTime).toDateString() === todayStr
    ) {
      return true;
    }
    // Same-day HC→DH referral handoff (patient often arrives before "received" is logged)
    if (
      c.hcPatientTransferredToHospitalDateTime &&
      new Date(c.hcPatientTransferredToHospitalDateTime).toDateString() ===
        todayStr &&
      [
        'Escalated',
        'Admitted',
        'Treated',
        'Discharged',
        'Deceased',
      ].includes(c.status)
    ) {
      return true;
    }
    return false;
  }).length;

  const byStatus = stats?.byStatus ?? {};
  const admitted =
    typeof byStatus['Admitted'] === 'number' ?
      byStatus['Admitted']
    : clinicalCases.filter((c) => c.status === 'Admitted').length;
  const dischargedCount =
    typeof byStatus['Discharged'] === 'number' ?
      byStatus['Discharged'] + (byStatus['Treated'] ?? 0)
    : clinicalCases.filter((c) => c.status === 'Discharged' || c.status === 'Treated').length;
  const outcomes = dischargedCount;
  const deaths =
    typeof byStatus['Deceased'] === 'number' ?
      byStatus['Deceased']
    : clinicalCases.filter((c) => c.status === 'Deceased').length;

  const listPath = `${base}/triage`;
  const kpiStats = [
    {
      label: en ? 'Received today' : 'Byakirwa uyu munsi',
      value: receivedToday,
      icon: UsersIcon,
      ring: 'ring-sky-100',
      iconBg: 'bg-sky-50 text-sky-700',
      onClick: () => navigate(listPath),
    },
    {
      label: en ? 'Admitted' : 'Bari mu bitaro',
      value: admitted,
      icon: BedDoubleIcon,
      ring: 'ring-cyan-100',
      iconBg: 'bg-cyan-50 text-cyan-700',
      onClick: () => navigate(listPath),
    },
    {
      label: en ? 'Discharged' : 'Barekuwe',
      value: outcomes,
      icon: ClipboardCheckIcon,
      ring: 'ring-cyan-100',
      iconBg: 'bg-cyan-50 text-cyan-800',
      onClick: () => navigate(listPath),
    },
    {
      label: en ? 'Deaths' : 'Bapfuye',
      value: deaths,
      icon: SkullIcon,
      ring: 'ring-rose-100',
      iconBg: 'bg-rose-50 text-rose-700',
      onClick: () => navigate(listPath),
    },
  ];

  const donutData = [
    {
      name: en ? 'Admitted' : 'Bari mu bitaro',
      value: admitted,
    },
    {
      name: en ? 'Discharged' : 'Barekuwe',
      value: dischargedCount,
    },
    { name: en ? 'Deceased' : 'Bapfuye', value: deaths },
  ].filter((d) => d.value > 0);

  const escalations = notifications
    .filter((n) => n.targetRole === inboxRole)
    .slice(0, 6);

  const dashboardRows = useMemo(() => liveCases.slice(0, 12), [liveCases]);

  const openCaseFromDashboard = (c: MalariaCase) => {
    if (isReferral) {
      navigate(`${base}/case/${c.id}`);
      return;
    }
    if (!c.hospitalReceivedDateTime) {
      navigate(`${base}/triage`, { state: { tab: 'awaiting' } });
    } else {
      navigate(`${base}/cases`);
    }
  };
  const greet = user?.name?.split(/\s+/)[0] ?? '';

  return (
    <div className="space-y-6">
      <section
        className={`rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm`}
      >
        <div className="mb-5 h-1 w-14 rounded-full bg-[color:var(--role-accent)]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {inboxRole}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {greet
                ? en
                  ? `Welcome back, ${greet}`
                  : `Muraho, ${greet}`
                : en
                  ? `${inboxRole} workspace`
                  : 'Ibitaro'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {isReferral
                ? en
                  ? 'Severe malaria cases transferred for provincial / specialized care. Data is loaded from the server for your district.'
                  : 'Ibibazo byoherejwe ku rwego rwohereza.'
                : en
                  ? 'Referred severe malaria cases for your district.'
                  : 'Ibibazo byoherejwe n\'amavuriro y\'akarere.'}
            </p>
            {stats && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {en ? 'District scope total cases' : 'Umubare w\'akarere'}:{' '}
                <span className="tabular-nums text-slate-800">
                  {stats.totalCases}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => {
                void refresh();
                void refreshNotifications();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
              {en ? 'Refresh' : 'Ongera'}
            </button>
            {loading && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                <RefreshCwIcon size={14} className="animate-spin" />
                {en ? 'Loading…' : 'Birakurura…'}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertCircleIcon size={18} className="shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
          >
            <RefreshCwIcon size={14} />
            {en ? 'Retry' : 'Ongera'}
          </button>
        </div>
      )}

      {!loading && !error && tierCases.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            {en ? 'No cases in your queue yet' : 'Nta bibazo muri ubu buryo'}
          </p>
          <p className="mt-1 text-amber-900/90">
            {isReferral
              ? en
                ? 'Referral hospital users only see cases after district hospital has transferred them here. Ensure your account district matches the case district.'
                : 'Reba ko akarere kahuye.'
              : en
                ? 'District hospital sees cases in your district after health center escalation (Escalated or transfer logged). Create a test case in the same district (e.g. Ruhango) and escalate from HC.'
                : 'Reba ko amakuru y\'akarere anahura.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpiStats.map((s, i) => (
          <motion.button
            type="button"
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={s.onClick}
            className={`${cardClass} ring-1 ${s.ring} w-full text-left transition hover:border-slate-300 hover:shadow-md`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
                  {s.value}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}
              >
                <s.icon size={20} strokeWidth={2} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <section className={cardClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <BedDoubleIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {en ? 'Cases (live)' : 'Ibibazo'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {liveCases.length}{' '}
                {en
                  ? 'ongoing · new cases open Awaiting triage; others open All cases'
                  : 'bikomeje'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(listPath)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
          >
            {en ? 'Clinical management' : 'Ubuvuzi'}
            <ArrowRightIcon size={14} />
          </button>
        </div>

        {dashboardRows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {en
                ? 'No active cases — completed cases stay in All cases'
                : 'Nta bibazo biri gukora ubu'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[320px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {(en
                    ? ['Patient', 'Status', 'View']
                    : ['Umurwayi', 'Imimerere', 'Reba']
                  ).map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 first:rounded-tl-xl last:w-[108px] last:rounded-tr-xl last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardRows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 align-middle">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {c.patientName}
                      </p>
                      <p className="truncate font-mono text-[10px] text-slate-400">
                        {c.patientCode || c.id.slice(-8)} · {c.age}y {c.sex[0]} ·{' '}
                        {c.district}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => openCaseFromDashboard(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        {en ? 'View' : 'Reba'}
                        <ChevronRightIcon size={14} className="text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,38%)_minmax(0,62%)]">
        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <HeartPulseIcon size={18} />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              {en ? 'Outcome mix' : 'Incamake'}
            </h2>
          </div>
          {donutData.length === 0 ? (
            <div className="py-10 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
              {en ? 'No clinical cases to chart' : 'Nta bibazo byo kugaragaza ku gishushanyo'}
            </div>
          ) : (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            OUTCOME_CHART_COLORS[i % OUTCOME_CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {donutData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          OUTCOME_CHART_COLORS[i % OUTCOME_CHART_COLORS.length],
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900">
                        {d.value}
                      </p>
                      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {d.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className={`${cardClass} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <TrendingUpIcon size={18} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                {en ? 'Notifications' : 'Amakuru'}
              </h2>
            </div>
          </div>
          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {escalations.length === 0 ? (
              <div className="py-10 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                {en ? 'No notifications' : 'Nta matangazo'}
              </div>
            ) : (
              escalations.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-snug text-slate-900">
                        {a.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                        {a.message}
                      </p>
                      <p className="mt-1.5 text-[10px] text-slate-400">
                        {new Date(a.timestamp).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    {a.caseId && (
                      <button
                        type="button"
                        onClick={() => navigate(`${base}/case/${a.caseId}`)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white"
                      >
                        {en ? 'Open' : 'Fungura'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

    </div>
  );
}

