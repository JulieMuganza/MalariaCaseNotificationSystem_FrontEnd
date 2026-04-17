import React, { useMemo, useState } from 'react';
import { DownloadIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DISTRICTS } from '../../data/mockData';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useCasesApi } from '../../context/CasesContext';
import { hcPage } from '../../theme/appShell';
import { useTranslation } from 'react-i18next';
import { useFirstLineBasePath } from './useFirstLineBasePath';

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function HCCaseHistory() {
  const navigate = useNavigate();
  const base = useFirstLineBasePath();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const { cases: mockCases } = useCasesApi();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');

  const filtered = useMemo(() => {
    const list = mockCases
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
      })
      .filter((c) => !ageFilter || c.ageGroup === ageFilter)
      .filter((c) => !sexFilter || c.sex === sexFilter);
    return [...list].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [
    mockCases,
    search,
    districtFilter,
    statusFilter,
    ageFilter,
    sexFilter,
  ]);

  return (
    <div className={hcPage.wrap}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={hcPage.title}>
            {en ? 'All cases' : 'Dosiye zose'}
          </h1>
          <p className={hcPage.desc}>
            {filtered.length}{' '}
            {en ? 'cases · newest activity first' : 'dosiye · izishya mbere'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.success('CSV export started')}
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <DownloadIcon size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-5 gap-3">
          <div className="relative col-span-1">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={en ? 'Search…' : 'Shakisha…'}
              className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm"
            />
          </div>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">
              {en ? 'All districts' : 'Akarere kose'}
            </option>
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">
              {en ? 'All statuses' : 'Imiterere yose'}
            </option>
            {[
              'Pending',
              'Referred',
              'HC Received',
              'Escalated',
              'Discharged',
              'Resolved',
              'Deceased',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">
              {en ? 'All ages' : 'Imyaka yose'}
            </option>
            <option value="Under 5">Under 5</option>
            <option value="5 and above">5 and above</option>
          </select>
          <select
            value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">
              {en ? 'All sex' : 'Igitsina cyose'}
            </option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {(
                  en
                    ? [
                        'ID',
                        'Patient',
                        'Age',
                        'Sex',
                        'District',
                        'Sector',
                        'CHW',
                        'Date & time',
                        'Status',
                        'EIDSR',
                      ]
                    : [
                        'ID',
                        'Umurwayi',
                        'Imyaka',
                        'Igitsina',
                        'Akarere',
                        'Umurenge',
                        'CHW',
                        'Itariki n\'isaha',
                        'Imiterere',
                        'EIDSR',
                      ]
                ).map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`${base}/case/${encodeURIComponent(c.id)}`)}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                    {c.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">
                    {c.patientName}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{c.age}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.sex[0]}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.district}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {c.sector}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {c.chwName.split(' ')[0]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-600">
                    {formatDateTime(c.updatedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {c.reportedToEIDSR ? (
                      <span className="text-xs font-medium text-success-600">
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
