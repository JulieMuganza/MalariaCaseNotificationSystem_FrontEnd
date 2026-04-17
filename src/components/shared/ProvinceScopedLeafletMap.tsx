import { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MalariaCase } from '../../types/domain';
import {
  boundsCenter,
  type LeafletBounds,
  type SurveillanceLeafletScope,
  PROVINCE_LEAFLET,
} from './provinceLeafletConfig';

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}

function jitterLatLng(
  base: [number, number],
  caseId: string,
  index: number
): [number, number] {
  const seed = hashSeed(`${caseId}-${index}`);
  const angle = ((seed % 360) * Math.PI) / 180;
  const scale = 0.35 + ((seed % 100) / 100) * 0.65;
  const rLat = 0.012 * scale;
  const rLng = 0.012 * scale;
  return [
    base[0] + Math.cos(angle) * rLat,
    base[1] + Math.sin(angle) * rLng,
  ];
}

function heatRadiusMeters(count: number, max: number): number {
  if (count <= 0) return 0;
  const t = max > 0 ? Math.min(1, count / max) : 0.5;
  return Math.min(16_000, 3200 + count * 420 + t * 2800);
}

function heatOpacity(count: number, max: number): number {
  if (max <= 0) return 0.14;
  const t = Math.min(1, count / max);
  return 0.14 + t * 0.38;
}

function FlyToDistrict({
  bounds,
  centroids,
  selectedDistrict,
}: {
  bounds: LeafletBounds;
  centroids: Record<string, [number, number]>;
  selectedDistrict: string | null;
}) {
  const map = useMap();
  const initialMount = useRef(true);
  useEffect(() => {
    if (selectedDistrict && centroids[selectedDistrict]) {
      const [lat, lng] = centroids[selectedDistrict];
      map.setView([lat, lng], 11, { animate: true });
      return;
    }
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    map.fitBounds(bounds, { padding: [32, 32], animate: true });
  }, [selectedDistrict, map, bounds, centroids]);
  return null;
}

type Props = {
  scope: SurveillanceLeafletScope;
  heatmapOn: boolean;
  districtCounts: Map<string, number>;
  districtMax: number;
  /** Districts in this province (order for heat layer) */
  scopedDistricts: readonly string[];
  dotCases: MalariaCase[];
  selectedDistrict: string | null;
  /** Heat + legend accent (matches surveillance partner theme) */
  accentColor?: string;
};

export function ProvinceScopedLeafletMap({
  scope,
  heatmapOn,
  districtCounts,
  districtMax,
  scopedDistricts,
  dotCases,
  selectedDistrict,
  accentColor = '#2563eb',
}: Props) {
  const { bounds, districtCentroids } = PROVINCE_LEAFLET[scope];
  const fallbackCenter = boundsCenter(bounds);

  return (
    <div className="relative z-0 h-[430px] w-full overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [32, 32] }}
        className="h-full w-full"
        scrollWheelZoom
        style={{ minHeight: 430 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <FlyToDistrict
          bounds={bounds}
          centroids={districtCentroids}
          selectedDistrict={selectedDistrict}
        />

        {heatmapOn &&
          scopedDistricts.map((d) => {
            const n = districtCounts.get(d) ?? 0;
            if (n === 0) return null;
            const center = districtCentroids[d];
            if (!center) return null;
            const r = heatRadiusMeters(n, districtMax);
            const o = heatOpacity(n, districtMax);
            return (
              <Circle
                key={`heat-${d}`}
                center={center}
                radius={r}
                pathOptions={{
                  color: accentColor,
                  fillColor: accentColor,
                  fillOpacity: o,
                  weight: 1,
                  opacity: 0.35,
                }}
              />
            );
          })}

        {dotCases.map((c, i) => {
          const d = c.district ?? '';
          const base = districtCentroids[d] ?? fallbackCenter;
          const pos = jitterLatLng(base, c.id, i);
          const deceased = c.status === 'Deceased';
          const severe = !deceased && c.symptoms.length >= 5;
          const color = deceased ? '#991b1b' : severe ? '#dc2626' : '#f59e0b';
          const radiusM = deceased ? 950 : severe ? 800 : 650;
          return (
            <Circle
              key={`${c.id}-${i}`}
              center={pos}
              radius={radiusM}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.88,
                weight: 1,
                opacity: 0.95,
              }}
            />
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-2 left-2 z-[500] flex flex-wrap items-center gap-3 rounded-lg bg-white/90 px-2 py-1.5 text-[10px] text-gray-600 shadow-sm backdrop-blur-sm">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
          Severe
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-900" />
          Death
        </span>
        <span className="text-gray-400">|</span>
        <span className="font-medium" style={{ color: accentColor }}>
          Density (zoom to scale)
        </span>
      </div>
    </div>
  );
}

/** @deprecated use ProvinceScopedLeafletMap — kept for any external imports */
export const SOUTHERN_DISTRICT_LATLNG =
  PROVINCE_LEAFLET['Southern Province'].districtCentroids;
