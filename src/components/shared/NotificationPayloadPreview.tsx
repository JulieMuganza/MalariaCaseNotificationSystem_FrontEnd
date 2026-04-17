import React from 'react';
import type { MalariaCase } from '../../data/mockData';
import {
  NOTIFICATION_RECIPIENTS,
  type NotificationPayloadVariant,
  patientCodeDisplay,
  variantIncludesManagement,
  variantIncludesSymptoms
} from '../../data/notificationModel';

export function NotificationPayloadPreview({
  title,
  variant,
  c,
  phaseLabel
}: {
  title: string;
  variant: NotificationPayloadVariant;
  c: MalariaCase;
  phaseLabel?: string;
}) {
  const recipients = recipientLine(variant);
  const showSx = variantIncludesSymptoms(variant);
  const showMgmt = variantIncludesManagement(variant);
  const code = patientCodeDisplay(c);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-bold text-gray-900">{title}</h4>
        {phaseLabel &&
        <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            {phaseLabel}
          </span>
        }
      </div>
      {recipients &&
      <p className="text-xs text-gray-600 mb-3">
          <span className="font-semibold text-gray-700">Recipients: </span>
          {recipients}
        </p>
      }
      <ul className="space-y-2 text-gray-700">
        <li>
          <span className="text-gray-500">Patient name:</span>{' '}
          <span className="font-medium">{c.patientName}</span>
        </li>
        <li>
          <span className="text-gray-500">Patient code (ID):</span>{' '}
          <span className="font-medium">{code}</span>
        </li>
        <li>
          <span className="text-gray-500">Location:</span>{' '}
          {c.village}, {c.cell}, {c.sector}, {c.district}
        </li>
        {(variant === 'chw_hc_partial' || variant === 'chw_rich_full') && (
          <>
            <li>
              <span className="text-gray-500">Transfer to HC:</span>{' '}
              {c.chwTransferDateTime ?
                new Date(c.chwTransferDateTime).toLocaleString() :
                '—'}
            </li>
            <li>
              <span className="text-gray-500">Transport (to HC):</span>{' '}
              {c.chwReferralTransport || '—'}
            </li>
          </>
        )}
        {(variant === 'hc_hospital_partial' ||
        variant === 'hc_rich_full') && (
          <>
            <li>
              <span className="text-gray-500">HC received patient:</span>{' '}
              {c.hcPatientReceivedDateTime ?
                new Date(c.hcPatientReceivedDateTime).toLocaleString() :
                '—'}
            </li>
            <li>
              <span className="text-gray-500">Transferred to hospital:</span>{' '}
              {c.hcPatientTransferredToHospitalDateTime ?
                new Date(
                  c.hcPatientTransferredToHospitalDateTime
                ).toLocaleString() :
                '—'}
            </li>
            <li>
              <span className="text-gray-500">Transport to hospital:</span>{' '}
              {c.hcReferralToHospitalTransport || '—'}
            </li>
            <li>
              <span className="text-gray-500">Pre-treatment:</span>{' '}
              {c.hcPreTreatment?.length ?
                c.hcPreTreatment.join(', ') :
                '—'}
            </li>
          </>
        )}
        {(variant === 'hospital_rich_full' ||
        variant === 'hospital_downstream_partial') && (
          <>
            <li>
              <span className="text-gray-500">Hospital received:</span>{' '}
              {c.hospitalReceivedDateTime ?
                new Date(c.hospitalReceivedDateTime).toLocaleString() :
                '—'}
            </li>
            <li>
              <span className="text-gray-500">Discharge:</span>{' '}
              {c.hospitalDischargeDateTime ?
                new Date(c.hospitalDischargeDateTime).toLocaleString() :
                '—'}
            </li>
            <li>
              <span className="text-gray-500">Severe malaria result:</span>{' '}
              {c.severeMalariaTestResult || '—'}
            </li>
            <li>
              <span className="text-gray-500">Outcome:</span>{' '}
              {c.finalOutcomeHospital || '—'}
            </li>
          </>
        )}
        {showSx ?
        <li>
            <span className="text-gray-500">Symptoms:</span>{' '}
            {c.symptoms.length > 0 ?
          c.symptoms.join('; ') :
          'None recorded'}
          </li> :

        <li className="text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5 text-xs">
            Symptoms are <strong>not</strong> included in this notification.
          </li>
        }
        {showMgmt && c.hospitalManagementMedication ?
        <li>
            <span className="text-gray-500">Management / medicines:</span>{' '}
            <span className="font-medium">{c.hospitalManagementMedication}</span>
          </li> :

        variant === 'hospital_downstream_partial' &&
        c.severeMalariaTestResult === 'Positive' ?
        <li className="text-xs text-gray-600 italic">
              Management / medicines omitted (partial notification to HC & CHW).
            </li> :

        null}
      </ul>
    </div>);

}

function recipientLine(v: NotificationPayloadVariant): string {
  switch (v) {
    case 'chw_hc_partial':
      return NOTIFICATION_RECIPIENTS.chwToHc.join(', ');
    case 'chw_rich_full':
      return NOTIFICATION_RECIPIENTS.chwToRich.join(', ');
    case 'hc_hospital_partial':
      return NOTIFICATION_RECIPIENTS.hcToHospital.join(', ');
    case 'hc_rich_full':
      return NOTIFICATION_RECIPIENTS.hcToRich.join(', ');
    case 'hospital_rich_full':
      return NOTIFICATION_RECIPIENTS.hospitalToRich.join(', ');
    case 'hospital_downstream_partial':
      return NOTIFICATION_RECIPIENTS.hospitalDownstream.join(', ');
    default:
      return '';
  }
}
