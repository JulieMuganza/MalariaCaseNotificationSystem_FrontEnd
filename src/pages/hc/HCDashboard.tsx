import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCwIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ActivityIcon,
  StethoscopeIcon,
  FileCheck2Icon,
  BarChart3Icon,
  ChevronRightIcon,
  EyeIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { useFirstLineBasePath } from './useFirstLineBasePath';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const cardClass =
  'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm';

/** HC accent bar — matches role blue without CSS var in gradient */
const accentBar = 'from-slate-500 to-[#3a6ea5]';

function weeklyBars(cases: { createdAt: string }[]) {
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    return {
      name: d.toLocaleDateString('en', { weekday: 'short' }),
      cases: 0,
      date: d.toDateString(),
    };
  });
  for (const c of cases) {
    const dstr = new Date(c.createdAt).toDateString();
    const day = days.find((d) => d.date === dstr);
    if (day) day.cases += 1;
  }
  return days;
}

const STATUS_ORDER = [
  'Pending',
  'Referred',
  'HC Received',
  'Escalated',
  'Admitted',
  'Treated',
  'Discharged',
  'Resolved',
  'Deceased',
] as const;

export function HCDashboard() {
  const navigate = useNavigate();
  const base = useFirstLineBasePath();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { user, notifications, markNotificationRead } = useAuth();
  const { cases, stats, loading, error, refresh } = useCasesApi();
  const en = language === 'en';
  const hcRole =
    base === '/lc'
      ? en
        ? 'Health Post'
        : 'Ivuriro Riciriritse'
      : en
        ? 'Health Center'
        : 'Ikigo Nderabuzima';
  const dayLocale: 'en' | 'rw' = en ? 'en' : 'rw';
  const isHealthPost = base === '/lc';

  const triageQueue = useMemo(
    () => cases.filter((c) => c.status === 'Pending' || c.status === 'Referred'),
    [cases]
  );
  const inObservation = useMemo(
    () => cases.filter((c) => c.status === 'HC Received'),
    [cases]
  );
  const hospitalPipeline = useMemo(
    () =>
      cases.filter((c) =>
        ['Escalated', 'Admitted', 'Treated'].includes(c.status)
      ),
    [cases]
  );

  const totalDistrict = stats?.totalCases ?? cases.length;
  const eidsrCount = stats?.reportedToEIDSR ?? 0;
  const eidsrRate =
    totalDistrict > 0 ? Math.round((eidsrCount / totalDistrict) * 100) : 0;

  const kpiStats = [
    {
      label: en ? 'Awaiting triage' : 'Gutegereza',
      value: triageQueue.length,
      icon: StethoscopeIcon,
      ring: 'ring-sky-100',
      iconBg: 'bg-sky-50 text-sky-700',
      onClick: () => navigate(`${base}/triage`, { state: { tab: 'pending' } }),
    },
    {
      label: en
        ? isHealthPost
          ? 'At health post'
          : 'At health center'
        : isHealthPost
          ? 'Ku Ivuriro Riciriritse'
          : 'Ku kigo',
      value: inObservation.length,
      icon: ActivityIcon,
      ring: 'ring-blue-100',
      iconBg: 'bg-blue-50 text-blue-800',
      onClick: () => navigate(`${base}/triage`, { state: { tab: 'at_hc' } }),
    },
    {
      label: en ? 'Hospital pipeline' : 'Ku bitaro',
      value: hospitalPipeline.length,
      icon: BarChart3Icon,
      ring: 'ring-violet-100',
      iconBg: 'bg-violet-50 text-violet-700',
      onClick: () => navigate(`${base}/history`),
    },
    {
      label: en ? 'EIDSR reported' : 'EIDSR',
      value: `${eidsrRate}%`,
      icon: FileCheck2Icon,
      ring: 'ring-teal-100',
      iconBg: 'bg-teal-50 text-teal-800',
      onClick: () => navigate(`${base}/reports`),
    },
  ];

  const hcNotificationsList = useMemo(() => {
    return notifications
      .filter((n) =>
        base === '/lc' ? n.targetRole === 'Local Clinic' : n.targetRole === 'Health Center'
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 6);
  }, [notifications]);

  const activeCases = useMemo(
    () =>
      cases
        .filter((c) =>
          ['Pending', 'Referred', 'HC Received'].includes(c.status)
        )
        .slice(0, 10),
    [cases]
  );

  const barData = useMemo(() => weeklyBars(cases).map((d) => ({ ...d, name: new Date(d.date).toLocaleDateString(dayLocale, { weekday: 'short' }) })), [cases, dayLocale]);

  const statusBreakdown = useMemo(() => {
    const raw = stats?.byStatus ?? {};
    return STATUS_ORDER.map((s) => ({
      status: s,
      count: raw[s] ?? 0,
    })).filter((x) => x.count > 0);
  }, [stats?.byStatus]);

  const maxStatus = Math.max(1, ...statusBreakdown.map((x) => x.count));
  const greet = user?.name?.split(/\s+/)[0] ?? '';

  if (loading && cases.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        <p className="text-sm font-medium text-slate-500">
          {en ? 'Loading…' : 'Birakurura…'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome — same pattern as HospitalDashboard */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className={`mb-5 h-1 w-14 rounded-full bg-gradient-to-r ${accentBar}`} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {hcRole}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {greet
                ? en
                  ? `Welcome back, ${greet}`
                  : `Muraho, ${greet}`
                : en
                  ? `${hcRole} workspace`
                  : 'Ikigo'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {en
                ? 'Manage community referrals and care with live district data.'
                : 'Gusuzuma, gukina no kohereza ku bitaro.'}
            </p>
            {stats && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {en ? 'District scope total cases' : 'Umubare w’akarere'}:{' '}
                <span className="tabular-nums text-slate-800">
                  {stats.totalCases}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCwIcon
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              {en ? 'Refresh' : 'Vugurura'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`${base}/new-case`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {en ? 'New direct case' : 'Dosiye nshya ku kigo'}
            </button>
            {loading && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                <RefreshCwIcon size={14} className="animate-spin" />
                {en ? 'Syncing…' : 'Birahuzura…'}
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
              <StethoscopeIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {en ? 'Primary care queue' : 'Abarwayi'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {activeCases.length}{' '}
                {en ? 'pending / referred / received · open a file' : 'muri uru rutonde'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${base}/history`)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
          >
            {en ? 'All cases' : 'Dosiye zose'}
            <ArrowRightIcon size={14} />
          </button>
        </div>

        {activeCases.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {en
                ? 'No cases in this queue right now'
                : 'Nta makuru muri uru rutonde'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {(en
                    ? ['Patient', 'Age / sex', 'Sector', 'Status', 'Actions']
                    : ['Umurwayi', 'Imyaka', 'Umurenge', 'Imimerere', 'Ibikorwa']
                  ).map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-4">
                      <p className="text-xs font-semibold text-slate-900">
                        {c.patientName}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {c.patientCode || c.id.slice(-8)}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {c.age}
                      {en ? 'y' : ''} / {c.sex[0]}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {c.sector}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={c.status} isHealthPost={isHealthPost} />
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => navigate(`${base}/case/${c.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        <EyeIcon size={11} />
                        {en ? 'View' : 'Reba'}
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
              <TrendingUpIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {en ? 'New cases (7 days)' : 'Amakuru mashya'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {en ? 'Daily count in your district' : 'Ku munsi'}
              </p>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="18%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  dy={6}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="cases"
                  fill="#3a6ea5"
                  radius={[6, 6, 2, 2]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${cardClass} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <ActivityIcon size={18} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                {en ? 'Notifications' : 'Amakuru'}
              </h2>
            </div>
          </div>
          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {hcNotificationsList.length === 0 ? (
              <div className="py-10 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                {en ? 'No notifications' : 'Nta makuru'}
              </div>
            ) : (
              hcNotificationsList.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <ActivityIcon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">
                      {a.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">
                      {a.message}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {a.caseId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!a.read) await markNotificationRead(a.id);
                        navigate(`${base}/case/${a.caseId}`);
                      }}
                      className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-slate-700 hover:underline"
                    >
                      {en ? 'Open' : 'Fungura'}
                      <ChevronRightIcon size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(`${base}/notifications`)}
            className="w-full rounded-lg py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {en ? 'View all notifications' : 'Reba byose'}
          </button>
        </section>
      </div>

      <section className={`${cardClass} space-y-4`}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <BarChart3Icon size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {en ? 'Case status mix' : 'Imimerere'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {en ? 'In your district scope' : 'Ku karere'}
            </p>
          </div>
        </div>
        {statusBreakdown.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-slate-400">
            {en ? 'No cases in view yet.' : 'Nta bibazo bigaragara.'}
          </p>
        ) : (
          <div className="space-y-3">
            {statusBreakdown.map(({ status, count }) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                  <span>{status}</span>
                  <span className="tabular-nums text-slate-900">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (count / maxStatus) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

