// Reference data + i18n labels (no mock cases/users — data comes from the API)

import {
  ALL_DISTRICTS,
  DISTRICTS_BY_PROVINCE,
  PROVINCES,
  provinceFromDistrict,
  type Province,
  type RwandaDistrict,
} from './rwandaGeo';

export { ALL_DISTRICTS, DISTRICTS_BY_PROVINCE, PROVINCES, provinceFromDistrict };
export type { Province, RwandaDistrict };

/** All 30 districts — use for filters, maps, and case location. */
export const DISTRICTS = ALL_DISTRICTS;
export type District = RwandaDistrict;

const SOUTHERN_SECTORS: Record<string, string[]> = {
  Kamonyi: [
    'Gacurabwenge',
    'Karama',
    'Kayenzi',
    'Kayumbu',
    'Mugina',
    'Musambira',
    'Ngamba',
    'Nyamiyaga',
    'Nyarubaka',
    'Rugalika',
    'Rukoma',
    'Runda',
  ],
  Muhanga: [
    'Cyeza',
    'Kabacuzi',
    'Kibangu',
    'Kiyumba',
    'Muhanga',
    'Mushishiro',
    'Nyabinoni',
    'Nyamabuye',
    'Nyarusange',
    'Rongi',
    'Rugendabari',
    'Shyogwe',
  ],
  Ruhango: [
    'Bweramana',
    'Byimana',
    'Kabagari',
    'Kinazi',
    'Kinihira',
    'Mbuye',
    'Mwendo',
    'Ntongwe',
    'Ruhango',
  ],
  Nyanza: [
    'Busasamana',
    'Busoro',
    'Cyabakamyi',
    'Kibirizi',
    'Kigoma',
    'Mukingo',
    'Muyira',
    'Ntyazo',
    'Nyagisozi',
    'Rwabicuma',
  ],
  Huye: [
    'Gishamvu',
    'Huye',
    'Karama',
    'Kigoma',
    'Kinazi',
    'Maraba',
    'Mbazi',
    'Mukura',
    'Ngoma',
    'Ruhashya',
    'Rusatira',
    'Simbi',
    'Tumba',
  ],
  Gisagara: [
    'Gikonko',
    'Gishubi',
    'Kansi',
    'Kibilizi',
    'Kigembe',
    'Mamba',
    'Muganza',
    'Mugombwa',
    'Mukindo',
    'Musha',
    'Ndora',
    'Nyanza',
    'Save',
  ],
  Nyaruguru: [
    'Busanze',
    'Cyahinda',
    'Kibeho',
    'Kivu',
    'Mata',
    'Muganza',
    'Munini',
    'Ngera',
    'Ngoma',
    'Nyabimata',
    'Nyagisozi',
    'Ruheru',
    'Ruramba',
    'Rusenge',
  ],
  Nyamagabe: [
    'Buruhukiro',
    'Cyanika',
    'Gasaka',
    'Gatare',
    'Kaduha',
    'Kamegeri',
    'Kibirizi',
    'Kibumbwe',
    'Kitabi',
    'Mbazi',
    'Mugano',
    'Musange',
    'Musebeya',
    'Mushubi',
    'Nkomane',
    'Tare',
    'Uwinkingi',
  ],
};

/** Northern Province — sectors per district (CHW location step). */
const NORTHERN_SECTORS: Record<string, string[]> = {
  Burera: [
    'Bungwe',
    'Butaro',
    'Cyanika',
    'Cyeru',
    'Gahombo',
    'Gatebe',
    'Kivuye',
    'Nemba',
    'Rugarama',
    'Ruhunde',
    'Rusarabuye',
  ],
  Gakenke: [
    'Busengo',
    'Coko',
    'Cyabingo',
    'Gakenke',
    'Gashenyi',
    'Janja',
    'Kamubuga',
    'Karambo',
    'Kivuruga',
    'Mataba',
    'Muhondo',
    'Muyongwe',
    'Nemba',
    'Ruli',
    'Rushashi',
    'Rutongo',
  ],
  Gicumbi: [
    'Bukamba',
    'Bumbogo',
    'Bwisige',
    'Byumba',
    'Cyumba',
    'Giti',
    'Kageyo',
    'Kaniga',
    'Kinyinya',
    'Mukarange',
    'Muko',
    'Mutete',
    'Nyamiyaga',
    'Nyankenke',
    'Rubaya',
    'Rukomo',
    'Rushaki',
    'Rutare',
    'Ruvune',
    'Shangasha',
  ],
  Musanze: ['Muhoza', 'Kinigi', 'Kimonyi', 'Nyange', 'Mpenge', 'Rwaza', 'Shingiro'],
  Rulindo: [
    'Base',
    'Burega',
    'Bushoki',
    'Buyoga',
    'Cyeru',
    'Cyinzuzi',
    'Kinihira',
    'Kisaro',
    'Masoro',
    'Mukoto',
    'Mulinga',
    'Mushonyi',
    'Mushubati',
    'Nyiragisagara',
    'Rukozo',
    'Rusiga',
    'Shyorongi',
    'Tumba',
  ],
};

