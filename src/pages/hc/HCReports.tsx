import { useMemo, useState, useCallback } from 'react';
import {
  BarChart3Icon,
  FileTextIcon,
  PrinterIcon,
  DownloadIcon,
  UsersIcon,
  ActivityIcon,
  HeartPulseIcon,
  SkullIcon,
  Building2Icon,
  ArrowUpRightIcon,
  ShieldCheckIcon,
  BabyIcon,
} from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCasesApi } from '../../context/CasesContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { hcPage } from '../../theme/appShell';
import type { CaseStatus, MalariaCase } from '../../types/domain';

const STATUS_ORDER: CaseStatus[] = [
  'Pending',
  'Referred',
  'HC Received',
  'Escalated',
  'Admitted',
  'Discharged',
  'Deceased',
  'Resolved',
];

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

function filterByCreatedSince(
  cases: MalariaCase[],
  start: Date | null
): MalariaCase[] {
  if (!start) return cases;
  return cases.filter((c) => new Date(c.createdAt) >= start);
}

function countByStatus(cases: MalariaCase[]): Record<CaseStatus, number> {
  const init = {} as Record<CaseStatus, number>;
  for (const s of STATUS_ORDER) init[s] = 0;
  for (const c of cases) {
    if (c.status === 'Treated') {
      init.Discharged += 1;
    } else if (STATUS_ORDER.includes(c.status as CaseStatus)) {
      init[c.status as CaseStatus] += 1;
    }
  }
  return init;
}

