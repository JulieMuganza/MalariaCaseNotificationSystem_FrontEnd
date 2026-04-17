import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  StethoscopeIcon,
  ChevronRightIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { MalariaCase } from '../../types/domain';
import { toast } from 'sonner';
import { hcPage } from '../../theme/appShell';
import { useHospitalBasePath } from './useHospitalBasePath';
import { districtHospitalInboxIncludes } from './caseHelpers';

const cardClass =
  'group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[color:var(--role-accent)]/25';

type QueueTab = 'awaiting' | 'active';

export function HospitalClinicalManagement() {
  const location = useLocation();
  const { user } = useAuth();
  const { cases, loading, patchCase } = useCasesApi();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const base = useHospitalBasePath();
  const en = language === 'en';
  const isReferral = user?.role === 'Referral Hospital';
  const actorRole = isReferral ? 'Referral Hospital' : 'District Hospital';

  const [tab, setTab] = useState<QueueTab>('awaiting');

  useEffect(() => {
    const t = (location.state as { tab?: string } | null)?.tab;
    if (t === 'active' || t === 'awaiting') setTab(t);
  }, [location.state]);

  const scoped = useMemo(() => {
    if (isReferral) {
      return cases.filter(
        (c) =>
          Boolean(c.transferredToReferralHospital) ||
          Boolean(c.dhTransferredToReferralHospitalDateTime) ||
          Boolean(c.referralHospitalReceivedDateTime)
      );
    }
    return cases.filter(districtHospitalInboxIncludes);
  }, [cases, isReferral]);

  const awaiting = useMemo(
    () =>
      scoped.filter((c) =>
        isReferral ? !c.referralHospitalReceivedDateTime : !c.hospitalReceivedDateTime
      ),
    [scoped, isReferral]
  );

  /** Like HC queues: hide completed outcomes and transfers — nothing left to do at DH. */
  const active = useMemo(() => {
    const done = new Set(['Discharged', 'Deceased', 'Resolved']);
    return scoped.filter(
      (c) =>
        Boolean(
          isReferral ? c.referralHospitalReceivedDateTime : c.hospitalReceivedDateTime
        ) &&
        !done.has(c.status) &&
        (isReferral || !c.transferredToReferralHospital)
    );
  }, [scoped, isReferral]);

  const list = tab === 'awaiting' ? awaiting : active;

  const initialLoad = loading && cases.length === 0;

  if (initialLoad) {
    return (
      <div className="p-20 text-center text-sm font-medium text-gray-400 animate-pulse">
        {en ? 'Loading cases…' : 'Birakurura…'}
      </div>
    );
  }

  return (
    <div className={hcPage.wrap}>
      <div className={hcPage.headerRow}>
        <div>
          <h1 className={hcPage.title}>
            {en ? 'Clinical management' : 'Ubuvuzi'}
          </h1>
          <p className={hcPage.desc}>
            {en
              ? isReferral
                ? 'Receive patients transferred from district hospitals and continue specialized care.'
                : 'Receive referred patients and continue care at the district hospital.'
              : isReferral
                ? 'Akira abarwayi boherejwe n\'ibitaro by\'akarere ukomeze ubuvuzi bwo hejuru.'
                : 'Akira no gukomeza ubuvuzi ku bitaro by\'akarere.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={hcPage.pill}>
            <StethoscopeIcon size={16} strokeWidth={2} />
            {awaiting.length} {en ? 'awaiting triage' : 'bitegereje'}
          </div>
          <div className={hcPage.pill}>
            <CheckCircleIcon size={16} strokeWidth={2} />
            {active.length}{' '}
            {en ?
              isReferral ?
                'active at referral hospital'
              : 'active at district hospital'
            : 'buri ku bitaro'}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 pb-0">
        <button
          type="button"
          onClick={() => setTab('awaiting')}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === 'awaiting'
              ? 'border-b-2 border-[color:var(--role-accent)] text-[color:var(--role-accent)]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {en ? 'Awaiting triage' : 'Bategereje'}
        </button>
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === 'active'
              ? 'border-b-2 border-[color:var(--role-accent)] text-[color:var(--role-accent)]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {en ?
            isReferral ?
              'Active at referral hospital'
            : 'Active at district hospital'
          : 'Buri ku bitaro'}
        </button>
      </div>

      {loading && cases.length > 0 && (
        <p className="text-xs font-medium text-gray-400">
          {en ? 'Refreshing…' : 'Bivugururwa…'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {list.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
            <p className="text-sm text-gray-500">
              {tab === 'awaiting'
                ? en
                  ? 'No cases awaiting triage'
                  : 'Nta dosiye'
                : en
                  ? isReferral
                    ? 'No patients received at the referral hospital yet'
                    : 'No patients received at the district hospital yet'
                  : 'Nta murwayi yakiriwe'}
            </p>
            {tab === 'active' && awaiting.length > 0 && (
              <button
                type="button"
                onClick={() => setTab('awaiting')}
                className="mt-4 text-sm font-medium text-[color:var(--role-accent)] hover:underline"
              >
                {en ? 'Switch to awaiting triage' : 'Hindura urutonde'}
              </button>
            )}
          </div>
        ) : (
          list.map((c: MalariaCase) => (
            <div key={c.id} className={cardClass}>
              <div className="flex items-center gap-6">
                <div
                  role="presentation"
                  onClick={() => navigate(`${base}/case/${c.id}`)}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:bg-[color:var(--role-accent-soft)] group-hover:text-[color:var(--role-accent)]"
                >
                  <StethoscopeIcon size={24} />
                </div>

                <div
                  role="presentation"
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`${base}/case/${c.id}`)}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-gray-900 truncate tracking-tight">
                      {c.patientName}
                    </h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {c.age}y • {c.sex[0].toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon size={10} /> {c.village}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon size={10} />{' '}
                      {new Date(c.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {tab === 'awaiting' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await patchCase(c.id, {
                            ...(isReferral ?
                              {
                                referralHospitalReceivedDateTime:
                                  new Date().toISOString(),
                              }
                            : {
                                hospitalReceivedDateTime:
                                  new Date().toISOString(),
                              }),
                            status:
                              c.status === 'Escalated' ? 'Admitted' : c.status,
                            timelineEvent: {
                              event:
                                isReferral ?
                                  'Patient received at referral hospital'
                                : 'Patient received at district hospital',
                              actorName: user?.name ?? actorRole,
                              actorRole,
                            },
                          });
                          toast.success(en ? 'Patient received' : 'Yakirijwe');
                          setTab('active');
                        } catch {
                          toast.error('Reception failed');
                        }
                      }}
                      className="hidden rounded-xl bg-[color:var(--role-accent)] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 sm:flex"
                    >
                      <CheckCircleIcon size={14} className="mr-2 opacity-90" />
                      {en ? 'Received' : 'Yakira'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`${base}/case/${c.id}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-gray-50 text-gray-400 transition-all group-hover:border-[color:var(--role-accent)]/20 group-hover:text-[color:var(--role-accent)] active:scale-95"
                  >
                    <ChevronRightIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