/** Kigali City — sectors per district. */
const KIGALI_SECTORS: Record<string, string[]> = {
  Gasabo: [
    'Bumbogo',
    'Gatsata',
    'Gikomero',
    'Gisozi',
    'Jabana',
    'Jali',
    'Juru',
    'Kacyiru',
    'Kimironko',
    'Kinyinya',
    'Ndera',
    'Nduba',
    'Remera',
    'Rusororo',
    'Rutunga',
    'Shyorongi',
  ],
  Kicukiro: [
    'Gahanga',
    'Gatenga',
    'Gikondo',
    'Kagarama',
    'Kicukiro',
    'Kigarama',
    'Masaka',
    'Niboye',
    'Nyarugunga',
    'Rwimbogo',
  ],
  Nyarugenge: [
    'Gitega',
    'Kanyinya',
    'Kigali',
    'Kimisagara',
    'Mageragere',
    'Muhima',
    'Nyakabanda',
    'Nyarugenge',
    'Rwampara',
  ],
};

/** Eastern Province — sectors (subset per district for forms). */
const EASTERN_SECTORS: Record<string, string[]> = {
  Bugesera: ['Gashora', 'Juru', 'Kamabuye', 'Mareba', 'Mayange', 'Musenyi', 'Mwogo', 'Ngeruka', 'Nyamata', 'Rilima', 'Ruhuha', 'Rweru', 'Shyara'],
  Gatsibo: ['Gasange', 'Gatsibo', 'Gitoki', 'Kabarore', 'Kageyo', 'Kiramurindi', 'Kiziguro', 'Muhura', 'Murambi', 'Ngarama', 'Nyagihanga', 'Remera', 'Rugarama', 'Rwimbogo'],
  Kayonza: ['Gahini', 'Kabare', 'Kabarondo', 'Mukarange', 'Murama', 'Murundi', 'Mwiri', 'Ndego', 'Nyamirama', 'Rukara', 'Ruramira', 'Rwinkwavu'],
  Kirehe: ['Gahara', 'Gatore', 'Kigarama', 'Kigina', 'Kirehe', 'Mahama', 'Mpanga', 'Musaza', 'Mushikiri', 'Nasho', 'Nyamugari', 'Nyabubare', 'Rusumo'],
  Ngoma: ['Gashanda', 'Jarama', 'Karembo', 'Kazo', 'Kibungo', 'Mugesera', 'Murama', 'Mutenderi', 'Remera', 'Rukira', 'Rukumberi', 'Sake', 'Zaza'],
  Nyagatare: ['Gatunda', 'Karama', 'Karangazi', 'Katabagemu', 'Kiyombe', 'Matimba', 'Mimuri', 'Mukama', 'Musheri', 'Nyagatare', 'Rukomo', 'Rwempasha', 'Rwimiyaga', 'Tabagwe'],
  Rwamagana: ['Fumbwe', 'Gahengeri', 'Gishari', 'Karenge', 'Kigabiro', 'Muhazi', 'Munyaga', 'Munyiginya', 'Musha', 'Muyumbu', 'Mwulire', 'Nyakariro', 'Nzige', 'Rubona'],
};

