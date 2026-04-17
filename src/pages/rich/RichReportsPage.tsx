import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SkullIcon, ActivityIcon, MapPinIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';
import { useSurveillancePartnerLabel } from './useSurveillanceBasePath';
import type { MalariaCase } from '../../types/domain';

function districtRows(cases: MalariaCase[]) {
  const by = new Map<
    string,
    {
      district: string;
      total: number;
      deaths: number;
      smPos: number;
      active: number;
    }
  >();
  for (const c of cases) {
    const d = c.district || '—';
    const cur =
      by.get(d) ??
      { district: d, total: 0, deaths: 0, smPos: 0, active: 0 };
    cur.total += 1;
    if (c.status === 'Deceased') cur.deaths += 1;
    if (c.severeMalariaTestResult === 'Positive') cur.smPos += 1;
    if (
      ['Pending', 'Referred', 'HC Received', 'Escalated', 'Admitted'].includes(
        c.status
      )
    ) {
      cur.active += 1;
    }
    by.set(d, cur);
  }
  return [...by.values()].sort((a, b) => b.total - a.total);
}

export function RichReportsPage() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { cases, loading, error, refresh } = useCasesApi();
  const partnerLabel = useSurveillancePartnerLabel();
  const en = language === 'en';
  const [minCases, setMinCases] = useState(0);

  const rows = useMemo(() => districtRows(cases), [cases]);
  const chartData = useMemo(() => {
    return rows
      .filter((r) => r.total >= minCases)
      .map((r) => ({
        name:
          r.district.length > 14
            ? `${r.district.slice(0, 12)}…`
            : r.district,
        full: r.district,
        cases: r.total,
        deaths: r.deaths,
        cfr: r.total > 0 ? Math.round((r.deaths / r.total) * 1000) / 10 : 0,
      }));
  }, [rows, minCases]);

  const totals = useMemo(() => {
    const deaths = cases.filter((c) => c.status === 'Deceased').length;
    const smPos = cases.filter(
      (c) => c.severeMalariaTestResult === 'Positive'
    ).length;
    return {
      n: cases.length,
      deaths,
      smPos,
      cfr: cases.length > 0 ? Math.round((deaths / cases.length) * 1000) / 10 : 0,
    };
  }, [cases]);

  const cardClass =
    'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--role-accent)]">
            {partnerLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {en ? 'Surveillance reports' : 'Raporo'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {en
              ? 'District-level volume, severe malaria positivity, active pipeline, and mortality — spot districts that need attention.'
              : 'Raporo ku karere.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border border-[color:var(--role-accent)]/25 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--role-accent)] shadow-sm hover:bg-[color:var(--role-accent)]/10"
        >
          {en ? 'Refresh data' : 'Ongera'}
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: en ? 'Total cases' : 'Byose',
            value: totals.n,
            icon: ActivityIcon,
          },
          {
            label: en ? 'Deaths (all districts)' : 'Bapfuye',
            value: totals.deaths,
            icon: SkullIcon,
          },
          {
            label: en ? 'SM test positive' : 'SM+',
            value: totals.smPos,
            icon: ActivityIcon,
          },
          {
            label: en ? 'National CFR %' : 'CFR',
            value: `${totals.cfr}%`,
            icon: SkullIcon,
          },
        ].map((k) => (
          <div key={k.label} className={cardClass}>
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <k.icon size={18} className="text-[color:var(--role-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {k.label}
              </span>
            </div>
            <p className="text-3xl font-black tabular-nums text-slate-900">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <section className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPinIcon className="text-[color:var(--role-accent)]" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-tight text-gray-900">
              {en ? 'Cases & deaths by district' : 'Ku karere'}
            </h2>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            {en ? 'Min cases to show' : 'Ntarengwa'}
            <input
              type="number"
              min={0}
              value={minCases}
              onChange={(e) =>
                setMinCases(Math.max(0, Number(e.target.value) || 0))
              }
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
            />
          </label>
        </div>
        {loading && chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {en ? 'Loading…' : 'Birakurura…'}
          </p>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.full ?? ''
                  }
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="cases" name={en ? 'Cases' : 'Ibibazo'} fill="var(--role-accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deaths" name={en ? 'Deaths' : 'Bapfuye'} fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-tight text-gray-900">
          {en ? 'District matrix' : 'Imbonerahamwe'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="pb-3 pr-4">{en ? 'District' : 'Akarere'}</th>
                <th className="pb-3 pr-4">{en ? 'Cases' : 'Ibibazo'}</th>
                <th className="pb-3 pr-4">{en ? 'Active' : 'Bikomeje'}</th>
                <th className="pb-3 pr-4">SM+</th>
                <th className="pb-3 pr-4">{en ? 'Deaths' : 'Bapfuye'}</th>
                <th className="pb-3">{en ? 'CFR %' : 'CFR'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => {
                const cfr =
                  r.total > 0
                    ? Math.round((r.deaths / r.total) * 1000) / 10
                    : 0;
                const hot = cfr >= 10 && r.total >= 3;
                return (
                  <tr
                    key={r.district}
                    className={hot ? 'bg-red-50/50' : undefined}
                  >
                    <td className="py-2.5 pr-4 font-semibold text-gray-900">
                      {r.district}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{r.total}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-[color:var(--role-accent)]">
                      {r.active}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-red-700">
                      {r.smPos}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums font-semibold text-slate-800">
                      {r.deaths}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`tabular-nums font-bold ${
                          hot ? 'text-red-700' : 'text-gray-700'
                        }`}
                      >
                        {cfr}%
                      </span>
                      {hot && (
                        <span className="ml-2 text-[10px] font-black uppercase text-red-600">
                          {en ? 'Review' : 'Reba'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          {en
            ? 'Rows shaded when CFR ≥ 10% with at least 3 cases — quick signal for hotspots (tune thresholds as needed).'
            : ''}
        </p>
      </section>
    </div>
  );
}
