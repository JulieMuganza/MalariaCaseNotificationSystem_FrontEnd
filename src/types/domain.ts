/** Shared domain types aligned with API case payloads */

export type CaseStatus =
  | 'Pending'
  | 'Referred'
  | 'HC Received'
  | 'Escalated'
  | 'Admitted'
  | 'Treated'
  | 'Discharged'
  | 'Deceased'
  | 'Resolved';

export type PlasmodiumSpecies =
  | 'Falciparum'
  | 'Malariae'
  | 'Ovale'
  | 'Vivax'
  | 'Knowlesi'
  | 'Not specified';

export interface CaseTimeline {
  event: string;
  timestamp: string;
  actor: string;
  role: string;
}

/** Case record returned by GET /api/v1/cases (same shape as legacy mock) */
export interface MalariaCase {
  id: string;
  patientName: string;
  patientCode: string;
  patientId: string;
  sex: 'Male' | 'Female';
  dateOfBirth: string;
  age: number;
  ageGroup: 'Under 5' | '5 and above';
  pregnant?: boolean;
  breastfeeding?: boolean;
  province?: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  gpsCoordinates?: string;
  maritalStatus: string;
  familySize: number;
  educationLevel: string;
  occupation: string;
  economicStatus: string;
  distanceToHC: string;
  transportMode: string;
  hasInsurance: boolean;
  insuranceType?: string;
  nightOutings: boolean;
  nightOutingHours?: string;
  dateFirstSymptom: string;
  timeToSeekCare: string;
  usedTraditionalMedicine: boolean;
  consultedCHW: boolean;
  consultedCHWDate?: string;
  rdtsAvailable: boolean;
  consultedHealthPost: boolean;
  consultedHealthCenter: boolean;
  consultedHospital: boolean;
  symptoms: string[];
  symptomCount: number;
  /** Severe symptoms reported by CHW at notification (preserved for HC when facility updates `symptoms`). */
  chwSymptoms?: string[];
  /** Rapid test result recorded by CHW on the new-case form. */
  chwRapidTestResult?: 'Positive' | 'Negative';
  houseWallStatus: string;
  mosquitoEntry: boolean;
  breedingSites: string[];
  preventionMeasures: string[];
  llinAge?: string;
  llinSource?: string;
  llinStatus?: string;
  sleepsUnderLLIN?: boolean;
  status: CaseStatus;
  chwName: string;
  chwId: string;
  /** CHW severe referral: first receiving facility (health center vs local clinic). */
  chwPrimaryReferral?: 'HEALTH_CENTER' | 'LOCAL_CLINIC';
  healthCenter?: string;
  hospital?: string;
  testType?: string;
  plasmodiumSpecies?: PlasmodiumSpecies;
  confirmedDate?: string;
  caseCategory?: 'Index case' | 'Follow-up case';
  vulnerabilities?: string[];
  hospitalChecklist?: Record<string, 'Compliant' | 'Non-compliant' | 'N/A'>;
  outcome?:
  | 'Treated & Discharged'
  | 'Still Admitted'
  | 'Referred further'
  | 'Deceased';
  outcomeDate?: string;
  outcomeNotes?: string;
  reportedToEIDSR: boolean;
  createdAt: string;
  updatedAt: string;
  timeline: CaseTimeline[];
  chwTransferDateTime?: string;
  chwReferralTransport?: 'Self' | 'With CHW' | 'Ambulance';
  hcPatientReceivedDateTime?: string;
  hcPatientTransferredToHospitalDateTime?: string;
  hcReferralToHospitalTransport?: 'Self' | 'With relative' | 'Ambulance';
  hcPreTreatment?: string[];
  hospitalReceivedDateTime?: string;
  hospitalDischargeDateTime?: string;
  severeMalariaTestResult?: 'Positive' | 'Negative';
  hospitalManagementMedication?: string;
  finalOutcomeHospital?: 'Recovered' | 'Deceased';
  phaseRetourEligible?: boolean;
  transferredToReferralHospital?: boolean;
  dhTransferredToReferralHospitalDateTime?: string;
  /** District → referral / provincial transfer (same enum values as HC → DH). */
  dhReferralToReferralHospitalTransport?: 'Self' | 'With relative' | 'Ambulance';
  referralHospitalReceivedDateTime?: string;

  /** District hospital: HC pre-transfer received; observation window; oral step-down */
  dhHcPreTransferReceived?: boolean;
  dhObservationPlannedDays?: number;
  dhObservationStartedAt?: string;
  dhOralTreatmentReadyAt?: string;

  /** Referral / provincial hospital — continuity & inpatient follow-up */
  referralContinuityAcknowledgedAt?: string;
  referralSymptomsUpdate?: string;
  referralClinicalTrend?: 'improving' | 'stable' | 'worsening';
  referralSpecializedCareUnit?: string;
  referralSpecializedCareAt?: string;
  referralInpatientNotes?: string;

  // New refined HC clinical fields
  weight?: number;
  hcTriageSymptoms?: string[];
  hcTreatments?: {
    drug: string;
    dose: string;
    route: string;
    time: string;
  }[];
}

export interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  caseId?: string;
  timestamp: string;
  read: boolean;
  targetRole: string;
  phase?: 'aller' | 'retour';
  contentLevel?: 'full' | 'partial';
  recipientRoles?: string;
}