/** Western Province — sectors (subset per district for forms). */
const WESTERN_SECTORS: Record<string, string[]> = {
  Karongi: ['Bwishyura', 'Gashari', 'Gishyita', 'Mubuga', 'Murambi', 'Murundi', 'Mutuntu', 'Rubengera', 'Rugabano', 'Ruganda', 'Rwankuba', 'Twumba'],
  Ngororero: ['Bwira', 'Gatumba', 'Hindiro', 'Kabaya', 'Kageyo', 'Kavumu', 'Matyazo', 'Muhanda', 'Muhororo', 'Musha', 'Ndaro', 'Ngororero', 'Nyange'],
  Nyabihu: ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Muringa', 'Rambura', 'Rugera', 'Rurembo', 'Shyira'],
  Nyamasheke: ['Bushekeri', 'Bushenge', 'Cyato', 'Gihombo', 'Kagano', 'Kanjongo', 'Karangiro', 'Kirimbi', 'Macuba', 'Mahembe', 'Nyabitekeri', 'Rangiro', 'Ruharambuga', 'Shangi'],
  Rubavu: ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Kanama', 'Kanzenze', 'Mudende', 'Nyakiriba', 'Nyamyumba', 'Nyundo', 'Rubavu', 'Rugerero'],
  Rusizi: ['Bugarama', 'Bweyeye', 'Gashonga', 'Giheke', 'Gihundwe', 'Gitambi', 'Kamembe', 'Muganza', 'Mururu', 'Nkanka', 'Nkombo', 'Nkungu', 'Nyakabuye', 'Nyakarenzo', 'Rwimbogo'],
  Rutsiro: ['Boneza', 'Gihango', 'Kabihogo', 'Kivumu', 'Manihira', 'Mukura', 'Murunda', 'Musasa', 'Mushonyi', 'Mushubati', 'Nyabirasi', 'Ruhango', 'Rusebeya'],
};

export const SECTORS_BY_DISTRICT: Record<string, string[]> = {
  ...SOUTHERN_SECTORS,
  ...NORTHERN_SECTORS,
  ...KIGALI_SECTORS,
  ...EASTERN_SECTORS,
  ...WESTERN_SECTORS,
};
for (const d of ALL_DISTRICTS) {
  if (!SECTORS_BY_DISTRICT[d]) SECTORS_BY_DISTRICT[d] = [];
}

export const OCCUPATIONS = [
  'Student',
  'Not employed',
  'Agriculture & farming',
  'Fishing & aquaculture',
  'Self-employed',
  'Private sector employee',
  'Public sector employee',
  'Healthcare',
  'Education',
  'Skilled trades & construction',
  'Retail & hospitality',
  'Transport & logistics',
  'Domestic & care work',
  'Mining & extraction',
  'Security services',
  'Retired',
  'Other',
] as const;

export const PEDIATRIC_DANGER_SIGNS = [
  'Inability to drink or suckle',
  'Vomiting everything',
  'Convulsions (at least 2 in 24 hours)',
  'Lethargy and unconsciousness',
] as const;

export const PEDIATRIC_DANGER_SIGNS_PARENT = 'Pediatric Danger Signs' as const;

const BASE_SEVERE_SYMPTOMS = [
  'Acidosis',
  'Hypoglycemia',
  'Severe malaria anemia',
  'Renal impairment',
  'Jaundice',
  'Pulmonary edema',
  'Significant bleeding',
  'Shock',
  'Hyperparasitaemia',
  'Impaired Consciousness',
  'Prostration',
] as const;

export const SEVERE_SYMPTOMS = [
  ...BASE_SEVERE_SYMPTOMS,
  PEDIATRIC_DANGER_SIGNS_PARENT,
  ...PEDIATRIC_DANGER_SIGNS,
] as const;

export const HC_TRIAGE_SYMPTOMS = [
  ...SEVERE_SYMPTOMS,
] as const;

