import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileTextIcon,
  ActivityIcon,
  UserRoundIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  RadioIcon,
  ClockIcon,
  CheckCircle2Icon,
  SkullIcon,
  FilterIcon,
  ArrowRightIcon,
  ZapIcon,
  XIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { RwandaCaseMap } from '../../components/shared/RwandaCaseMap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import type { MalariaCase } from '../../types/domain';
import {
  useSurveillanceBasePath,
  useSurveillanceI18nNs,
  useSurveillanceProvinceScope,
} from './useSurveillanceBasePath';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const cardClass = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm';

type PipelineStep = {
  key: string;
  label: string;
  color: string;
  filter: (c: MalariaCase) => boolean;
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    key: 'CHW',
    label: 'CHW Reported',
    color: '#0d9488',
    filter: (c) => ['Pending', 'Referred'].includes(c.status),
  },
  {
    key: 'HC',
    label: 'Health Center',
    color: '#3a6ea5',
    filter: (c) => c.status === 'HC Received',
  },
  {
    key: 'DH',
    label: 'District Hospital',
    color: '#007ea7',
    filter: (c) =>
      ['Escalated', 'Admitted', 'Treated', 'Discharged'].includes(c.status) &&
      !c.dhTransferredToReferralHospitalDateTime,
  },
  {
    key: 'RH',
    label: 'Referral Hospital',
    color: '#003554',
    filter: (c) =>
      Boolean(c.dhTransferredToReferralHospitalDateTime) ||
      Boolean(c.referralHospitalReceivedDateTime),
  },
  {
    key: 'Outcome',
    label: 'Outcome',
    color: '#10b981',
    filter: (c) =>
      ['Discharged', 'Resolved', 'Deceased'].includes(c.status),
  },
];