function symptomFrequency(cases: MalariaCase[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of cases) {
    const combined = [
      ...(c.symptoms ?? []),
      ...(c.chwSymptoms ?? []),
    ];
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
    .slice(0, 20);
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;
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

const PIE_COLORS = ['#3a6ea5', '#5b8fc7', '#94a3b8', '#0ea5e9', '#64748b'];

export function HCReports() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { user } = useAuth();
  const isLocalClinic = user?.role === 'Local Clinic';
  const { cases, stats, loading } = useCasesApi();
  const en = language === 'en';
  const [preset, setPreset] = useState<DatePreset>('90d');

  const start = useMemo(() => startDateForPreset(preset), [preset]);
  const scoped = useMemo(() => filterByCreatedSince(cases, start), [cases, start]);

  const aggregates = useMemo(() => {
    const byStatus = countByStatus(scoped);
    const uniquePatients = new Set(scoped.map((c) => c.patientCode)).size;
    const male = scoped.filter((c) => c.sex === 'Male').length;
    const female = scoped.filter((c) => c.sex === 'Female').length;
    const u5 = scoped.filter((c) => c.ageGroup === 'Under 5').length;
    const fivePlus = scoped.filter((c) => c.ageGroup === '5 and above').length;
    const withInsurance = scoped.filter((c) => c.hasInsurance).length;
    const eidsr = scoped.filter((c) => c.reportedToEIDSR).length;
    const chwRdtPos = scoped.filter((c) => c.chwRapidTestResult === 'Positive').length;
    const chwRdtNeg = scoped.filter((c) => c.chwRapidTestResult === 'Negative').length;
    const hcSeverePos = scoped.filter((c) => c.severeMalariaTestResult === 'Positive').length;
    const hcSevereNeg = scoped.filter((c) => c.severeMalariaTestResult === 'Negative').length;
    const highSymptoms = scoped.filter((c) => (c.symptomCount ?? 0) >= 3).length;
    const transferredToHosp = scoped.filter(
      (c) => c.hcPatientTransferredToHospitalDateTime
    ).length;
    const symptomsTop = symptomFrequency(scoped);

    const statusChart = STATUS_ORDER.filter((s) => byStatus[s] > 0).map((s) => ({
      name: s,
      count: byStatus[s],
    }));

    const sexPie = [
      { name: en ? 'Male' : 'Gabo', value: male },
      { name: en ? 'Female' : 'Gore', value: female },
    ].filter((x) => x.value > 0);

    const agePie = [
      { name: en ? 'Under 5' : 'Imyaka 5', value: u5 },
      { name: en ? '5 and above' : '5 n’inyuma', value: fivePlus },
    ].filter((x) => x.value > 0);

    return {
      byStatus,
      uniquePatients,
      male,
      female,
      u5,
      fivePlus,
      withInsurance,
      eidsr,
      chwRdtPos,
      chwRdtNeg,
      hcSeverePos,
      hcSevereNeg,
      highSymptoms,
      transferredToHosp,
      symptomsTop,
      statusChart,
      sexPie,
      agePie,
    };
  }, [scoped, en]);

  const periodLabel = useMemo(() => {
    if (preset === 'all') return en ? 'All time' : 'Igihe cyose';
    const map: Record<DatePreset, string> = {
      all: '',
      '7d': en ? 'Last 7 days' : 'Iminsi 7',
      '30d': en ? 'Last 30 days' : 'Iminsi 30',
      '90d': en ? 'Last 90 days' : 'Iminsi 90',
      '365d': en ? 'Last 12 months' : 'Amezi 12',
    };
    return map[preset];
  }, [preset, en]);

  const handlePrintPdf = useCallback(() => {
    const prev = document.title;
    const stamp = new Date().toISOString().slice(0, 10);
    document.title = `${isLocalClinic ? 'LC' : 'HC'}_Report_${user?.district ?? 'district'}_${stamp}`;
    window.print();
    document.title = prev;
  }, [user?.district, isLocalClinic]);

  const handleExportRegister = useCallback(() => {
    const rows = scoped.map((c) => ({
      caseRef: c.id,
      patientName: c.patientName,
      patientCode: c.patientCode,
      sex: c.sex,
      age: c.age,
      ageGroup: c.ageGroup,
      district: c.district,
      sector: c.sector,
      village: c.village,
      status: c.status === 'Treated' ? 'Discharged' : c.status,
      symptomCount: c.symptomCount,
      symptoms: (c.symptoms ?? []).join('; '),
      chwSymptoms: (c.chwSymptoms ?? []).join('; '),
      chwRdt: c.chwRapidTestResult ?? '',
      severeTestHc: c.severeMalariaTestResult ?? '',
      insurance: c.hasInsurance ? 'Yes' : 'No',
      eidsr: c.reportedToEIDSR ? 'Yes' : 'No',
      hcReceived: c.hcPatientReceivedDateTime ?? '',
      referredHospital: c.hcPatientTransferredToHospitalDateTime ?? '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    downloadCsv(
      rows,
      `${isLocalClinic ? 'lc' : 'hc'}_case_register_${user?.district ?? 'export'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  }, [scoped, user?.district, isLocalClinic]);

  const summaryTiles = useMemo(() => {
    const { byStatus } = aggregates;
    return [
      {
        label: en ? 'Total cases (period)' : 'Imanza (igihe)',
        value: scoped.length,
        icon: BarChart3Icon,
        hint: en ? 'Registrations in selected period' : 'Iyandikwa mu gihe',
      },
      {
        label: en ? 'Unique patients' : 'Abarwayi batandukanye',
        value: aggregates.uniquePatients,
        icon: UsersIcon,
        hint: en ? 'By patient code' : 'Ukoresheje kode',
      },
      {
        label: en ? 'Pending / referred' : 'Bategereje / Koherejwe',
        value: byStatus.Pending + byStatus.Referred,
        icon: ActivityIcon,
        hint: en ? 'Not yet completed at HC' : '',
      },
      {
        label: en ? 'At health center' : 'Ku kigo',
        value: byStatus['HC Received'],
        icon: HeartPulseIcon,
        hint: '',
      },
      {
        label: en ? 'Escalated (distressed pathway)' : 'Byiyongereye (kohereza)',
        value: byStatus.Escalated,
        icon: ArrowUpRightIcon,
        hint: en ? 'Referred toward district hospital' : '',
      },
      {
        label: en ? 'Admitted' : 'Kwakirwa',
        value: byStatus.Admitted,
        icon: Building2Icon,
        hint: '',
      },
      {
        label: en ? 'Discharged' : 'Gusohoka',
        value: byStatus.Discharged,
        icon: ShieldCheckIcon,
        hint: '',
      },
      {
        label: en ? 'Deceased' : 'Impfi',
        value: byStatus.Deceased,
        icon: SkullIcon,
        hint: '',
      },
      {
        label: en ? 'Resolved' : 'Byarangiye',
        value: byStatus.Resolved,
        icon: FileTextIcon,
        hint: en ? 'Closed cases (incl. CHW-only where visible)' : '',
      },
      {
        label: en ? '3+ symptoms (notification)' : 'Ibimenyetso 3+',
        value: aggregates.highSymptoms,
        icon: ActivityIcon,
        hint: en ? 'Severe symptom count at intake' : '',
      },
      {
        label: en ? 'Referred to district hospital' : 'Byoherejwe ku bitaro',
        value: aggregates.transferredToHosp,
        icon: ArrowUpRightIcon,
        hint: en ? 'Transfer time recorded' : '',
      },
      {
        label: en ? 'Reported to EIDSR' : 'Byatangajwe EIDSR',
        value: aggregates.eidsr,
        icon: ShieldCheckIcon,
        hint: '',
      },
    ];
  }, [aggregates, scoped.length, en]);

  return (
    <div className={`${hcPage.wrap} print:space-y-4`}>
      <style media="print">{`
        [data-app-role="hc"] aside,
        [data-app-role="lc"] aside,
        [data-app-role="hc"] header,
        [data-app-role="lc"] header { display: none !important; }
        [data-app-role="hc"] > div:last-child,
        [data-app-role="lc"] > div:last-child { padding-left: 0 !important; }
        [data-app-role="hc"] main,
        [data-app-role="lc"] main { padding: 16px !important; }
        .no-print { display: none !important; }
        @page { margin: 12mm; size: A4 portrait; }
      `}</style>

      <div className={`${hcPage.headerRow} no-print`}>
        <div>
          <h1 className={hcPage.title}>
            {isLocalClinic
              ? en
                ? 'Health Post reports'
                : 'Raporo z’Ivuriro Riciriritse'
              : en
                ? 'Health center reports'
                : 'Raporo z’ikigo nderabuzima'}
          </h1>
          <p className={hcPage.desc}>
            {en
              ? `District scope: ${user?.district ?? '—'} · ${periodLabel} · based on case registration date`
              : `Akarere: ${user?.district ?? '—'} · ${periodLabel}`}
          </p>
          {stats && (
            <p className="mt-1 text-xs text-gray-400">
              {en ? 'API total (all time)' : 'Umubare wose'}:{' '}
              <span className="font-semibold text-gray-600">{stats.totalCases}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as DatePreset)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm"
          >
            <option value="7d">{en ? 'Last 7 days' : 'Iminsi 7'}</option>
            <option value="30d">{en ? 'Last 30 days' : 'Iminsi 30'}</option>
            <option value="90d">{en ? 'Last 90 days' : 'Iminsi 90'}</option>
            <option value="365d">{en ? 'Last 12 months' : 'Umwaka'}</option>
            <option value="all">{en ? 'All time' : 'Igihe cyose'}</option>
          </select>
          <button
            type="button"
            onClick={handleExportRegister}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <DownloadIcon size={16} />
            {en ? 'CSV register' : 'Kuramo CSV'}
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <PrinterIcon size={16} />
            {en ? 'Save as PDF (print)' : 'Bika PDF (print)'}
          </button>
        </div>
      </div>

      {/* Print header — visible only in print */}
      <div className="hidden print:block print:mb-4 print:border-b print:border-gray-300 print:pb-3">
        <p className="text-lg font-bold text-gray-900">
          {en ? 'Health Center — Activity report' : 'Ikigo nderabuzima — Raporo'}
        </p>
        <p className="text-sm text-gray-600">
          {user?.district} · {periodLabel} ·{' '}
          {new Date().toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">
          {en
            ? 'Generated from live district cases. Use browser Print → Save as PDF.'
            : 'Byakorewe ku makuru y’akarere.'}
        </p>
      </div>

      {loading ? (
        <p className="text-sm font-medium text-gray-400">
          {en ? 'Loading…' : 'Birakurura…'}
        </p>
      ) : (
        <>
          <section id="hc-report-print" className="space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                {en ? 'Summary' : 'Incamake'}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {summaryTiles.map((t) => (
                  <div
                    key={t.label}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    title={t.hint}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {t.label}
                      </p>
                      <t.icon
                        size={18}
                        className="shrink-0 text-[color:var(--role-accent)] opacity-80"
                      />
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-gray-900">
                  {en ? 'Cases by status' : 'Imanza ku miterere'}
                </h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aggregates.statusChart} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={70} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3a6ea5" radius={[4, 4, 0, 0]} name={en ? 'Cases' : 'Imanza'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-gray-900">
                  {en ? 'Sex distribution' : 'Igitsina'}
                </h3>
                <div className="flex h-[280px] items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregates.sexPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={88}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <BabyIcon size={18} className="text-[color:var(--role-accent)]" />
                  {en ? 'Age groups' : 'Imyaka'}
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregates.agePie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {aggregates.agePie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-gray-900">
                  {en ? 'Insurance & EIDSR' : 'Ubwishingizi na EIDSR'}
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">{en ? 'With insurance' : 'Afite ubwishingizi'}</span>
                    <span className="font-bold tabular-nums text-gray-900">
                      {aggregates.withInsurance} / {scoped.length}
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">{en ? 'Reported to EIDSR' : 'Byatangajwe EIDSR'}</span>
                    <span className="font-bold tabular-nums text-gray-900">{aggregates.eidsr}</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">{en ? 'CHW rapid test + ' : 'Ikizamini CHW +'}</span>
                    <span className="font-bold tabular-nums text-emerald-700">{aggregates.chwRdtPos}</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">{en ? 'CHW rapid test − ' : 'Ikizamini CHW −'}</span>
                    <span className="font-bold tabular-nums text-slate-600">{aggregates.chwRdtNeg}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">
                      {en ? 'HC severe malaria test +/−' : 'Ikizamini cy’ikarire HC'}
                    </span>
                    <span className="font-bold tabular-nums text-gray-900">
                      +{aggregates.hcSeverePos} / −{aggregates.hcSevereNeg}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                {en ? 'Top recorded symptoms' : 'Ibimenyetso byanditswe cyane'}
              </h3>
              {aggregates.symptomsTop.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {en ? 'No symptom strings in this period.' : 'Nta bimenyetso muri iki gihe.'}
                </p>
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={aggregates.symptomsTop.slice(0, 12)}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-100" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name={en ? 'Cases' : 'Imanza'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-gray-500" />
                  <h2 className="font-bold text-gray-900">
                    {en ? 'Case register (detail)' : 'Urutonde rw’imanza'}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {en
                    ? 'Recent cases first. Full export available as CSV.'
                    : 'Dosiye zishya mbere.'}
                </p>
              </div>
              <div className="overflow-x-auto p-4 max-h-[480px] overflow-y-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                      <th className="pb-2 pr-3">{en ? 'Patient' : 'Umurwayi'}</th>
                      <th className="pb-2 pr-3">{en ? 'Age / sex' : 'Imyaka'}</th>
                      <th className="pb-2 pr-3">{en ? 'Location' : 'Aho abarizwa'}</th>
                      <th className="pb-2 pr-3">{en ? 'Status' : 'Imiterere'}</th>
                      <th className="pb-2 pr-3">{en ? 'Symptoms' : 'Ibimenyetso'}</th>
                      <th className="pb-2">{en ? 'Updated' : 'Byavuguruwe'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...scoped]
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt).getTime() -
                          new Date(a.updatedAt).getTime()
                      )
                      .slice(0, 80)
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/80">
                          <td className="py-2.5 pr-3">
                            <p className="font-semibold text-gray-900">{c.patientName}</p>
                            <p className="font-mono text-[10px] text-gray-400">{c.id}</p>
                          </td>
                          <td className="py-2.5 pr-3 text-gray-600">
                            {c.age} · {c.sex[0]}
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-gray-600">
                            {c.village}, {c.sector}
                          </td>
                          <td className="py-2.5 pr-3">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-gray-600 max-w-[200px] truncate" title={[...(c.symptoms ?? []), ...(c.chwSymptoms ?? [])].join(', ')}>
                            {(c.symptomCount ?? 0) > 0
                              ? `${c.symptomCount}: ${(c.symptoms ?? []).slice(0, 2).join(', ')}`
                              : '—'}
                          </td>
                          <td className="py-2.5 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(c.updatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <p className="no-print text-center text-[11px] text-gray-400">
            {en
              ? 'Tip: “Save as PDF” opens print — choose “Save as PDF” as the printer.'
              : 'Kanda Print uhitemo Save as PDF.'}
          </p>
        </>
      )}
    </div>
  );
}