export const SYMPTOM_LABELS_RW: Record<string, string> = {
  Acidosis: 'Aside nyinshi mu maraso',
  Hypoglycemia: 'Isukari nkeya mu maraso',
  'Severe malaria anemia': 'Amaraso make cyane biturutse kuri Malariya',
  'Renal impairment': "Kudakora neza kw'impyiko",
  Jaundice: 'Kuba umuhondo',
  'Pulmonary edema': 'Amazi mu bihaha',
  'Significant bleeding': 'Kuva amaraso menshi',
  Shock: 'Shoke',
  Hyperparasitaemia: 'Udukoko twinshi cyane mu maraso',
  'Pediatric Danger Signs': 'Ibimenyetso mpuruza ku abana',
  'Inability to drink or suckle': 'Kunanirwa kunywa, konka',
  'Vomiting everything': 'Kuruka burikintu cyose',
  'Convulsions (at least 2 in 24 hours)': 'Kugagara (byibuze mu masaha 24)',
  'Lethargy and unconsciousness': 'Gucika intege cyane, gutakaza ubwenge',
  'Impaired Consciousness': 'Gutakaza ubwenge',
  Prostration: 'Kunanirwa kwicara no guhagarara',
};

export function getSymptomLabel(
  symptom: string,
  language: 'en' | 'rw'
): string {
  if (language === 'rw') {
    return SYMPTOM_LABELS_RW[symptom] ?? symptom;
  }
  return symptom;
}

export const BREEDING_SITES = [
  'Stagnant water/lake',
  'Valley',
  'Rice field',
  'Mining activity',
  'Impermeable material',
  'Water stored 2+ weeks',
  'Uncovered water tanks',
  'Bushes',
  'Other',
] as const;

export const PREVENTION_MEASURES = [
  'Indoor Residual Spray',
  'LLINs',
  'Repellents',
  'Other',
] as const;

export const VULNERABILITIES = [
  'N/A',
  'HIV/AIDS',
  'Diabetes mellitus',
  'NCDs (hypertension/heart)',
  'Infant',
  'Elderly (60+)',
  'Malnourished',
] as const;

export const HOSPITAL_CHECKLIST_ITEMS = [
  'Severe malaria diagnostics adherence to national protocol',
  'Dosing schedule of severe malaria treatment',
  'Managing complications of severe malaria',
  'Severe malaria case management quality',
  'Severe malaria patient monitoring',
  'Patient direct observation',
] as const;

export type {
  MalariaCase,
  Notification,
  CaseTimeline,
  CaseStatus,
  PlasmodiumSpecies,
} from '../types/domain';

export const monthlyCaseData = [
  { month: 'Jul 2025', cases: 12, deaths: 1 },
  { month: 'Aug 2025', cases: 18, deaths: 2 },
  { month: 'Sep 2025', cases: 25, deaths: 1 },
  { month: 'Oct 2025', cases: 31, deaths: 3 },
  { month: 'Nov 2025', cases: 22, deaths: 1 },
  { month: 'Dec 2025', cases: 15, deaths: 0 },
  { month: 'Jan 2026', cases: 28, deaths: 2 },
  { month: 'Feb 2026', cases: 35, deaths: 2 },
  { month: 'Mar 2026', cases: 42, deaths: 3 },
];

export const timelineData = [
  {
    deliverable: 'Inception Report',
    activities: [
      'Literature review',
      'Stakeholder mapping',
      'Methodology design',
      'Report drafting',
    ],
    start: '2026-02-01',
    end: '2026-03-15',
    responsible: 'Consultant',
    status: 'Completed' as const,
  },
  {
    deliverable: 'Draft Assessment + Maps',
    activities: [
      'HMIS data extraction',
      'Hotspot mapping',
      'Spatial analysis',
      'Draft report',
    ],
    start: '2026-03-01',
    end: '2026-04-15',
    responsible: 'RICH team',
    status: 'In Progress' as const,
  },
  {
    deliverable: 'Risk Factors List + Home Visits',
    activities: [
      'Field data collection',
      'Home visit assessments',
      'Risk factor analysis',
      'Preliminary findings',
    ],
    start: '2026-04-01',
    end: '2026-05-15',
    responsible: 'RICH team / RBC',
    status: 'Upcoming' as const,
  },
  {
    deliverable: 'Final Report',
    activities: [
      'Data consolidation',
      'Notification model development',
      'Stakeholder review',
      'Final submission',
    ],
    start: '2026-05-01',
    end: '2026-06-30',
    responsible: 'Consultant / RBC',
    status: 'Upcoming' as const,
  },
];
