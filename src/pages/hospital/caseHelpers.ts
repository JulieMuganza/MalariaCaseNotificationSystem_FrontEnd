import type { MalariaCase } from '../../types/domain';

/** Deduped symptom lines from CHW, HC clinical, and HC triage (order preserved). */
export function mergedSymptoms(c: MalariaCase): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const arr of [c.chwSymptoms, c.symptoms, c.hcTriageSymptoms]) {
    for (const s of arr ?? []) {
      const t = s.trim();
      const k = t.toLowerCase();
      if (t && !seen.has(k)) {
        seen.add(k);
        out.push(t);
      }
    }
  }
  return out;
}

export const DH_INBOX_EXCLUDED_STATUSES = [
  'Pending',
  'Referred',
  'HC Received',
  'Resolved',
] as const;

export function districtHospitalInboxIncludes(c: MalariaCase): boolean {
  return !DH_INBOX_EXCLUDED_STATUSES.includes(
    c.status as (typeof DH_INBOX_EXCLUDED_STATUSES)[number]
  );
}
