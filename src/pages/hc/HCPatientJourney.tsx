import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PatientJourneyTimeline } from '../../components/dashboard/PatientJourneyTimeline';
import { useCasesApi } from '../../context/CasesContext';
import { useTranslation } from 'react-i18next';
import { hcPage } from '../../theme/appShell';
import { useFirstLineBasePath } from './useFirstLineBasePath';

export function HCPatientJourney() {
  const { patientCode: patientCodeParam } = useParams();
  const navigate = useNavigate();
  const base = useFirstLineBasePath();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const patientCode = patientCodeParam
    ? decodeURIComponent(patientCodeParam)
    : '';
  const { cases, getCaseByRef, loading, ensureCaseLoaded } = useCasesApi();
  const loadAttempted = useRef<string | null>(null);

  const casesForPatient = useMemo(
    () =>
      cases
        .filter((c) => c.patientCode === patientCode)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [cases, patientCode]
  );

  const latest = casesForPatient[0];
  const c = latest ? getCaseByRef(latest.id) ?? latest : undefined;

  useEffect(() => {
    if (!c?.id) return;
    if (loadAttempted.current === c.id) return;
    loadAttempted.current = c.id;
    void ensureCaseLoaded(c.id);
  }, [c?.id, ensureCaseLoaded]);

  useEffect(() => {
    loadAttempted.current = null;
  }, [patientCode]);

  if (!patientCode) {
    return (
      <div className={hcPage.wrap}>
        <p className="text-sm text-gray-500">
          {en ? 'Invalid link.' : 'Ihuza siyo.'}
        </p>
      </div>
    );
  }

  if (loading && cases.length === 0) {
    return (
      <div className={`${hcPage.wrap} py-12 text-center text-sm text-gray-500`}>
        {en ? 'Loading…' : 'Birakurura…'}
      </div>
    );
  }

  if (!c) {
    return (
      <div className={hcPage.wrap}>
        <p className="text-gray-600">
          {en ? 'No case found for this patient.' : 'Nta dosiye yabonetse.'}
        </p>
        <button
          type="button"
          onClick={() => navigate(`${base}/patients`)}
          className="mt-4 text-sm font-semibold text-[color:var(--role-accent)]"
        >
          {en ? 'Back to patients' : 'Subira ku barwayi'}
        </button>
      </div>
    );
  }

  return (
    <div className={hcPage.wrap}>
      <button
        type="button"
        onClick={() => navigate(`${base}/patients`)}
        className="mb-6 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ChevronLeftIcon size={16} />
        {en ? 'Back to patients' : 'Subira ku barwayi'}
      </button>

      {casesForPatient.length > 1 && (
        <p className="mb-4 text-xs font-medium text-slate-500">
          {en
            ? `${casesForPatient.length} cases on file · showing the most recent journey`
            : `${casesForPatient.length} dosiye · reba iya vuba`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
        <div className="space-y-4 xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--role-accent-soft)] text-sm font-bold text-[color:var(--role-accent)]">
                {c.patientName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-900">
                  {c.patientName}
                </h2>
                <p className="text-xs text-gray-500">
                  {c.id} • <span className="font-mono">{c.patientCode}</span>
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <UserIcon size={14} /> {c.sex}, {c.age}y
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPinIcon size={14} /> {c.village}, {c.sector}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <ClockIcon size={14} />{' '}
                {new Date(c.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                </span>
                {c.symptomCount} {en ? 'symptoms' : 'ibimenyetso'}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`${base}/case/${encodeURIComponent(c.id)}`)
              }
              className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[color:var(--role-accent)] transition hover:bg-slate-50"
            >
              {en ? 'Open clinical file' : 'Fungura dosiye y’ubuvuzi'}
            </button>
          </motion.div>

          <PatientJourneyTimeline c={c} accent="sky" />
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 sm:text-base">
              {en ? 'Activity log' : 'Ibikorwa'}
            </h3>
            <div className="space-y-3">
              {c.timeline.map((t, i) => (
                <div key={`${t.timestamp}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-sky-600" />
                    {i < c.timeline.length - 1 && (
                      <div className="mt-1 flex-1 w-0.5 bg-sky-200" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-gray-900">
                      {t.event}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.actor} • {t.role}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
