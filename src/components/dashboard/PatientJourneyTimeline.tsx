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
import { useTranslation } from 'react-i18next';
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

function formatTs(iso?: string, locale?: string) {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString(locale, {
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
  const { i18n } = useTranslation();
  const en = !i18n.language.startsWith('rw');
  const locale = en ? undefined : 'rw-RW';
  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      Pending: en ? 'Pending' : 'Bitegereje',
      Referred: en ? 'Referred' : 'Byoherejwe',
      'HC Received': en ? 'HC received' : 'Byakiriwe ku kigonderabuzima',
      Escalated: en ? 'Escalated' : 'Byazamuwe',
      Admitted: en ? 'Admitted' : 'Byakiriwe mu bitaro',
      Treated: en ? 'Treated' : 'Yazamuwe',
      Discharged: en ? 'Discharged' : 'yasezerewe',
      Deceased: en ? 'Deceased' : 'Yitabye Imana',
      Resolved: en ? 'Resolved' : 'Byakemutse',
    };
    return labels[status] ?? status;
  };
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
      ? en
        ? `${c.symptomCount} symptom${c.symptomCount === 1 ? '' : 's'} recorded at intake`
        : `${c.symptomCount} ibimenyetso byanditswe ku ikirangaminsi`
      : en
        ? 'Registered at facility'
        : 'Yanditswe ku kigo';

  const steps: Step[] = firstLineOriginated
    ? [
        {
          id: 'hc_intake',
          title: walkInLocalClinic
            ? (en ? 'Local clinic registration' : 'Iyandikisha ku ivuriro ry\'ibanze')
            : (en ? 'Health center registration' : 'Iyandikisha ku kigonderabuzima'),
          subtitle: intakeSymptomLabel,
          done: true,
          current: c.status === 'Pending',
        },
        {
          id: 'chw_path',
          title: en ? 'Community (CHW) referral' : 'Kohereza kwa CHW mu muryango',
          subtitle: walkInLocalClinic
            ? (en
              ? 'Not applicable — patient presented directly at this local clinic'
              : 'Ntibikurikizwa — umurwayi yaje kuri iri vuriro ry\'ibanze')
            : (en
              ? 'Not applicable — patient presented directly at this health center'
              : 'Ntibikurikizwa — umurwayi yaje kuri iki kigonderabuzima'),
          done: true,
          current: false,
        },
        {
          id: 'hc',
          title: walkInLocalClinic
            ? (en ? 'Care at local clinic' : 'Ubuvuzi ku ivuriro ry\'ibanze')
            : (en ? 'Care at health center' : 'Ubuvuzi ku kigonderabuzima'),
          subtitle: nonSevereClosedAtChw
            ? (en ? 'Not applicable' : 'Ntibikurikizwa')
            : formatTs(c.hcPatientReceivedDateTime, locale) || (en ? 'In progress' : 'Birakomeje'),
          done: hcInDone,
          current: c.status === 'HC Received',
        },
        {
          id: 'hosp_ref',
          title: en ? 'Referral to hospital' : 'Kohereza ku bitaro',
          subtitle: nonSevereClosedAtChw
            ? (en ? 'Not applicable' : 'Ntibikurikizwa')
            : c.hcPatientTransferredToHospitalDateTime
              ? `${formatTs(c.hcPatientTransferredToHospitalDateTime, locale)} · ${c.hcReferralToHospitalTransport || (en ? 'Transport' : 'Uko yageze')}`
              : (en ? 'Not referred yet' : 'Ntiyoherejwe'),
          done: !!c.hcPatientTransferredToHospitalDateTime || hospInDone,
          current: c.status === 'Escalated',
        },
        {
          id: 'hosp',
          title: en ? 'Hospital care' : 'Ubuvuzi ku bitaro',
          subtitle: nonSevereClosedAtChw
            ? (en ? 'Not applicable' : 'Ntibikurikizwa')
            : formatTs(c.hospitalReceivedDateTime, locale) || (en ? 'Not admitted' : 'Ntiyakiriwe mu bitaro'),
          done: hospInDone,
          current: ['Admitted', 'Treated'].includes(c.status),
        },
        {
          id: 'out',
          title: en ? 'Outcome' : 'Ibyavuye mu buvuzi',
          subtitle:
            c.finalOutcomeHospital ||
            c.outcome ||
            (c.status === 'Deceased' ? (en ? 'Deceased' : 'Yitabye Imana') : '') ||
            (outcomeDone && c.status !== 'Pending' ? statusLabel(c.status) : statusLabel('Pending')),
          done: outcomeDone,
          current: outcomeDone,
        },
      ]
    : [
        {
          id: 'chw',
          title: en ? 'CHW assessment' : 'Isuzuma rya CHW',
          subtitle: nonSevereClosedAtChw
            ? (en
              ? 'No severe malaria signs; case closed at CHW'
              : 'Nta bimenyetso bya malariya ikomeye; dosiye yafunzwe kuri CHW')
            : c.symptomCount
              ? en
                ? `${c.symptomCount} severe symptoms recorded`
                : `${c.symptomCount} ibimenyetso bikomeye byanditswe`
              : (en ? 'Symptoms recorded' : 'Ibimenyetso byanditswe'),
          done: chwDone,
          current: c.status === 'Pending' || nonSevereClosedAtChw,
        },
        {
          id: 'refer',
          title:
            c.chwPrimaryReferral === 'LOCAL_CLINIC'
              ? (en ? 'Referral to local clinic' : 'Kohereza ku ivuriro ry\'ibanze')
              : (en ? 'Referral to Health Center' : 'Kohereza ku kigonderabuzima'),
          subtitle: nonSevereClosedAtChw
            ? (en ? 'No transfer required' : 'Nta kohereza bisabwa')
            : c.chwReferralTransport
              ? `${en ? 'Transport' : 'Uko yageze'}: ${c.chwReferralTransport}`
              : (en ? 'Transport pending' : 'Uko yageze ntiburamenyekana'),
          done: referredDone,
          current: c.status === 'Referred',
        },
        {
          id: 'hc',
          title:
            c.chwPrimaryReferral === 'LOCAL_CLINIC'
              ? (en ? 'Local clinic' : 'Ivuriro ry\'ibanze')
              : (en ? 'Health Center' : 'Ikigonderabuzima'),
          subtitle: nonSevereClosedAtChw
            ? (en ? 'Not applicable' : 'Ntibikurikizwa')
            : formatTs(c.hcPatientReceivedDateTime, locale) || (en ? 'Awaiting reception' : 'Ategereje kwakirwa'),
          done: hcInDone,
          current: c.status === 'HC Received',
        },
        {
          id: 'hosp_ref',
          title: en ? 'Referral to hospital' : 'Kohereza ku bitaro',
          subtitle: nonSevereClosedAtChw
            ? (en ? 'Not applicable' : 'Ntibikurikizwa')
            : c.hcPatientTransferredToHospitalDateTime
              ? `${formatTs(c.hcPatientTransferredToHospitalDateTime, locale)} · ${c.hcReferralToHospitalTransport || (en ? 'Transport' : 'Uko yageze')}`
              : (en ? 'Not referred yet' : 'Ntiyoherejwe'),
          done: !!c.hcPatientTransferredToHospitalDateTime || hospInDone,
          current: c.status === 'Escalated',
        },
        {
          id: 'hosp',
          title: en ? 'Hospital care' : 'Ubuvuzi ku bitaro',
          subtitle: nonSevereClosedAtChw
            ? (en ? 'Not applicable' : 'Ntibikurikizwa')
            : formatTs(c.hospitalReceivedDateTime, locale) || (en ? 'Not admitted' : 'Ntiyakiriwe mu bitaro'),
          done: hospInDone,
          current: ['Admitted', 'Treated'].includes(c.status),
        },
        {
          id: 'out',
          title: en ? 'Outcome' : 'Ibyavuye mu buvuzi',
          subtitle:
            (nonSevereClosedAtChw
              ? (en
                ? 'Resolved at CHW (non-severe malaria, no referral)'
                : 'Byakemutse kuri CHW (malariya idakomeye, nta kohereza)')
              : '') ||
            c.finalOutcomeHospital ||
            c.outcome ||
            (c.status === 'Deceased' ? (en ? 'Deceased' : 'Yitabye Imana') : '') ||
            (outcomeDone && c.status !== 'Pending' ? statusLabel(c.status) : statusLabel('Pending')),
          done: outcomeDone,
          current: outcomeDone,
        },
      ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          {en ? 'Patient journey' : 'Urugendo rw\'umurwayi'}
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {en ? 'Live status' : 'Imimerere y\'ubu'}
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
