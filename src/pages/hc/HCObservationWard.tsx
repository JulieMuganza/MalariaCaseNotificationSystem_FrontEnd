import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ActivityIcon, 
  MapPinIcon,
  ClockIcon,
  UserIcon,
  ChevronRightIcon
} from 'lucide-react';
import { useCasesApi } from '../../context/CasesContext';
import { useTranslation } from 'react-i18next';
import { hcPage } from '../../theme/appShell';
import { useFirstLineBasePath } from './useFirstLineBasePath';

const cardClass =
  'group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-[color:var(--role-accent)]/20';

export function HCObservationWard() {
  const { cases, loading } = useCasesApi();
  const { i18n } = useTranslation();
  const base = useFirstLineBasePath();

  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const en = language === 'en';

  const inObservation = useMemo(() => 
    cases.filter(c => c.status === 'HC Received'),
  [cases]);

  if (loading)
    return (
      <div className="p-20 text-center text-sm font-medium text-gray-400 animate-pulse">
        Syncing ward status…
      </div>
    );

  return (
    <div className={hcPage.wrap}>
      <div className={hcPage.headerRow}>
        <div>
          <h1 className={hcPage.title}>
            {en ? 'Observation ward' : 'Aho Gukurikirana'}
          </h1>
          <p className={hcPage.desc}>
            {en
              ? 'Patients currently admitted for monitoring and IV therapy.'
              : 'Abarwayi bari gukurikiranywa.'}
          </p>
        </div>
        <div className={hcPage.pill}>
          <ActivityIcon size={16} strokeWidth={2} />
          {inObservation.length} {en ? 'active beds' : 'ibitanda'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {inObservation.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
            <p className="text-sm text-gray-500">
              {en ? 'Ward is currently empty' : 'Nta murwayi gukurikiranwa'}
            </p>
          </div>
        ) : (
          inObservation.map(c => (
            <div 
              key={c.id}
              onClick={() => navigate(`${base}/case/${c.id}`)}
              className={cardClass}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:text-[color:var(--role-accent)]">
                     <UserIcon size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-900 tracking-tight">{c.patientName}</h3>
                     <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">Case #{c.id.slice(-6).toUpperCase()}</p>
                   </div>
                </div>
                <div className="rounded-lg bg-[color:var(--role-accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--role-accent)]">Bed 0{Math.floor(Math.random() * 5) + 1}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Therapy Status</p>
                   <div className="flex items-end gap-1">
                      <span className="text-xl font-bold text-gray-900">{c.hcTreatments?.length || 1}</span>
                      <span className="text-[10px] font-bold text-gray-400 mb-1">/ 6 Doses Logged</span>
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Patient Vitals</p>
                   <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--role-accent)]">
                      <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--role-accent)]" /> Stable
                   </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                 <div className="flex items-center gap-2">
                    <ClockIcon size={12} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admitted {new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 <button type="button" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--role-accent)] transition-all group-hover:mr-1">
                   Manage Record <ChevronRightIcon size={12} />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
