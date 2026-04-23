import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { EmptyState } from '../../components/shared/EmptyState';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';
import type { CaseStatus } from '../../types/domain';

type ChwCaseFilter = CaseStatus | 'All' | 'Non-severe (closed at CHW)';

function isNonSevereClosedAtChw(c: {
  status: string;
  symptomCount?: number;
  hcPatientReceivedDateTime?: string;
  hcPatientTransferredToHospitalDateTime?: string;
}) {
  return (
    c.status === 'Resolved' &&
    (c.symptomCount ?? 0) === 0 &&
    !c.hcPatientReceivedDateTime &&
    !c.hcPatientTransferredToHospitalDateTime
  );
}

export function CHWCases() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const { cases: myCases } = useCasesApi();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ChwCaseFilter>('All');
  const statusLabels: Record<ChwCaseFilter, string> = {
    All: en ? 'All' : 'Byose',
    'Non-severe (closed at CHW)': en
      ? 'Non-severe (closed at CHW)'
      : 'Si ikomeye (byafunzwe kuri CHW)',
    Pending: en ? 'Pending' : 'Bitegereje',
    Referred: en ? 'Referred' : 'Byoherejwe',
    'HC Received': en ? 'HC received' : 'Byakiriwe ku kigonderabuzima',
    Resolved: en ? 'Resolved' : 'Yasezerewe',
    Deceased: en ? 'Deceased' : 'Yitabye Imana',
  };
  const filtered = myCases.
  filter((c) => {
    if (filter === 'All') return true;
    if (filter === 'Non-severe (closed at CHW)') {
      return isNonSevereClosedAtChw(c);
    }
    return c.status === filter;
  }).
  filter(
    (c) =>
    !search ||
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );
  const statuses: ChwCaseFilter[] = [
  'All',
  'Non-severe (closed at CHW)',
  'Pending',
  'Referred',
  'HC Received',
  'Resolved',
  'Deceased'];

  return (
    <div className="px-4 py-4 space-y-4 lg:px-0 lg:py-0 lg:space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
          {language === 'en' ? 'Case History' : 'Amateka y\'Ibibazo'}
        </h2>
        <p className="text-xs text-gray-500">
          {language === 'en' ? 'Review and track malaria case reports' : 'Gusubiramo no gukurikirana raporo z\'ibibazo'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
          language === 'en' ? 'Search cases...' : 'Shakisha ibibazo...'
          }
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none" />
        
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:flex-wrap lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0">
        {statuses.map((s) =>
        <button
          key={s}
          onClick={() => setFilter(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          
            {statusLabels[s]}
          </button>
        )}
      </div>

      {/* Cases list */}
      <div className="space-y-2">
        {filtered.length === 0 ?
        <EmptyState
          title={en ? 'No cases found' : 'Nta bibazo byabonetse'}
          description={en ? 'Try adjusting your search or filter' : 'Hindura uburyo bwo gushakisha cyangwa gushungura'} /> :


        filtered.map((c, i) =>
        <motion.button
          key={c.id}
          initial={{
            opacity: 0,
            y: 8
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: i * 0.03
          }}
          onClick={() => navigate(`/chw/cases/${c.id}`)}
          className="w-full bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 text-left hover:border-gray-200 transition-colors">
          
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                {c.patientName.
            split(' ').
            map((n) => n[0]).
            join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {c.patientName}
                </p>
                <p className="text-xs text-gray-500">
                  {c.id} •{' '}
                  <span className="font-mono">{c.patientCode}</span> •{' '}
                  {c.district}, {c.sector}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
                {isNonSevereClosedAtChw(c) && (
                  <p className="mt-1 text-[11px] font-medium text-emerald-700">
                    {en
                      ? 'Non-severe malaria: case closed at CHW, no transfer made.'
                      : 'Malariya idakomeye: dosiye yafunzwe kuri CHW, nta kohereza kwabaye.'}
                  </p>
                )}
              </div>
              <StatusBadge status={c.status} />
            </motion.button>
        )
        }
      </div>
    </div>);

}