import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';
import { EmptyState } from '../../components/shared/EmptyState';

export function CHWPatients() {
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { cases } = useCasesApi();
  const [search, setSearch] = useState('');

  // Group cases by patientCode to get unique patients
  const patientsMap = new Map();
  cases.forEach((c) => {
    if (!patientsMap.has(c.patientCode)) {
      patientsMap.set(c.patientCode, {
        name: c.patientName,
        code: c.patientCode,
        sex: c.sex,
        district: c.district,
        sector: c.sector,
        lastSeen: c.createdAt,
        caseCount: 1,
      });
    } else {
      const p = patientsMap.get(c.patientCode);
      p.caseCount += 1;
      if (new Date(c.createdAt) > new Date(p.lastSeen)) {
        p.lastSeen = c.createdAt;
      }
    }
  });

  const patientsList = Array.from(patientsMap.values());
  const filtered = patientsList.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 py-4 space-y-6 lg:px-0 lg:py-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
          {language === 'en' ? 'Patients Directory' : 'Urutonde rw\'Abarwayi'}
        </h2>
        <p className="text-xs text-gray-500">
          {language === 'en' ? 'Manage and view patient information' : 'Gucunga no kureba amakuru y\'abarwayi'}
        </p>
      </div>

      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={language === 'en' ? 'Search patients...' : 'Shakisha abarwayi...'}
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No patients found" description="Try a different search term" />
          </div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal-200 transition-all hover:shadow-md group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-lg border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  {p.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{p.name}</h3>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">{p.code}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Location</p>
                  <p className="text-xs text-gray-700 font-medium truncate">{p.district}, {p.sector}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Cases</p>
                  <p className="text-xs text-gray-700 font-medium">{p.caseCount} reports</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Sex</p>
                  <p className="text-xs text-gray-700 font-medium">{p.sex}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Last Activity</p>
                  <p className="text-xs text-gray-700 font-medium">{new Date(p.lastSeen).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-50 flex justify-end">
                <button className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  View Medical History 
                  <motion.span animate={{ x: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
