/**
 * Canonical modes for how patients travel (CHW→facility arrival, HC→DH, DH→referral hospital).
 * API JSON uses `Car/Bus`; Prisma stores `Car_Bus`.
 */
export const FACILITY_TRANSPORT_VALUES = [
  'Walk',
  'Bicycle',
  'Motor',
  'Car/Bus',
  'Ambulance',
] as const;

export type FacilityTransportMode = (typeof FACILITY_TRANSPORT_VALUES)[number];

export const FACILITY_TRANSPORT_LABELS: Record<
  FacilityTransportMode,
  { en: string; rw: string }
> = {
  Walk: { en: 'Walk', rw: 'Ku maguru' },
  Bicycle: { en: 'Bicycle', rw: 'Amagare' },
  Motor: { en: 'Motor', rw: 'Moto' },
  'Car/Bus': { en: 'Car/Bus', rw: 'Modoka/Bisi' },
  Ambulance: { en: 'Ambulance', rw: 'Ambulansi' },
};

/** Normalize legacy labels from older API/database values. */
export function coerceFacilityTransport(
  raw: string | undefined | null,
  fallback: FacilityTransportMode
): FacilityTransportMode {
  const r = raw ?? fallback;
  if ((FACILITY_TRANSPORT_VALUES as readonly string[]).includes(r)) {
    return r as FacilityTransportMode;
  }
  const legacy: Record<string, FacilityTransportMode> = {
    Self: 'Walk',
    'With relative': 'Motor',
    Motorcycle: 'Motor',
    Car: 'Car/Bus',
    'With CHW': 'Walk',
    Car_Bus: 'Car/Bus',
  };
  return legacy[r] ?? fallback;
}
