/** Rwanda provinces and districts (administrative structure for signup & filters). */

export const PROVINCES = [
  'Kigali City',
  'Northern Province',
  'Southern Province',
  'Eastern Province',
  'Western Province',
] as const;

export type Province = (typeof PROVINCES)[number];

export const DISTRICTS_BY_PROVINCE: Record<Province, readonly string[]> = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  'Southern Province': [
    'Kamonyi',
    'Muhanga',
    'Ruhango',
    'Nyanza',
    'Huye',
    'Gisagara',
    'Nyaruguru',
    'Nyamagabe',
  ],
  'Eastern Province': [
    'Bugesera',
    'Gatsibo',
    'Kayonza',
    'Kirehe',
    'Ngoma',
    'Nyagatare',
    'Rwamagana',
  ],
  'Western Province': [
    'Karongi',
    'Ngororero',
    'Nyabihu',
    'Nyamasheke',
    'Rubavu',
    'Rusizi',
    'Rutsiro',
  ],
};

export const ALL_DISTRICTS = [
  ...DISTRICTS_BY_PROVINCE['Kigali City'],
  ...DISTRICTS_BY_PROVINCE['Northern Province'],
  ...DISTRICTS_BY_PROVINCE['Southern Province'],
  ...DISTRICTS_BY_PROVINCE['Eastern Province'],
  ...DISTRICTS_BY_PROVINCE['Western Province'],
] as const;

export type RwandaDistrict = (typeof ALL_DISTRICTS)[number];

/**
 * Infer province from district (matches backend `rwandaProvince.ts`).
 * Unknown districts default to Southern Province for legacy compatibility.
 */
export function provinceFromDistrict(
  district: string | null | undefined
): Province {
  const d = (district ?? '').trim();
  if (!d) return 'Southern Province';
  for (const p of PROVINCES) {
    if ((DISTRICTS_BY_PROVINCE[p] as readonly string[]).includes(d)) {
      return p;
    }
  }
  return 'Southern Province';
}
