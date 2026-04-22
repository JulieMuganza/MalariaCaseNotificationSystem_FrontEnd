import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  StethoscopeIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  UsersIcon,
  ActivityIcon
} from 'lucide-react';
import type { TooltipProps } from 'recharts';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  casesPerDayLast7Days,
  casesPerDayLast14Days,
  weekOverWeekTrendFromDaily,
  criticalCreatedPerDayLast7Days,
  pipelineActivityPerDayLast7Days,
} from '../../components/dashboard/MiniSparkline';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';
import type { MalariaCase } from '../../types/domain';

const MS_DAY = 86400000;

function isCriticalCase(c: {
  symptomCount?: number;
  symptoms?: string[];
  status: string;
}) {
  return (
    (c.symptomCount ?? c.symptoms?.length ?? 0) >= 3 ||
    ['Escalated', 'Admitted', 'Deceased'].includes(c.status)
  );
}

function inReferralPipeline(status: string) {
  return ['Referred', 'HC Received', 'Escalated', 'Admitted', 'Treated'].includes(
    status
  );
}

function lastNMonthKeys(n: number): { key: string; shortLabel: string }[] {
  const out: { key: string; shortLabel: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const shortLabel = d.toLocaleString('en', { month: 'short' });
    out.push({ key, shortLabel });
  }
  return out;
}

function monthlyBars(
  cases: MalariaCase[],
  monthCount: number
): { name: string; newReports: number; closedMonth: number; sortKey: string }[] {
  const keys = lastNMonthKeys(monthCount);
  return keys.map(({ key, shortLabel }) => {
    const [y, m] = key.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
    const newReports = cases.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= monthStart.getTime() && t <= monthEnd.getTime();
    }).length;
    const closedMonth = cases.filter((c) => {
      if (!['Resolved', 'Discharged', 'Deceased'].includes(c.status)) return false;
      const t = new Date(c.updatedAt).getTime();
      return t >= monthStart.getTime() && t <= monthEnd.getTime();
    }).length;
    return {
      name: shortLabel,
      sortKey: key,
      newReports,
      closedMonth,
    };
  });
}

const BR = '#0d9488';

/** Open vs closed outcomes (real case mix). */
function donutOutcomeSegments(cases: MalariaCase[], en: boolean) {
  const pending = cases.filter((c) => c.status === 'Pending').length;
  const inCare = cases.filter((c) => ['Referred', 'HC Received', 'Escalated', 'Admitted'].includes(c.status)).length;
  const treated = cases.filter((c) => c.status === 'Treated').length;
  const resolved = cases.filter((c) => ['Resolved', 'Discharged'].includes(c.status)).length;
  const deceased = cases.filter((c) => c.status === 'Deceased').length;

  const segs = [
    { name: en ? 'Critical/Admitted' : 'Ibibazo Bikomeye', value: inCare, color: '#0d9488' },
    { name: en ? 'Under Treatment' : 'Abari mu Mavuriro', value: treated, color: '#3b82f6' },
    { name: en ? 'Pending Follow-up' : 'Abategereje', value: pending, color: '#f59e0b' },
    { name: en ? 'Recovered' : 'Bakize', value: resolved, color: '#10b981' },
    { name: en ? 'Mortality' : 'Bapfuye', value: deceased, color: '#ef4444' },
  ].filter((s) => s.value > 0);

  return segs.length > 0
    ? segs
    : [{ name: en ? 'Healthy' : 'Basanzwe', value: 1, color: '#E5E7EB' }];
}

const STATUS_ORDER: MalariaCase['status'][] = [
  'Pending',
  'Referred',
  'HC Received',
  'Escalated',
  'Admitted',
  'Treated',
  'Discharged',
  'Resolved',
  'Deceased',
];

