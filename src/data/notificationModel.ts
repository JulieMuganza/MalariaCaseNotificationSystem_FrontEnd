/**
 * Notification routing model — Phase aller (onward) and Phase retour (return, SM+ only).
 * Partial payloads omit clinical detail per recipient rules; RICH always receives full content.
 */

import type { MalariaCase } from './mockData';

export type NotificationPhase = 'aller' | 'retour';

/** Who receives each notification in the model */
export const NOTIFICATION_RECIPIENTS = {
  chwToHc: ['CHEO', 'Head Health Center (Titulaire)'],
  chwToRich: ['RICH (full notification)'],
  hcToHospital: [
    'Clinical Director',
    'CHEO (Hospital)',
    'DG',
    'Director of Nursing'
  ],
  hcToRich: ['RICH (full notification)'],
  hospitalToRich: ['RICH (full notification)'],
  /** Positive cases only; excludes Management / medicines */
  hospitalDownstream: ['Health Center', 'CHW']
} as const;

/** Placeholder options — replace when clinical list is finalized */
export const HC_PRE_TREATMENT_OPTIONS = [
  'Paracetamol',
  'ORS',
  'IV fluids initiated',
  'Antimalarial (oral) pre-referral',
  'Oxygen',
  'Other (specify in notes)'
] as const;

export type ChwToHcTransport =
  | 'Walk'
  | 'Bicycle'
  | 'Motor'
  | 'Car/Bus'
  | 'Ambulance';
export type HcToHospitalTransport =
  | 'Walk'
  | 'Bicycle'
  | 'Motor'
  | 'Car/Bus'
  | 'Ambulance';

export type NotificationPayloadVariant =
  | 'chw_hc_partial'
  | 'chw_rich_full'
  | 'hc_hospital_partial'
  | 'hc_rich_full'
  | 'hospital_rich_full'
  | 'hospital_downstream_partial';

export function patientCodeDisplay(c: MalariaCase): string {
  return c.patientCode || c.patientId;
}

/** Human-readable lines for in-app notification previews (not SMS). */
export function buildChwToHcPartialSummary(c: MalariaCase): string {
  const code = patientCodeDisplay(c);
  const transfer = c.chwTransferDateTime ?
    new Date(c.chwTransferDateTime).toLocaleString() :
    '—';
  const mode = c.chwReferralTransport || '—';
  return [
    `Patient: ${c.patientName}`,
    `Patient code (ID): ${code}`,
    `Location: ${c.village}, ${c.cell}, ${c.sector}, ${c.district}`,
    `Transfer to HC: ${transfer}`,
    `Transport: ${mode}`,
    'Symptoms: withheld in this notification (available in RICH portal & HC portal).'
  ].join('\n');
}

export function buildChwToRichFullSummary(c: MalariaCase): string {
  const code = patientCodeDisplay(c);
  const transfer = c.chwTransferDateTime ?
    new Date(c.chwTransferDateTime).toLocaleString() :
    '—';
  const mode = c.chwReferralTransport || '—';
  const sx =
    c.symptoms.length > 0 ? c.symptoms.join('; ') : 'None recorded';
  return [
    `Patient: ${c.patientName}`,
    `Patient code (ID): ${code}`,
    `Location: ${c.village}, ${c.cell}, ${c.sector}, ${c.district}`,
    `Transfer to HC: ${transfer}`,
    `Transport: ${mode}`,
    `Symptoms (${c.symptoms.length}): ${sx}`,
    `Disease history: first symptom ${c.dateFirstSymptom ? new Date(c.dateFirstSymptom).toLocaleDateString() : '—'}; seek care: ${c.timeToSeekCare || '—'}`
  ].join('\n');
}

export function buildHcToHospitalPartialSummary(c: MalariaCase): string {
  const code = patientCodeDisplay(c);
  const recv = c.hcPatientReceivedDateTime ?
    new Date(c.hcPatientReceivedDateTime).toLocaleString() :
    '—';
  const xfer = c.hcPatientTransferredToHospitalDateTime ?
    new Date(c.hcPatientTransferredToHospitalDateTime).toLocaleString() :
    '—';
  const pre =
    c.hcPreTreatment?.length ?
      c.hcPreTreatment.join(', ') :
      '—';
  const tr = c.hcReferralToHospitalTransport || '—';
  return [
    `Patient: ${c.patientName}`,
    `Patient code (ID): ${code}`,
    `HC received patient: ${recv}`,
    `Transferred to hospital: ${xfer}`,
    `Transport to hospital: ${tr}`,
    `Pre-treatment provided: ${pre}`,
    'Symptoms: withheld in this notification (full detail in RICH portal & HC portal).'
  ].join('\n');
}

export function buildHospitalDownstreamPartialSummary(c: MalariaCase): string {
  const code = patientCodeDisplay(c);
  const sm = c.severeMalariaTestResult || '—';
  const recv = c.hospitalReceivedDateTime ?
    new Date(c.hospitalReceivedDateTime).toLocaleString() :
    '—';
  const disc = c.hospitalDischargeDateTime ?
    new Date(c.hospitalDischargeDateTime).toLocaleString() :
    '—';
  const out = c.finalOutcomeHospital || '—';
  return [
    `Patient: ${c.patientName}`,
    `Patient code (ID): ${code}`,
    `Severe malaria result: ${sm}`,
    `Hospital received: ${recv}`,
    `Discharge: ${disc}`,
    `Outcome: ${out}`,
    'Management / medicines: not included in this notification.',
    'Symptoms: not included in this notification.'
  ].join('\n');
}

export function variantIncludesSymptoms(v: NotificationPayloadVariant): boolean {
  return (
    v === 'chw_rich_full' ||
    v === 'hc_rich_full' ||
    v === 'hospital_rich_full'
  );
}

export function variantIncludesManagement(v: NotificationPayloadVariant): boolean {
  return v === 'hospital_rich_full';
}
