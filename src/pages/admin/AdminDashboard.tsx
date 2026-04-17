import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  CalendarIcon,
  SkullIcon,
  MapPinIcon,
  GitCompareIcon,
  ActivityIcon,
  UsersIcon,
  ArrowRightIcon,
  BarChart3Icon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DISTRICTS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { useTranslation } from 'react-i18next';
import type { MalariaCase } from '../../types/domain';

const cardClass = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm';
const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function casesOverTime(cases: MalariaCase[]) {
  const map = new Map<string, { month: string; cases: number; deaths: number; sortKey: string }>();
  for (const c of cases) {
    const d = new Date(c.createdAt);
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en', { month: 'short', year: '2-digit' });
    const cur = map.get(sortKey) ?? { month: label, cases: 0, deaths: 0, sortKey };
    cur.cases += 1;
    if (c.status === 'Deceased') cur.deaths += 1;
    map.set(sortKey, cur);
  }
  return [...map.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { cases } = useCasesApi();
  const en = language === 'en';

  const totalCases = cases.length;
  const thisWeek = cases.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 86400000).length;
  const deaths = cases.filter((c) => c.status === 'Deceased').length;
  const hotspots = DISTRICTS.filter((d) => cases.filter((c) => c.district === d).length > 5).length;
  const totalEIDSR = cases.filter((c) => c.reportedToEIDSR).length;
  const gapPercent = totalCases > 0 ? Math.round(((totalCases - totalEIDSR) / totalCases) * 100) : 0;
  const activeNow = cases.filter((c) => ['Pending', 'Referred', 'HC Received', 'Escalated', 'Admitted'].includes(c.status)).length;

  const timeSeries = useMemo(() => casesOverTime(cases), [cases]);
  const monthlyCaseData = timeSeries.length > 0 ? timeSeries : [{ month: '—', cases: 0, deaths: 0 }];

  const districtData = useMemo(() =>
    DISTRICTS.map((d) => ({
      name: d.length > 8 ? d.substring(0, 8) + '.' : d,
      fullName: d,
      cases: cases.filter((c) => c.district === d).length,
    })).sort((a, b) => b.cases - a.cases), [cases]
  );

  const under5 = cases.filter((c) => c.ageGroup === 'Under 5').length;
  const above5 = cases.filter((c) => c.ageGroup === '5 and above').length;
  const ageData = [
    { name: en ? 'Under 5' : 'Munsi ya 5', value: under5 },
    { name: en ? '5 and above' : '5 no hejuru', value: above5 },
  ];
  const male = cases.filter((c) => c.sex === 'Male').length;
  const female = cases.filter((c) => c.sex === 'Female').length;
  const sexData = [
    { name: en ? 'Male' : 'Gabo', value: male },
    { name: en ? 'Female' : 'Gore', value: female },
  ];

  const kpis = [
    {
      label: en ? 'Total Cases' : 'Ibibazo Byose',
      value: totalCases,
      icon: TrendingUpIcon,
      bg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      border: 'border-teal-100',
      sub: en ? 'All time' : 'Igihe cyose',
    },
    {
      label: en ? 'New This Week' : "Ibibazo bya icyumweru",
      value: thisWeek,
      icon: CalendarIcon,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
      sub: en ? 'Last 7 days' : 'Iminsi 7',
    },
    {
      label: en ? 'Active Now' : 'Biracyakomeje',
      value: activeNow,
      icon: ActivityIcon,
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      border: 'border-violet-100',
      sub: en ? 'In pipeline' : 'Biracyakomeje',
    },
    {
      label: en ? 'Deaths Logged' : 'Bapfuye',
      value: deaths,
      icon: SkullIcon,
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      border: 'border-red-100',
      sub: totalCases > 0 ? `${Math.round((deaths / totalCases) * 100)}% CFR` : '—',
    },
    {
      label: en ? 'Hotspot Districts' : 'Akarere Gafite Ingaruka',
      value: hotspots,
      icon: MapPinIcon,
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
      sub: en ? '> 5 cases/district' : '>5 kuri akarere',
    },
    {
      label: en ? 'EIDSR Gap' : 'Ikinyuranyo cya EIDSR',
      value: `${gapPercent}%`,
      icon: GitCompareIcon,
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      border: 'border-purple-100',
      sub: en ? 'Unreported cases' : 'Bitatangajwe',
    },
  ];

  const greet = user?.name?.split(/\s+/)[0] ?? '';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-[#111827]">
          {greet ? (en ? `Hello, ${greet} 👋` : `Muraho, ${greet}`) : en ? 'Admin Dashboard' : 'Umuyobozi'}
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {en ? 'Severe Malaria Surveillance — Southern Province, Rwanda' : 'Kugenzura imalariya ikomeye — Intara y\'Amajyepfo'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`${cardClass} relative overflow-hidden`}
          >
            <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl ${k.bg} ${k.border} border`}>
              <k.icon size={18} className={k.iconColor} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] pr-10">{k.label}</p>
            <p className="mt-1.5 text-3xl font-black text-[#111827] tabular-nums">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</p>
            <p className="mt-1 text-[10px] font-bold text-[#9CA3AF]">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Time series + District bar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50">
              <TrendingUpIcon size={16} className="text-teal-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Cases Over Time' : 'Ibibazo mu Gihe'}
            </h2>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCaseData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Line type="monotone" dataKey="cases" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} name={en ? 'Cases' : 'Ibibazo'} />
                <Line type="monotone" dataKey="deaths" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} name={en ? 'Deaths' : 'Bapfuye'} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <BarChart3Icon size={16} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Cases by District' : 'Ibibazo kuri Akarere'}
            </h2>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} angle={-30} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="cases" radius={[6, 6, 0, 0]} maxBarSize={28} name={en ? 'Cases' : 'Ibibazo'}>
                  {districtData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Charts Row 2: Age + Sex */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50">
              <UsersIcon size={16} className="text-amber-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Cases by Age Group' : 'Ibibazo kuri Imyaka'}
            </h2>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ageData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {ageData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {ageData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-900">{d.value}</p>
                  <p className="text-[9px] font-bold text-gray-400 truncate uppercase">{d.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50">
              <UsersIcon size={16} className="text-purple-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Cases by Sex' : 'Ibibazo kuri Igitsina'}
            </h2>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sexData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {sexData.map((_, i) => <Cell key={i} fill={COLORS[i + 4]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {sexData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i + 4] }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-900">{d.value}</p>
                  <p className="text-[9px] font-bold text-gray-400 truncate uppercase">{d.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Objectives Table */}
      <section className={cardClass}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100">
              <GitCompareIcon size={16} className="text-slate-600" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Study Objectives & Data Summary' : 'Intego z\'Ubushakashatsi'}
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', en ? 'Objective' : 'Intego', en ? 'Source' : 'Inkomoko', en ? 'Period' : 'Igihe', en ? 'Key Variables' : 'Ibipimo'].map((h) => (
                  <th key={h} className="text-left pb-3 pr-4 text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { obj: en ? 'Map hotspots' : 'Kugaragaza ahantu hafite ingaruka', src: 'HMIS', period: 'Jul 2025 – Mar 2026', vars: 'Cases/district/sector, Gender, Age' },
                { obj: en ? 'Document risk factors' : "Kwandika impamvu z'ibyago", src: en ? 'Primary field data' : "Amakuru y'ibanze", period: 'Apr – May 2026', vars: en ? 'Full checklist' : 'Urutonde rwuzuye' },
                { obj: en ? 'Develop notification model' : "Gutegura uburyo bwo gutanga amatangazo", src: en ? 'Primary data' : "Amakuru y'ibanze", period: 'Apr – May 2026', vars: en ? 'Model comparison' : 'Gereranya uburyo' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-700">{i + 1}</div>
                  </td>
                  <td className="py-3 pr-4 text-sm font-bold text-gray-900">{row.obj}</td>
                  <td className="py-3 pr-4 text-xs font-bold text-gray-500">{row.src}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{row.period}</span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">{row.vars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}