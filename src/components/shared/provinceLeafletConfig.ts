/**
 * OSM Leaflet bounds + district centroids for surveillance maps (case dots + heat).
 * Coordinates are approximate WGS84 [lat, lng].
 */

export type SurveillanceLeafletScope =
  | 'Southern Province'
  | 'Northern Province'
  | 'Kigali City';

export type LeafletBounds = [[number, number], [number, number]];

export const PROVINCE_LEAFLET: Record<
  SurveillanceLeafletScope,
  {
    bounds: LeafletBounds;
    /** District name → centroid for jittered case dots + heat circles */
    districtCentroids: Record<string, [number, number]>;
  }
> = {
  'Southern Province': {
    bounds: [
      [-2.76, 29.18],
      [-1.84, 29.99],
    ],
    districtCentroids: {
      Kamonyi: [-1.916, 29.889],
      Muhanga: [-2.078, 29.749],
      Ruhango: [-2.231, 29.772],
      Nyanza: [-2.351, 29.742],
      Huye: [-2.596, 29.737],
      Gisagara: [-2.484, 29.672],
      Nyaruguru: [-2.638, 29.356],
      Nyamagabe: [-2.484, 29.56],
    },
  },
  'Northern Province': {
    bounds: [
      [-2.02, 29.32],
      [-1.22, 30.18],
    ],
    districtCentroids: {
      Burera: [-1.46, 29.83],
      Gakenke: [-1.69, 29.75],
      Gicumbi: [-1.59, 30.07],
      Musanze: [-1.5, 29.63],
      Rulindo: [-1.75, 29.93],
    },
  },
  'Kigali City': {
    bounds: [
      [-2.12, 29.98],
      [-1.85, 30.22],
    ],
    districtCentroids: {
      Gasabo: [-1.91, 30.12],
      Kicukiro: [-2.0, 30.1],
      Nyarugenge: [-1.97, 30.04],
    },
  },
};

export function boundsCenter(
  bounds: LeafletBounds
): [number, number] {
  const [[swLat, swLng], [neLat, neLng]] = bounds;
  return [(swLat + neLat) / 2, (swLng + neLng) / 2];
}
