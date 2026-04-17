import React from 'react';
import {
  Stethoscope,
  Truck,
  Building2,
  Hospital,
  Flag,
  Footprints,
  Bike,
  Bus,
  UserRound,
} from 'lucide-react';
import type { MalariaCase } from '../../types/domain';

type Step = {
  id: string;
  title: string;
  subtitle?: string;
  done: boolean;
  current?: boolean;
};

export type JourneyAccent = 'emerald' | 'sky' | 'blue';

function transportIcon(mode?: string) {
  const m = (mode || '').toLowerCase();
  if (m.includes('ambulance')) return Truck;
  if (m.includes('bicycle') || m.includes('bike')) return Bike;
  if (m.includes('bus') || m.includes('car') || m.includes('motor')) return Bus;
  return Footprints;
}

function formatTs(iso?: string) {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/** First timeline actor was a first-line facility (HC or local clinic), not a CHW referral. */
function isFirstLineFacilityOriginatedCase(c: MalariaCase): boolean {
  const first = c.timeline?.[0];
  if (!first?.role) return false;
  const r = String(first.role).toLowerCase();
  return r.includes('health center') || r.includes('local clinic');
}

function isLocalClinicFirstActor(c: MalariaCase): boolean {
  const r = String(c.timeline?.[0]?.role || '').toLowerCase();
  return r.includes('local clinic');
}

const ACCENT = {
  emerald: {
    done: 'border-emerald-600 bg-emerald-600 text-white',
    current: 'border-emerald-400 bg-emerald-50 text-emerald-900',
    line: 'bg-emerald-500',
    muted: 'border-slate-200 bg-white text-slate-400',
  },
  sky: {
    done: 'border-sky-600 bg-sky-600 text-white',
    current: 'border-sky-400 bg-sky-50 text-sky-900',
    line: 'bg-sky-500',
    muted: 'border-slate-200 bg-white text-slate-400',
  },
  blue: {
    done: 'border-blue-600 bg-blue-600 text-white',
    current: 'border-blue-400 bg-blue-50 text-blue-900',
    line: 'bg-blue-500',
    muted: 'border-slate-200 bg-white text-slate-400',
  },
} as const;

/** Visual patient journey from real case fields — not a mock workflow. */
export function PatientJourneyTimeline({
  c,
  accent = 'emerald',
}: {
  c: MalariaCase;
  /** `sky` on HC, `blue` on RICH, CHW default `emerald`. */
  accent?: JourneyAccent;
}) {
  const colors = ACCENT[accent];
  const firstLineOriginated = isFirstLineFacilityOriginatedCase(c);
  const walkInLocalClinic = firstLineOriginated && isLocalClinicFirstActor(c);

  const nonSevereClosedAtChw =
    c.status === 'Resolved' &&
    (c.symptomCount ?? 0) === 0 &&
    !c.hcPatientReceivedDateTime &&
    !c.hcPatientTransferredToHospitalDateTime;
  const statusOrder = [
    'Pending',
    'Referred',
    'HC Received',
    'Escalated',
    'Admitted',
    'Treated',
    'Discharged',
    'Deceased',
    'Resolved',
  ] as const;
  const rank = (s: string) => {
    const i = statusOrder.indexOf(s as (typeof statusOrder)[number]);
    return i === -1 ? 0 : i;
  };

  const chwDone = !firstLineOriginated;
  const referredDone =
    !nonSevereClosedAtChw && rank(c.status) >= rank('Referred');
  const hcInDone =
    !nonSevereClosedAtChw && rank(c.status) >= rank('HC Received');
  const hospInDone =
    (!nonSevereClosedAtChw && rank(c.status) >= rank('Escalated')) ||
    !!c.hospitalReceivedDateTime;
  const outcomeDone =
    c.status === 'Deceased' ||
    c.status === 'Resolved' ||
    c.status === 'Discharged' ||
    c.status === 'Treated' ||
    !!c.finalOutcomeHospital ||
    !!c.outcome;

  const ChwTransport = transportIcon(c.chwReferralTransport);
  const HcTransport = transportIcon(c.hcReferralToHospitalTransport);

  const intakeSymptomLabel =
    (c.symptomCount ?? 0) > 0
      ? `${c.symptomCount} symptom${c.symptomCount === 1 ? '' : 's'} recorded at intake`
      : 'Registered at facility';

  const steps: Step[] = firstLineOriginated
    ? [
        {
          id: 'hc_intake',
          title: walkInLocalClinic
            ? 'Local clinic registration'
            : 'Health center registration',
          subtitle: intakeSymptomLabel,
          done: true,
          current: c.status === 'Pending',
        },
        {
          id: 'chw_path',
          title: 'Community (CHW) referral',
          subtitle: walkInLocalClinic
            ? 'Not applicable — patient presented directly at this local clinic'
            : 'Not applicable — patient presented directly at this health center',
          done: true,
          current: false,
        },
        {
          id: 'hc',
          title: walkInLocalClinic ? 'Care at local clinic' : 'Care at health center',
          subtitle: nonSevereClosedAtChw
            ? 'Not applicable'
            : formatTs(c.hcPatientReceivedDateTime) || 'In progress',
          done: hcInDone,
          current: c.status === 'HC Received',
        },
        {
          id: 'hosp_ref',
          title: 'Referral to hospital',
          subtitle: nonSevereClosedAtChw
            ? 'Not applicable'
            : c.hcPatientTransferredToHospitalDateTime
              ? `${formatTs(c.hcPatientTransferredToHospitalDateTime)} · ${c.hcReferralToHospitalTransport || 'Transport'}`
              : 'Not referred yet',
          done: !!c.hcPatientTransferredToHospitalDateTime || hospInDone,
          current: c.status === 'Escalated',
        },
        {
          id: 'hosp',
          title: 'Hospital care',
          subtitle: nonSevereClosedAtChw
            ? 'Not applicable'
            : formatTs(c.hospitalReceivedDateTime) || 'Not admitted',
          done: hospInDone,
          current: ['Admitted', 'Treated'].includes(c.status),
        },
        {
          id: 'out',
          title: 'Outcome',
          subtitle:
            c.finalOutcomeHospital ||
            c.outcome ||
            (c.status === 'Deceased' ? 'Deceased' : '') ||
            (outcomeDone && c.status !== 'Pending' ? c.status : 'Pending'),
          done: outcomeDone,
          current: outcomeDone,
        },
      ]
    : [
        {
          id: 'chw',
          title: 'CHW assessment',
          subtitle: nonSevereClosedAtChw
            ? 'No severe malaria signs; case closed at CHW'
            : c.symptomCount
              ? `${c.symptomCount} severe symptoms recorded`
              : 'Symptoms recorded',
          done: chwDone,
          current: c.status === 'Pending' || nonSevereClosedAtChw,
        },
        {
          id: 'refer',
          title:
            c.chwPrimaryReferral === 'LOCAL_CLINIC'
              ? 'Referral to local clinic'
              : 'Referral to Health Center',
          subtitle: nonSevereClosedAtChw
            ? 'No transfer required'
            : c.chwReferralTransport
              ? `Transport: ${c.chwReferralTransport}`
              : 'Transport pending',
          done: referredDone,
          current: c.status === 'Referred',
        },
        {
          id: 'hc',
          title:
            c.chwPrimaryReferral === 'LOCAL_CLINIC' ? 'Local clinic' : 'Health Center',
          subtitle: nonSevereClosedAtChw
            ? 'Not applicable'
            : formatTs(c.hcPatientReceivedDateTime) || 'Awaiting reception',
          done: hcInDone,
          current: c.status === 'HC Received',
        },
        {
          id: 'hosp_ref',
          title: 'Referral to hospital',
          subtitle: nonSevereClosedAtChw
            ? 'Not applicable'
            : c.hcPatientTransferredToHospitalDateTime
              ? `${formatTs(c.hcPatientTransferredToHospitalDateTime)} · ${c.hcReferralToHospitalTransport || 'Transport'}`
              : 'Not referred yet',
          done: !!c.hcPatientTransferredToHospitalDateTime || hospInDone,
          current: c.status === 'Escalated',
        },
        {
          id: 'hosp',
          title: 'Hospital care',
          subtitle: nonSevereClosedAtChw
            ? 'Not applicable'
            : formatTs(c.hospitalReceivedDateTime) || 'Not admitted',
          done: hospInDone,
          current: ['Admitted', 'Treated'].includes(c.status),
        },
        {
          id: 'out',
          title: 'Outcome',
          subtitle:
            (nonSevereClosedAtChw
              ? 'Resolved at CHW (non-severe malaria, no referral)'
              : '') ||
            c.finalOutcomeHospital ||
            c.outcome ||
            (c.status === 'Deceased' ? 'Deceased' : '') ||
            (outcomeDone && c.status !== 'Pending' ? c.status : 'Pending'),
          done: outcomeDone,
          current: outcomeDone,
        },
      ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Patient journey</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Live status
        </span>
      </div>
      <div className="relative space-y-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  s.done
                    ? colors.done
                    : s.current
                      ? colors.current
                      : colors.muted
                }`}
              >
                {s.id === 'chw' && <Stethoscope size={16} />}
                {s.id === 'hc_intake' && <UserRound size={16} />}
                {s.id === 'chw_path' && <Stethoscope size={16} />}
                {s.id === 'refer' && <ChwTransport size={16} />}
                {s.id === 'hc' && <Building2 size={16} />}
                {s.id === 'hosp_ref' && <HcTransport size={16} />}
                {s.id === 'hosp' && <Hospital size={16} />}
                {s.id === 'out' && <Flag size={16} />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`my-0.5 min-h-[28px] w-0.5 flex-1 ${
                    s.done ? colors.line : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
            <div className={`pb-6 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-semibold ${
                  s.done ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {s.title}
              </p>
              {s.subtitle && (
                <p className="mt-0.5 text-xs text-slate-500">{s.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
