import React, { useMemo, useState } from 'react';
import { DISTRICTS_BY_PROVINCE } from '../../data/mockData';
import type { District, Province } from '../../data/mockData';
import type { MalariaCase } from '../../types/domain';
import { useCasesApi } from '../../context/CasesContext';
import { ProvinceScopedLeafletMap } from './ProvinceScopedLeafletMap';
import type { SurveillanceLeafletScope } from './provinceLeafletConfig';

function resolveProvinceScope(
  provinceScope: Province | undefined | null,
  southernProvinceOnly: boolean
): Province | null {
  if (provinceScope != null) return provinceScope;
  if (provinceScope === null) return null;
  if (southernProvinceOnly) return 'Southern Province';
  return null;
}

type MapProps = {
  cases?: MalariaCase[];
  title?: string;
  subtitle?: string;
  accent?: 'teal' | 'indigo' | 'rich';
  /**
   * Limit cases and district filter to this province.
   * Southern, Northern, and Kigali City use Leaflet (dots + heat); national view uses embed.
   */
  provinceScope?: Province | null;
  /** @deprecated use `provinceScope="Southern Province"` */
  southernProvinceOnly?: boolean;
};

export function RwandaCaseMap({
  cases: casesProp,
  title,
  subtitle,
  accent = 'teal',
  provinceScope: provinceScopeProp,
  southernProvinceOnly = false,
}: MapProps) {
  const { cases: casesFromApi } = useCasesApi();
  const cases = casesProp ?? casesFromApi;
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [heatmapOn, setHeatmapOn] = useState(true);

  const scope = resolveProvinceScope(
    provinceScopeProp,
    southernProvinceOnly
  );

  const scopeDistricts = useMemo((): District[] | null => {
    if (!scope) return null;
    return [...DISTRICTS_BY_PROVINCE[scope]] as District[];
  }, [scope]);

  const districtSet = useMemo(
    () => (scopeDistricts ? new Set<string>(scopeDistricts) : null),
    [scopeDistricts]
  );

  const scopedCases = useMemo(() => {
    if (!districtSet) return cases;
    return cases.filter((c) => districtSet.has(c.district));
  }, [cases, districtSet]);

  const filteredCases = selectedDistrict
    ? scopedCases.filter((c) => c.district === selectedDistrict)
    : scopedCases;

  const districtList = useMemo(() => {
    if (scopeDistricts) return scopeDistricts;
    return Object.values(DISTRICTS_BY_PROVINCE)
      .flat()
      .filter((d, i, arr) => arr.indexOf(d) === i) as District[];
  }, [scopeDistricts]);

  const mapQuery = useMemo(() => {
    if (!scope) {
      return selectedDistrict ? `${selectedDistrict}, Rwanda` : 'Rwanda';
    }
    if (scope === 'Southern Province') {
      if (selectedDistrict) {
        return `${selectedDistrict}, Southern Province, Rwanda`;
      }
      return 'Southern Province, Rwanda';
    }
    if (scope === 'Northern Province') {
      if (selectedDistrict) {
        return `${selectedDistrict}, Northern Province, Rwanda`;
      }
      return 'Northern Province, Rwanda';
    }
    if (scope === 'Kigali City') {
      if (selectedDistrict) {
        return `${selectedDistrict}, Kigali City, Rwanda`;
      }
      return 'Kigali City, Rwanda';
    }
    if (selectedDistrict) {
      return `${selectedDistrict}, Rwanda`;
    }
    return 'Rwanda';
  }, [scope, selectedDistrict]);

  const mapSrc = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(mapQuery)}`;

  const heatmapDistrictList =
    scopeDistricts ??
    ([...DISTRICTS_BY_PROVINCE['Southern Province']] as District[]);

  const districtCounts = useMemo(() => {
    const list = selectedDistrict ? [selectedDistrict] : [...heatmapDistrictList];
    const counts = new Map<string, number>();
    let max = 0;
    for (const d of list) {
      const n = scopedCases.filter((c) => c.district === d).length;
      counts.set(d, n);
      if (n > max) max = n;
    }
    return { counts, max };
  }, [scopedCases, selectedDistrict, heatmapDistrictList]);

  const dotCases = useMemo(() => {
    const pool = filteredCases;
    return pool.slice(0, 400);
  }, [filteredCases]);

  const leafletScope: SurveillanceLeafletScope | null =
    scope === 'Southern Province' ||
    scope === 'Northern Province' ||
    scope === 'Kigali City' ?
      scope
    : null;
  const useLeafletMap = Boolean(leafletScope);

  const heatAccent =
    accent === 'rich' ? '#2563eb'
    : accent === 'indigo' ? '#4f46e5'
    : '#0d9488';

  const displayTitle =
    title ??
    (scope
      ? scope === 'Southern Province'
        ? 'Case distribution'
        : `Case distribution — ${scope}`
      : 'Rwanda — national case distribution');

  const accentTextClass =
    accent === 'indigo'
      ? 'text-indigo-700 hover:bg-indigo-50'
      : accent === 'rich'
        ? 'text-[color:var(--role-accent)] hover:bg-[color:var(--role-accent-soft)]'
        : 'text-teal-700 hover:bg-teal-50';

  const heatmapBtnClass = (on: boolean) =>
    on
      ? 'border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)]'
      : 'border-gray-200 bg-white text-gray-600';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-3">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {subtitle && (
              <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                {subtitle}
              </p>
            )}
            {displayTitle.trim() !== '' && (
              <h2 className="text-lg font-bold text-gray-900">{displayTitle}</h2>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {useLeafletMap && (
              <button
                type="button"
                onClick={() => setHeatmapOn((v) => !v)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${heatmapBtnClass(heatmapOn)}`}
              >
                {heatmapOn ? 'Heatmap on' : 'Heatmap off'}
              </button>
            )}
            <select
              value={selectedDistrict ?? ''}
              onChange={(e) =>
                setSelectedDistrict(
                  e.target.value ? (e.target.value as District) : null
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              <option value="">
                {scope
                  ? `${scope} (all districts)`
                  : 'Rwanda (all districts)'}
              </option>
              {districtList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        {useLeafletMap && leafletScope ? (
          <ProvinceScopedLeafletMap
            scope={leafletScope}
            heatmapOn={heatmapOn}
            districtCounts={districtCounts.counts}
            districtMax={districtCounts.max}
            scopedDistricts={heatmapDistrictList}
            dotCases={dotCases}
            selectedDistrict={selectedDistrict}
            accentColor={heatAccent}
          />
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-gray-200">
            <iframe
              title="Rwanda map"
              src={mapSrc}
              className="h-[430px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-900">
            {selectedDistrict || scope || 'Selected scope'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Cases</span>
              <span className="font-bold text-gray-900">
                {filteredCases.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Deaths</span>
              <span className="font-bold text-danger-600">
                {filteredCases.filter((c) => c.status === 'Deceased').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Under 5</span>
              <span className="font-bold">
                {filteredCases.filter((c) => c.ageGroup === 'Under 5').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SM+ (hospital)</span>
              <span className="font-bold">
                {
                  filteredCases.filter(
                    (c) => c.severeMalariaTestResult === 'Positive'
                  ).length
                }
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedDistrict(null)}
          className={`w-full rounded-lg py-2 text-xs font-medium transition-colors ${accentTextClass}`}
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}
