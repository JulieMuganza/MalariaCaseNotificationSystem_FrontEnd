import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  StethoscopeIcon,
  ChevronRightIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { MalariaCase } from '../../types/domain';
import { toast } from 'sonner';
import { hcPage } from '../../theme/appShell';
import { useFirstLineBasePath } from './useFirstLineBasePath';

const cardClass =
  'group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[color:var(--role-accent)]/25';

type QueueTab = 'pending' | 'at_hc';

export function HCTriageQueue() {
  const location = useLocation();
  const base = useFirstLineBasePath();
  const { user } = useAuth();
  const { cases, loading, patchCase } = useCasesApi();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const en = language === 'en';

  const [tab, setTab] = useState<QueueTab>('pending');

  useEffect(() => {
    const t = (location.state as { tab?: string } | null)?.tab;
    if (t === 'at_hc' || t === 'pending') setTab(t);
  }, [location.state]);

  const triageNeeded = useMemo(
    () => cases.filter((c) => c.status === 'Pending' || c.status === 'Referred'),
    [cases]
  );

  const atHc = useMemo(
    () => cases.filter((c) => c.status === 'HC Received'),
    [cases]
  );

  const list = tab === 'pending' ? triageNeeded : atHc;

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
              ? 'Triage new referrals and continue care for patients already received at the health center.'
              : 'Gusuzuma no gukomeza ubuvuzi.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={hcPage.pill}>
            <UserIcon size={16} strokeWidth={2} />
            {triageNeeded.length} {en ? 'awaiting' : 'bitegereje'}
          </div>
          <div className={hcPage.pill}>
            <StethoscopeIcon size={16} strokeWidth={2} />
            {atHc.length} {en ? 'at HC' : 'ku kigo'}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 pb-0">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === 'pending'
              ? 'border-b-2 border-[color:var(--role-accent)] text-[color:var(--role-accent)]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {en ? 'Awaiting triage' : 'Bategereje'}
        </button>
        <button
          type="button"
          onClick={() => setTab('at_hc')}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === 'at_hc'
              ? 'border-b-2 border-[color:var(--role-accent)] text-[color:var(--role-accent)]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {en ? 'Active at health center' : 'Ku kigo'}
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
              {tab === 'pending'
                ? en
                  ? 'No cases awaiting triage'
                  : 'Nta muntu uri ku rutonde'
                : en
                  ? 'No patients marked as received at this health center'
                  : 'Nta murwayi yakiriwe'}
            </p>
            {tab === 'at_hc' && triageNeeded.length > 0 && (
              <button
                type="button"
                onClick={() => setTab('pending')}
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
                      {c.age}Y • {c.sex[0].toUpperCase()}
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
                  {tab === 'pending' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await patchCase(c.id, {
                            status: 'HC Received',
                            hcPatientReceivedDateTime: new Date().toISOString(),
                            timelineEvent: {
                              event: 'Patient received at Health Center',
                              actorName: user?.name ?? 'Health Center',
                              actorRole: 'Health Center',
                            },
                          });
                          toast.success(en ? 'Encounter started' : 'Yakirijwe');
                        } catch {
                          toast.error('Reception failed');
                        }
                      }}
                      className="hidden rounded-xl bg-[color:var(--role-accent)] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 sm:flex"
                    >
                      <CheckCircleIcon size={14} className="mr-2 opacity-90" />
                      {en ? 'Receive' : 'Yakira'}
                    </button>
                  )}
                  <button
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