const OUTCOME_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function RichDashboard() {
  const navigate = useNavigate();
  const base = useSurveillanceBasePath();
  const ns = useSurveillanceI18nNs();
  const provinceScope = useSurveillanceProvinceScope();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { user, notifications } = useAuth();
  const { cases, loading, error, refresh } = useCasesApi();
  const en = language === 'en';

  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const allLabel = en ? 'All' : 'Byose';
  const statusOptions = [
    { value: 'All', label: allLabel },
    { value: 'Pending', label: en ? 'Pending' : 'Bitegereje' },
    { value: 'Referred', label: en ? 'Referred' : 'Byoherejwe' },
    { value: 'HC Received', label: en ? 'HC Received' : 'Byakiriwe ku kigo' },
    { value: 'Escalated', label: en ? 'Escalated' : 'Byoherejwe hejuru' },
    { value: 'Admitted', label: en ? 'Admitted' : 'Bari mu bitaro' },
    { value: 'Discharged', label: en ? 'Discharged' : 'Barekuwe' },
    { value: 'Resolved', label: en ? 'Resolved' : 'Byakize' },
    { value: 'Deceased', label: en ? 'Deceased' : 'Bapfuye' },
  ];
  const pipelineLabel = (key: string) =>
    en
      ? ({ CHW: 'CHW Reported', HC: 'Health Center', DH: 'District Hospital', RH: 'Referral Hospital', Outcome: 'Outcome' }[key] ?? key)
      : ({ CHW: 'Byatangajwe na CHW', HC: 'Ikigo nderabuzima', DH: "Ibitaro by'akarere", RH: 'Ibitaro byo kohereza', Outcome: 'Ibyavuyemo' }[key] ?? key);

  const allDistricts = useMemo(() => ['All', ...Array.from(new Set(cases.map((c) => c.district)))], [cases]);

  const filtered = useMemo(() => {
    let result = cases;
    if (filterDistrict !== 'All') result = result.filter((c) => c.district === filterDistrict);
    if (filterStatus !== 'All') {
      result = result.filter((c) =>
        filterStatus === 'Discharged' ?
          c.status === 'Discharged' || c.status === 'Treated'
        : c.status === filterStatus
      );
    }
    return result;
  }, [cases, filterDistrict, filterStatus]);

  const totalCases = filtered.length;
  const positive = filtered.filter((c) => c.severeMalariaTestResult === 'Positive').length;
  const activeCases = filtered.filter((c) => ['Pending', 'Referred', 'HC Received', 'Escalated', 'Admitted'].includes(c.status)).length;
  const deaths = filtered.filter((c) => c.status === 'Deceased').length;
  const recovered = filtered.filter((c) => ['Resolved', 'Discharged', 'Treated'].includes(c.status)).length;

  const allTotals = {
    total: cases.length,
    positive: cases.filter((c) => c.severeMalariaTestResult === 'Positive').length,
    active: cases.filter((c) => ['Pending', 'Referred', 'HC Received', 'Escalated', 'Admitted'].includes(c.status)).length,
    deaths: cases.filter((c) => c.status === 'Deceased').length,
  };

  const feedNotifs = [...notifications]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 12);
  const outcomeBars = useMemo(
    () => [
      {
        name: en ? 'Went home' : 'Basubiye mu rugo',
        count: filtered.filter((c) => ['Discharged', 'Treated'].includes(c.status)).length,
      },
      {
        name: en ? 'Still admitted' : 'Bakiri kwitabwaho',
        count: filtered.filter((c) => c.status === 'Admitted').length,
      },
      {
        name: en ? 'Referred further' : 'Bongeye koherezwa',
        count: filtered.filter((c) => Boolean(c.dhTransferredToReferralHospitalDateTime)).length,
      },
      {
        name: en ? 'Deaths' : 'Impfu',
        count: filtered.filter((c) => c.status === 'Deceased').length,
      },
    ],
    [filtered, en]
  );

  const donutData = [
    { name: en ? 'Recovered' : 'Bakize', value: recovered },
    { name: en ? 'Active' : 'Bikomeje', value: activeCases },
    { name: en ? 'Positive' : 'Byagize', value: positive },
    { name: en ? 'Deaths' : 'Bapfuye', value: deaths },
  ].filter((d) => d.value > 0);

  const greet = user?.name?.split(/\s+/)[0] ?? '';
  const isFiltered = filterDistrict !== 'All' || filterStatus !== 'All';

  const kpis = [
    {
      label: en ? 'Total Cases' : 'Ibibazo Byose',
      value: totalCases,
      sub: en ? `vs ${allTotals.total} total` : `kuri ${allTotals.total} byose`,
      icon: FileTextIcon,
      bg: 'from-[#2563eb] to-[#1d4ed8]',
      light: 'bg-[#2563eb]/10 text-[#2563eb]',
    },
    {
      label: en ? 'SM Positive' : 'Byagize Ivuriro',
      value: positive,
      sub: totalCases > 0 ? `${Math.round((positive / totalCases) * 100)}% ${en ? 'rate' : 'igipimo'}` : '—',
      icon: AlertCircleIcon,
      bg: 'from-red-500 to-rose-700',
      light: 'bg-red-50 text-red-700',
    },
    {
      label: en ? 'Active Cases' : 'Bikomeje',
      value: activeCases,
      sub: en ? 'In pipeline' : 'Biracyakomeje',
      icon: ActivityIcon,
      bg: 'from-[#2563eb] to-[#1d4ed8]',
      light: 'bg-[#2563eb]/10 text-[#2563eb]',
    },
    {
      label: en ? 'Recovered / went home' : 'Bakize / basubiye mu rugo',
      value: recovered,
      sub: totalCases > 0 ? `${Math.round((recovered / totalCases) * 100)}% ${en ? 'rate' : 'igipimo'}` : '—',
      icon: CheckCircle2Icon,
      bg: 'from-[#2563eb] to-[#1d4ed8]',
      light: 'bg-[#2563eb]/10 text-[#2563eb]',
    },
    {
      label: en ? 'Deaths' : 'Bapfuye',
      value: deaths,
      sub: totalCases > 0 ? `${Math.round((deaths / totalCases) * 100)}% CFR` : '—',
      icon: SkullIcon,
      bg: 'from-gray-600 to-gray-800',
      light: 'bg-gray-100 text-gray-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827]">
              {greet
                ? en
                  ? `Hello, ${greet} 👋`
                  : `Muraho, ${greet}`
                : en
                  ? ns === 'pfth'
                    ? 'PFTH — Northern Province surveillance'
                    : ns === 'sfr'
                      ? 'SFR — Kigali City surveillance'
                      : 'RICH Intelligence'
                  : ns === 'pfth'
                    ? 'PFTH — Amajyaruguru'
                    : ns === 'sfr'
                      ? 'SFR — Kigali'
                      : 'Incamake ya RICH'}
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-[#2563eb]/20 bg-[#2563eb]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#2563eb]">
              <RadioIcon size={10} className="animate-pulse" />
              {en ? 'Live' : 'Birakora'}
            </span>
          </div>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {en
              ? ns === 'pfth'
                ? 'Pro-Femmes Twese Hamwe (PFTH) — severe malaria risk assessment'
                : ns === 'sfr'
                  ? 'Strive Foundation Rwanda (SFR) — severe malaria risk assessment'
                  : 'National malaria surveillance — Rwanda (Southern / East / West)'
              : 'Isuzuma ry’ingaruka z’imalariya ikomeye'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={() => { setFilterDistrict('All'); setFilterStatus('All'); }}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition-colors"
            >
              <XIcon size={12} />{en ? 'Clear Filters' : 'Tangisha ngo nta ngufu'}
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-colors ${showFilters ? 'border-[#2563eb]/25 bg-[#2563eb]/10 text-[#2563eb]' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <FilterIcon size={14} />{en ? 'Filters' : 'Gushungura'}
          </button>
          {loading && (
            <div className="flex items-center gap-2 rounded-xl bg-[#2563eb]/10 px-3 py-2 text-xs font-bold text-[#2563eb]">
              <RefreshCwIcon size={14} className="animate-spin" />
              {en ? 'Syncing…' : 'Vugurura…'}
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`${cardClass} flex flex-wrap items-center gap-4`}>
              <div className="flex items-center gap-2">
                <FilterIcon size={14} className="text-[#2563eb]" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">{en ? 'Filter by:' : 'Gushungura:'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-gray-400">{en ? 'District' : 'Akarere'}</label>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/25"
                >
                  {allDistricts.map((d) => <option key={d} value={d}>{d === 'All' ? allLabel : d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-gray-400">{en ? 'Status' : 'Imimerere'}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/25"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {isFiltered && (
                <div className="rounded-xl border border-[#2563eb]/20 bg-[#2563eb]/10 px-3 py-1.5 text-xs font-black text-[#2563eb]">
                  {filtered.length} {en ? 'filtered cases' : 'ibibazo bishungutse'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2 font-bold"><AlertCircleIcon size={18} className="shrink-0" />{error}</span>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 transition-all active:scale-95">
            <RefreshCwIcon size={14} />{en ? 'Retry' : 'Ongera'}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative overflow-hidden rounded-2xl shadow-sm"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${k.bg} opacity-[0.06]`} />
            <div className="relative border border-gray-100 bg-white rounded-2xl p-5">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${k.light}`}>
                <k.icon size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">{k.label}</p>
              <p className="mt-1 text-3xl font-black text-[#111827] tabular-nums">{k.value.toLocaleString()}</p>
              <p className="mt-1 text-[10px] font-bold text-[#9CA3AF]">{k.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map + Activity Feed */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,68%)_minmax(0,32%)]">
        {/* Map section */}
        <section className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#2563eb]/10 p-1.5">
                <FileTextIcon size={16} className="text-[#2563eb]" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
                {en ? 'Case distribution' : 'Ikwirakwira ry’ibibazo'}
              </h2>
            </div>
            <button onClick={() => navigate(`${base}/map`)} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[#2563eb] hover:underline">
              {en ? 'Full Map' : 'Ikarita Yose'} <ArrowRightIcon size={13} />
            </button>
          </div>
          <RwandaCaseMap
            cases={filtered}
            accent="rich"
            provinceScope={provinceScope}
            title=""
            subtitle={
              en
                ? ns === 'pfth'
                  ? 'PFTH (Northern Province)'
                  : ns === 'sfr'
                    ? 'SFR (Kigali City)'
                    : 'RICH Surveillance'
                : 'Gukurikirana'
            }
          />
        </section>

        {/* Live Activity Feed */}
        <section className={`${cardClass} flex flex-col`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-[#2563eb]/10 p-1.5">
              <RadioIcon size={16} className="text-[#2563eb]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Live Activity Feed' : 'Amakuru Mashya'}
            </h2>
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#2563eb] text-[9px] font-black text-white">
              {feedNotifs.length}
            </span>
            <button
              type="button"
              onClick={() => navigate(`${base}/notifications`)}
              className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#2563eb] hover:underline"
            >
              {en ? 'View all' : 'Reba byose'}
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {feedNotifs.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-gray-400 uppercase">
                {en ? 'No recent activity' : 'Nta makuru mashya'}
              </div>
            ) : (
              feedNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-xl border border-gray-50 bg-gray-50/60 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/15 text-[#2563eb]">
                    <ZapIcon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{n.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-600 border border-slate-200">
                        {n.targetRole}
                      </span>
                      {n.phase && (
                        <span className="rounded-full border border-[#2563eb]/20 bg-[#2563eb]/10 px-1.5 py-0.5 text-[9px] font-black text-[#2563eb]">
                          Phase {n.phase}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 flex items-center gap-1">
                        <ClockIcon size={9} />
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Case Pipeline Timeline */}
      <section className={cardClass}>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-lg bg-[#2563eb]/10 p-1.5">
            <ActivityIcon size={16} className="text-[#2563eb]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
            {en
              ? 'Case Pipeline — CHW → HC → District → Referral → Outcome'
              : 'Inzira y\'Ibibazo'}
          </h2>
        </div>
        <div className="flex flex-wrap gap-0">
          {PIPELINE_STEPS.map((step, i) => {
            const count = filtered.filter((c) => step.filter(c)).length;
            const total = filtered.length || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={step.key} className="flex flex-1 items-center min-w-[140px]">
                <div className="flex-1">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{pipelineLabel(step.key)}</div>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">{count}</span>
                    <span className={`mb-0.5 rounded-full px-2 py-0.5 text-[10px] font-black`} style={{ backgroundColor: step.color + '20', color: step.color }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: step.color }}
                    />
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="mx-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                    <ArrowRightIcon size={14} className="text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,60%)_minmax(0,40%)]">
        {/* Case results */}
        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#2563eb]/10 p-1.5">
              <UserRoundIcon size={16} className="text-[#2563eb]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Case Results' : 'Ibyavuye mu manza'}
            </h2>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeBars} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Outcome donut */}
        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#2563eb]/10 p-1.5">
              <CheckCircle2Icon size={16} className="text-[#2563eb]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Case Outcomes' : 'Incamake z\'Ibibazo'}
            </h2>
          </div>
          {donutData.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-gray-400 uppercase">{en ? 'No data' : 'Nta makuru'}</div>
          ) : (
            <>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={4} dataKey="value" stroke="none">
                      {donutData.map((_, i) => <Cell key={i} fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: OUTCOME_COLORS[i % OUTCOME_COLORS.length] }} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-900">{d.value}</p>
                      <p className="text-[9px] font-bold text-gray-400 truncate uppercase">{d.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Full clinical cases table */}
      <section className={cardClass}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#2563eb]/10 p-1.5">
              <FileTextIcon size={16} className="text-[#2563eb]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Full Clinical Detail' : 'Amakuru Yuzuye'}
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-600">
              {filtered.length} {en ? 'records' : 'ibibazo'}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[en ? 'Code' : 'Kode', en ? 'Patient' : 'Umurwayi', en ? 'District' : 'Akarere', en ? 'Symptoms' : 'Ibimenyetso', en ? 'SM Result' : 'Ibisubizo bya SM', en ? 'Status' : 'Imimerere', en ? 'Updated time' : 'Igihe cyahinduwe'].map((h) => (
                  <th key={h} className="text-left pb-3 pr-4 text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...filtered]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 15)
                .map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 pr-4 font-mono text-[10px] text-gray-400">{c.patientCode}</td>
                  <td className="py-2.5 pr-4">
                    <p className="text-xs font-bold text-gray-900">{c.patientName}</p>
                    <p className="text-[10px] text-gray-400">{c.age}{en ? 'y' : ''} / {c.sex[0]}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-gray-600">{c.district}</td>
                  <td className="py-2.5 pr-4 text-xs text-gray-600">{c.symptoms.length} {en ? 'listed' : 'byanditswe'}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${c.severeMalariaTestResult === 'Positive' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.severeMalariaTestResult || '—'}
                    </span>
                  </td>
                  <td className="py-2.5"><StatusBadge status={c.status} /></td>
                  <td className="py-2.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
