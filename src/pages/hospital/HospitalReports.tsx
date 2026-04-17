import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  DownloadIcon,
  SearchIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  PrinterIcon,
  BarChart3Icon,
  UsersIcon,
  ActivityIcon,
  SkullIcon,
  ArrowUpRightIcon,
} from 'lucide-react';
import { toast } from 'sonner';
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
  Legend,
} from 'recharts';
import { DISTRICTS } from '../../data/mockData';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import type { CaseStatus, MalariaCase } from '../../types/domain';

const DH_STATUSES: CaseStatus[] = [
  'Escalated',
  'Admitted',
  'Discharged',
  'Deceased',
];

const PIE_COLORS = ['#0ea5e9', '#6366f1', '#94a3b8', '#3a6ea5', '#64748b'];

type DatePreset = 'all' | '7d' | '30d' | '90d' | '365d';

function startDateForPreset(preset: DatePreset): Date | null {
  if (preset === 'all') return null;
  const d = new Date();
  const days =
    preset === '7d'
      ? 7
      : preset === '30d'
        ? 30
        : preset === '90d'
          ? 90
          : 365;
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterSince(cases: MalariaCase[], start: Date | null) {
  if (!start) return cases;
  return cases.filter((c) => new Date(c.updatedAt) >= start);
}

function symptomFrequency(cases: MalariaCase[]) {
  const map = new Map<string, number>();
  for (const c of cases) {
    const combined = [...(c.symptoms ?? []), ...(c.chwSymptoms ?? [])];
    const seen = new Set<string>();
    for (const s of combined) {
      const key = s.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function HospitalReports() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const { cases, stats, loading, error, refresh } = useCasesApi();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [preset, setPreset] = useState<DatePreset>('90d');

  const isReferral = user?.role === 'Referral Hospital';

  useEffect(() => {
    if (!isReferral && user?.district) {
      setDistrictFilter(user.district);
    }
  }, [isReferral, user?.district]);

  const start = useMemo(() => startDateForPreset(preset), [preset]);
  const scoped = useMemo(() => filterSince(cases, start), [cases, start]);

  const filtered = useMemo(() => {
    return scoped
      .filter(
        (c) =>
          !search ||
          c.patientName.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase())
      )
      .filter((c) => !districtFilter || c.district === districtFilter)
      .filter((c) => {
        if (!statusFilter) return true;
        if (statusFilter === 'Discharged') {
          return c.status === 'Discharged' || c.status === 'Treated';
        }
        return c.status === statusFilter;
      });
  }, [scoped, search, districtFilter, statusFilter]);

  const aggregates = useMemo(() => {
    const list = scoped;
    const byStatus: Partial<Record<CaseStatus, number>> = {};
    for (const s of DH_STATUSES) byStatus[s] = 0;
    for (const c of list) {
      if (c.status === 'Treated') {
        byStatus.Discharged = (byStatus.Discharged ?? 0) + 1;
      } else if (DH_STATUSES.includes(c.status as CaseStatus)) {
        byStatus[c.status as CaseStatus] = (byStatus[c.status as CaseStatus] ?? 0) + 1;
      }
    }
    const todayStr = new Date().toDateString();
    const receivedToday = list.filter((c) => {
      if (
        c.hospitalReceivedDateTime &&
        new Date(c.hospitalReceivedDateTime).toDateString() === todayStr
      )
        return true;
      if (
        c.hcPatientTransferredToHospitalDateTime &&
        new Date(c.hcPatientTransferredToHospitalDateTime).toDateString() ===
          todayStr &&
        DH_STATUSES.includes(c.status as CaseStatus)
      )
        return true;
      return false;
    }).length;

    const toReferral = list.filter(
      (c) => c.dhTransferredToReferralHospitalDateTime
    ).length;
    const male = list.filter((c) => c.sex === 'Male').length;
    const female = list.filter((c) => c.sex === 'Female').length;
    const deaths = list.filter((c) => c.status === 'Deceased').length;
    const eidsr = list.filter((c) => c.reportedToEIDSR).length;
    const statusChart = DH_STATUSES.map((s) => ({
      name: s,
      count: byStatus[s] ?? 0,
    })).filter((x) => x.count > 0);
    const sexPie = [
      { name: en ? 'Male' : 'Gabo', value: male },
      { name: en ? 'Female' : 'Gore', value: female },
    ].filter((x) => x.value > 0);
    const symptomsTop = symptomFrequency(list);

    return {
      byStatus,
      receivedToday,
      toReferral,
      male,
      female,
      deaths,
      eidsr,
      statusChart,
      sexPie,
      symptomsTop,
    };
  }, [scoped, en]);

  const handlePrint = useCallback(() => {
    const prev = document.title;
    document.title = `Hospital_Report_${user?.district ?? 'export'}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    document.title = prev;
  }, [user?.district]);

  const handleCsv = useCallback(() => {
    const rows = filtered.map((c) => ({
      caseRef: c.id,
      patientName: c.patientName,
      sex: c.sex,
      age: c.age,
      district: c.district,
      status: c.status === 'Treated' ? 'Discharged' : c.status,
      symptoms: (c.symptoms ?? []).join('; '),
      chwSymptoms: (c.chwSymptoms ?? []).join('; '),
      hcTriage: (c.hcTriageSymptoms ?? []).join('; '),
      transportToDh: c.hcReferralToHospitalTransport ?? '',
      transferFromHc: c.hcPatientTransferredToHospitalDateTime ?? '',
      hospitalIn: c.hospitalReceivedDateTime ?? '',
      referralOut: c.dhTransferredToReferralHospitalDateTime ?? '',
      outcome: c.outcome ?? c.finalOutcomeHospital ?? '',
      eidsr: c.reportedToEIDSR ? 'Yes' : 'No',
      updatedAt: c.updatedAt,
    }));
    downloadCsv(
      rows,
      `hospital_report_${user?.district ?? 'district'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success(en ? 'CSV downloaded' : 'Byasohotse');
  }, [filtered, user?.district, en]);

  const reportsTitle = isReferral
    ? en
      ? 'Referral hospital reports'
      : 'Raporo — ibitaro byo kohereza'
    : en
      ? 'District hospital reports'
      : 'Raporo — ibitaro by’akarere';

  const byStatusApi = stats?.byStatus ?? {};

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 print:space-y-4">
      <style media="print">{`
        [data-app-role="district"] aside,
        [data-app-role="district"] header,
        [data-app-role="referral"] aside,
        [data-app-role="referral"] header { display: none !important; }
        [data-app-role] > div:last-child { padding-left: 0 !important; }
        .no-print-hosp { display: none !important; }
        @page { margin: 12mm; }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold capitalize tracking-tight text-gray-900">
            {reportsTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? en
                ? 'Loading…'
                : 'Birakurura…'
              : `${scoped.length} ${en ? 'cases in period (updated activity)' : 'muri igihe'} · ${filtered.length} ${en ? 'match filters' : 'bihuye'}`}
          </p>
          {stats && (
            <p className="mt-2 text-xs text-gray-500">
              {en ? 'Total in API scope' : 'Byose'}:{' '}
              <span className="font-semibold text-gray-800">
                {stats.totalCases}
              </span>
            </p>
          )}
        </div>
        <div className="no-print-hosp flex flex-wrap gap-2">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as DatePreset)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm"
          >
            <option value="7d">{en ? 'Last 7 days' : 'Iminsi 7'}</option>
            <option value="30d">{en ? 'Last 30 days' : 'Iminsi 30'}</option>
            <option value="90d">{en ? 'Last 90 days' : 'Iminsi 90'}</option>
            <option value="365d">{en ? 'Last 12 months' : 'Umwaka'}</option>
            <option value="all">{en ? 'All time' : 'Igihe cyose'}</option>
          </select>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
            {en ? 'Refresh' : 'Vugurura'}
          </button>
          <button
            type="button"
            onClick={handleCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            <DownloadIcon size={16} /> CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            <PrinterIcon size={16} />
            {en ? 'PDF (print)' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="hidden print:block print:border-b print:pb-3">
        <p className="text-lg font-bold">{reportsTitle}</p>
        <p className="text-sm text-gray-600">
          {user?.district} · {new Date().toLocaleString()}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertCircleIcon size={18} />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold"
          >
            {en ? 'Retry' : 'Ongera'}
          </button>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: en ? 'Received today' : 'Byakirwa uyu munsi',
                value: aggregates.receivedToday,
                icon: UsersIcon,
              },
              {
                label: en ? 'Escalated' : 'Byiyongereye',
                value: aggregates.byStatus.Escalated ?? 0,
                icon: ActivityIcon,
              },
              {
                label: en ? 'Admitted' : 'Bari mu bitaro',
                value: aggregates.byStatus.Admitted ?? 0,
                icon: BarChart3Icon,
              },
              {
                label: en ? 'To referral hosp.' : 'Kohereza',
                value: isReferral ? scoped.length : aggregates.toReferral,
                icon: ArrowUpRightIcon,
              },
              {
                label: en ? 'Deaths' : 'Impfi',
                value: aggregates.deaths,
                icon: SkullIcon,
              },
              {
                label: en ? 'EIDSR reported' : 'EIDSR',
                value: aggregates.eidsr,
                icon: ActivityIcon,
              },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <k.icon size={16} className="text-[color:var(--role-accent)]" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
                  {k.value}
                </p>
              </div>
            ))}
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {DH_STATUSES.map((st) => (
                <div
                  key={st}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {st}
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                    {st === 'Discharged' ?
                      (byStatusApi['Discharged'] ?? 0) + (byStatusApi['Treated'] ?? 0)
                    : (byStatusApi[st] ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                {en ? 'Pipeline by status (period)' : 'Imiterere'}
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregates.statusChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                {en ? 'Sex (period)' : 'Igitsina'}
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aggregates.sexPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      label
                    >
                      {aggregates.sexPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-gray-900">
              {en ? 'Top symptoms (CHW + HC record)' : 'Ibimenyetso'}
            </h3>
            {aggregates.symptomsTop.length === 0 ? (
              <p className="text-sm text-gray-500">—</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={aggregates.symptomsTop.slice(0, 12)}
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3a6ea5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="no-print-hosp flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={en ? 'Search…' : 'Shakisha…'}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              disabled={!isReferral && Boolean(user?.district)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-48"
            >
              <option value="">
                {isReferral ? (en ? 'All districts' : 'Akarere byose') : (user?.district ?? '')}
              </option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:w-44"
            >
              <option value="">{en ? 'All statuses' : 'Imimerere yose'}</option>
              {DH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {(
                    en
                      ? [
                          'Case',
                          'Patient',
                          'Age',
                          'District',
                          'Transport→DH',
                          'Status',
                          'Referral out',
                          'Updated',
                        ]
                      : [
                          'ID',
                          'Umurwayi',
                          'Imyaka',
                          'Akarere',
                          'Ubwikorezi',
                          'Imiterere',
                          'Kohereza',
                          'Byavuguruwe',
                        ]
                  ).map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      {en ? 'No rows.' : 'Nta makuru.'}
                    </td>
                  </tr>
                ) : (
                  [...filtered]
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                    )
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {c.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {c.patientName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.age}</td>
                        <td className="px-4 py-3 text-gray-600">{c.district}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {c.hcReferralToHospitalTransport ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {c.dhTransferredToReferralHospitalDateTime
                            ? new Date(
                                c.dhTransferredToReferralHospitalDateTime
                              ).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          <p className="no-print-hosp text-center text-[11px] text-gray-400">
            {en
              ? 'Transport→DH: how the patient was sent from HC. Referral out: escalation to provincial hospital.'
              : ''}
          </p>
        </>
      )}
    </div>
  );
}