function sumByStatus(
  byStatus: Record<string, number> | undefined,
  keys: string[]
): number {
  if (!byStatus) return 0;
  return keys.reduce((s, k) => s + (byStatus[k] ?? 0), 0);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function visitTimeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

function OverviewTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  if (!active || !payload?.length) return null;
  const sum = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
  const en = language === 'en';
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm shadow-lg">
      <div className="flex items-center gap-2 font-semibold text-[#111827]">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: BR }}
        />
        <span>
          {label}: {sum.toLocaleString()} {en ? (sum === 1 ? 'case' : 'cases') : 'dosiye'}
        </span>
      </div>
    </div>
  );
}

const AVATAR_BG = ['#DBEAFE', '#E0E7FF', '#FCE7F3', '#D1FAE5', '#FEF3C7', '#E5E7EB'];

export function CHWHome() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Pending: en ? 'Pending' : 'Bitegereje',
      Referred: en ? 'Referred' : 'Byoherejwe',
      'HC Received': en ? 'HC received' : 'Byakiriwe ku kigonderabuzima',
      Escalated: en ? 'Escalated' : 'Byazamuwe',
      Admitted: en ? 'Admitted' : 'Byakiriwe mu bitaro',
      Treated: en ? 'Treated' : 'Yazamuwe',
      Discharged: en ? 'Discharged' : 'Yasezerewe',
      Resolved: en ? 'Resolved' : 'Byakemutse',
      Deceased: en ? 'Deceased' : 'Yitabye Imana',
    };
    return map[status] ?? status;
  };
  const { cases, stats, loading, error, refresh } = useCasesApi();
  const [rangeMonths, setRangeMonths] = useState<1 | 3 | 6 | 12>(12);

  const byStatus = stats?.byStatus ?? {};
  const totalCases = stats?.totalCases ?? cases.length;
  const activeCases = sumByStatus(byStatus, [
    'Pending',
    'Referred',
    'HC Received',
    'Escalated',
    'Admitted',
    'Treated',
  ]);
  const referredCases = sumByStatus(byStatus, [
    'Referred',
    'HC Received',
    'Escalated',
    'Admitted',
    'Treated',
  ]);
  const resolvedCases = sumByStatus(byStatus, [
    'Resolved',
    'Discharged',
    'Deceased',
  ]);

  const weekAgo = Date.now() - 7 * MS_DAY;
  const twoWeekAgo = Date.now() - 14 * MS_DAY;

  const newThisWeek = cases.filter(
    (c) => new Date(c.createdAt).getTime() >= weekAgo
  ).length;

  const newPrevWeek = cases.filter((c) => {
    const x = new Date(c.createdAt).getTime();
    return x >= twoWeekAgo && x < weekAgo;
  }).length;

  const sparkActivity = casesPerDayLast7Days(cases);
  const sparkNew = sparkActivity;
  const sparkCritical = criticalCreatedPerDayLast7Days(cases);
  const sparkPipeline = pipelineActivityPerDayLast7Days(cases, inReferralPipeline);

  const daily14 = casesPerDayLast14Days(cases);
  const activityTrendRaw = weekOverWeekTrendFromDaily(daily14);

  const sinceLabel =
    language === 'en' ? 'Since last week' : 'Kuva icyumweru gishize';

  const pctTrend = (
    thisWeek: number,
    prevWeek: number
  ): { label: string; pct: number; up: boolean } | null => {
    if (thisWeek === 0 && prevWeek === 0) return null;
    if (prevWeek === 0)
      return { label: en ? 'New cases' : 'Ibibazo bishya', pct: thisWeek, up: true };
    const raw = Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
    return { label: `${Math.abs(raw)}%`, pct: Math.abs(raw), up: raw >= 0 };
  };

  const critThisWeek = cases.filter(
    (c) =>
      new Date(c.createdAt).getTime() >= weekAgo && isCriticalCase(c)
  ).length;
  const critPrevWeek = cases.filter((c) => {
    const x = new Date(c.createdAt).getTime();
    return x >= twoWeekAgo && x < weekAgo && isCriticalCase(c);
  }).length;

  const refThisWeek = cases.filter(
    (c) =>
      new Date(c.createdAt).getTime() >= weekAgo && inReferralPipeline(c.status)
  ).length;
  const refPrevWeek = cases.filter((c) => {
    const x = new Date(c.createdAt).getTime();
    return (
      x >= twoWeekAgo && x < weekAgo && inReferralPipeline(c.status)
    );
  }).length;

  const barData = useMemo(
    () => monthlyBars(cases, rangeMonths),
    [cases, rangeMonths]
  );

  const donutSegments = useMemo(
    () => donutOutcomeSegments(cases, en),
    [cases, en]
  );

  const latestVisits = useMemo(
    () =>
      [...cases]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 4),
    [cases]
  );

  const avgPerMonth =
    barData.length > 0
      ? Math.round(
          barData.reduce((s, r) => s + r.newReports + r.closedMonth, 0) /
            barData.length
        )
      : 0;

  const barTrend = activityTrendRaw ? { label: `${Math.abs(activityTrendRaw.pct)}%`, ...activityTrendRaw } : null;

  const cardClass = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm';

  const tabBtn = (active: boolean) =>
    `relative flex items-center gap-2 pb-3 text-sm font-bold transition-all ${
      active
        ? 'text-teal-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-teal-600'
        : 'text-gray-400 hover:text-gray-900'
    }`;

  const consultLabel = en ? 'New Reports' : 'Raporo Nshya';
  const checkupLabel = en ? 'Closed' : 'Byarangiye';

  return (
    <div className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span className="flex items-center gap-2 font-bold">
            <AlertCircleIcon size={18} className="shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 transition-all active:scale-95"
          >
            <RefreshCwIcon size={14} />
            {en ? 'Retry' : 'Ongera'}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-8 border-b border-gray-100">
        <span className={tabBtn(true)}>
          <LayoutDashboardIcon size={18} />
          {en ? 'Overview' : 'Incamake'}
        </span>
        <button
          type="button"
          className={tabBtn(false)}
          onClick={() => navigate('/chw/new-case')}
        >
          <StethoscopeIcon size={18} />
          {en ? 'New Case' : 'Gusuzuma'}
        </button>
      </div>

      {loading && !error ? (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
           <RefreshCwIcon size={16} className="animate-spin text-teal-600" />
           <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">
             {en ? 'Syncing your clinical data…' : 'Vugurura amakuru…'}
           </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={en ? 'Total cases' : 'Ibibazo byose'}
          value={totalCases}
          sparkline={sparkActivity}
          sinceLabel={sinceLabel}
          trend={
            activityTrendRaw
              ? { pct: activityTrendRaw.pct, up: activityTrendRaw.up }
              : null
          }
        />
        <StatCard
          label={en ? 'Active' : 'Birakomeje'}
          value={activeCases}
          sparkline={sparkNew}
          sinceLabel={sinceLabel}
          trend={pctTrend(newThisWeek, newPrevWeek)}
        />
        <StatCard
          label={en ? 'In referral' : 'Mu nzira yo koherezwa'}
          value={referredCases}
          sparkline={sparkPipeline}
          sinceLabel={sinceLabel}
          trend={pctTrend(refThisWeek, refPrevWeek)}
        />
        <StatCard
          label={en ? 'Resolved' : 'Byakemutse'}
          value={resolvedCases}
          sparkline={sparkCritical}
          sinceLabel={sinceLabel}
          trend={pctTrend(critThisWeek, critPrevWeek)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,68%)_minmax(0,32%)]">
        <section className={`${cardClass} space-y-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                  <TrendingUpIcon size={16} />
                </div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                  {en ? 'Reporting Activity' : 'Ibikorwa bya Raporo'}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                   {avgPerMonth.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{en ? 'Avg Monthly' : 'Impuzandengo'}</span>
                {barTrend ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${
                      barTrend.up
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {barTrend.up ? '+' : '−'}
                    {barTrend.label}
                    {barTrend.up ? <TrendingUpIcon size={10} /> : <ActivityIcon size={10} />}
                  </span>
                ) : null}
              </div>
            </div>
            
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {(
                [
                  { m: 12 as const, lab: en ? '1Y' : '1Y' },
                  { m: 6 as const, lab: en ? '6M' : '6M' },
                  { m: 3 as const, lab: en ? '3M' : '3M' },
                  { m: 1 as const, lab: en ? '1M' : '1M' },
                ] as const
              ).map(({ m, lab }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRangeMonths(m)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition-all ${
                    rangeMonths === m
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {lab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-[250px] w-full">
            <div className="absolute right-0 top-0 z-10 flex gap-4 text-[10px] font-bold uppercase tracking-tight text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                {consultLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-teal-100 border border-teal-200" />
                {checkupLabel}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                barGap={8}
                margin={{ top: 30, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#F3F4F6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax * 1.2), 5)]}
                />
                <Tooltip
                  cursor={{ fill: '#F9FAFB', radius: 4 }}
                  content={<OverviewTooltip />}
                />
                <Bar
                  dataKey="newReports"
                  fill={BR}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="closedMonth"
                  fill="#ccfbf1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${cardClass} flex flex-col`}>
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <UsersIcon size={16} />
             </div>
             <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
               {en ? 'Patient Outcomes' : 'Incamake'}
             </h2>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {en ? 'Diagnostic Distribution' : 'Igipimo'}
          </p>
          
          <div className="relative mx-auto mt-6 h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="85%"
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {donutSegments.map((entry, i) => (
                    <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                {en ? 'Total' : 'Byose'}
              </span>
              <span className="text-2xl font-black text-gray-900 tabular-nums">
                {totalCases.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="mt-auto pt-6 grid grid-cols-2 gap-2">
            {donutSegments.slice(0, 4).map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 p-2 rounded-xl border border-gray-50 bg-gray-50/50"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-900 truncate leading-none mb-1">{d.value}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase truncate leading-none">{d.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,68%)_minmax(0,32%)]">
        <section className={cardClass}>
           <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gray-100 text-gray-600 rounded-lg">
                 <ActivityIcon size={16} />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                {en ? 'Real-time Pipeline' : 'Imiterere'}
              </h2>
           </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STATUS_ORDER.map((st) => {
              const n = byStatus[st] ?? 0;
              return (
                <div
                  key={st}
                  className="rounded-xl border border-gray-50 bg-gray-50/50 p-3 transition-hover hover:border-teal-100 hover:bg-white"
                >
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {statusLabel(st)}
                  </p>
                  <p className="text-xl font-black tabular-nums text-gray-900">
                    {n.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
             <div className="flex min-w-0 items-center gap-2">
                <div className="shrink-0 rounded-lg bg-teal-50 p-1.5 text-teal-600">
                   <CheckCircle2Icon size={16} />
                </div>
                <h2 className="truncate text-sm font-semibold tracking-tight text-gray-900">
                  {en ? 'Recent logs' : 'Ibyabaye vuba'}
                </h2>
             </div>
             <button
               type="button"
               onClick={() => navigate('/chw/cases')}
               className="shrink-0 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
             >
               {en ? 'View all' : 'Byose'}
             </button>
          </div>
          <ul className="space-y-0.5">
            {latestVisits.length === 0 ? (
              <li className="py-8 text-center text-sm text-gray-500">
                {en ? 'No logs recorded' : 'Nta bikuru.'}
              </li>
            ) : (
              latestVisits.map((c, idx) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chw/cases/${c.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor: AVATAR_BG[idx % AVATAR_BG.length],
                        color: 'rgba(0,0,0,0.45)'
                      }}
                    >
                      {initials(c.patientName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {c.patientName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span className="font-mono tabular-nums text-gray-400">
                          #{c.id.slice(-4).toUpperCase()}
                        </span>
                        <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                        <span className="truncate text-gray-600">{statusLabel(c.status)}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                       <p className="text-xs font-medium tabular-nums text-gray-900">
                        {visitTimeOnly(c.updatedAt)}
                      </p>
                      <p className="text-[11px] font-normal text-gray-400">
                        {isToday(c.updatedAt) ? (en ? 'Today' : 'Uyu munsi') : (en ? 'Past' : 'Byabaye kera')}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
