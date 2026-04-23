import React from 'react';
import { BarChart3Icon, TrendingUpIcon, ActivityIcon, UsersIcon, DownloadIcon, FileTextIcon, ShieldAlertIcon, HeartOffIcon, CheckCircle2Icon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCasesApi } from '../../context/CasesContext';

export function CHWReports() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const { cases } = useCasesApi();
  const en = language === 'en';

  const totalCases = cases.length;
  const resolved = cases.filter(c => c.status === 'Resolved').length;
  const referred = cases.filter(c => c.status === 'Referred' || c.status === 'HC Received').length;
  const pending = cases.filter(c => c.status === 'Pending').length;

  const resolutionRate = totalCases > 0 ? Math.round((resolved / totalCases) * 100) : 0;

  return (
    <div className="px-4 py-4 space-y-6 lg:px-0 lg:py-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
          {language === 'en' ? 'Performance & Analytics' : 'Ubusesengure n\'Ingeranyamibare'}
        </h2>
        <p className="text-xs text-gray-500">
          {language === 'en' ? 'Overview of your case management activities' : 'Ikusanyirizo ry\'ibikorwa byawe'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={en ? 'Total cases' : 'Ibibazo byose'} 
          value={totalCases} 
          icon={<BarChart3Icon size={20} />} 
          color="teal" 
        />
        <StatCard 
          label={en ? 'Resolution rate' : 'Igipimo cyakemutse'} 
          value={`${resolutionRate}%`} 
          icon={<TrendingUpIcon size={20} />} 
          color="blue" 
        />
        <StatCard 
          label={en ? 'Active cases' : 'Ibibazo bikiriho'} 
          value={pending + referred} 
          icon={<ActivityIcon size={20} />} 
          color="amber" 
        />
        <StatCard 
          label={en ? 'Total patients' : 'Abarwayi bose'} 
          value={new Set(cases.map(c => c.patientCode)).size} 
          icon={<UsersIcon size={20} />} 
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6">{en ? 'Case Status Distribution' : 'Ikwegereze ry\'imanza'}</h3>
          <div className="space-y-4">
            <StatusProgressBar label={en ? 'Resolved' : 'Yasezerewe'} count={resolved} total={totalCases} color="bg-teal-500" />
            <StatusProgressBar label={en ? 'Referred' : 'Byoherejwe'} count={referred} total={totalCases} color="bg-amber-500" />
            <StatusProgressBar label={en ? 'Pending' : 'Bitegereje'} count={pending} total={totalCases} color="bg-gray-400" />
          </div>
        </div>

        {/* Exports & Downloads */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">{en ? 'Exports & Downloads' : 'Byoherejwe & Ibisohoka'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ExportButton 
              label={en ? 'All Patients' : 'Abarwayi bose'} 
              icon={<UsersIcon size={16} />} 
              onClick={() => {}} 
            />
            <ExportButton 
              label={en ? 'Active Cases' : 'Ibibazo biriho'} 
              icon={<ShieldAlertIcon size={16} />} 
              onClick={() => {}} 
            />
            <ExportButton 
              label={en ? 'Discharged Cases' : 'Ibibazo byasezerewe'} 
              icon={<CheckCircle2Icon size={16} />} 
              onClick={() => {}} 
            />
            <ExportButton 
              label={en ? 'Mortality Report' : 'Raporo y\'impfu'} 
              icon={<HeartOffIcon size={16} />} 
              variant="danger"
              onClick={() => {}} 
            />
          </div>
          <p className="mt-4 text-[10px] text-gray-400 italic">
            * {en ? 'All reports are exported in .CSV format' : 'Raporo zose zisohoka muri .CSV'}
          </p>
        </div>
      </div>
    </div>
  );
}


function ExportButton({ label, icon, onClick, variant = 'default' }: { label: string; icon: React.ReactNode; onClick: () => void; variant?: 'default' | 'danger' }) {
  const baseStyles = "flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all active:scale-[0.98]";
  const variants = {
    default: "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200",
    danger: "bg-red-50 border-red-100 text-red-700 hover:bg-red-100 hover:border-red-200"
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
      <div className={`p-1.5 rounded-lg ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-white shadow-sm text-gray-400'}`}>
        {icon}
      </div>
      <span className="flex-1 text-left">{label}</span>
      <DownloadIcon size={14} className="opacity-40" />
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    const colorClasses: Record<string, string> = {
        teal: 'bg-teal-50 text-teal-700 border-teal-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${colorClasses[color]}`}>
                {icon}
            </div>
            <p className="text-base font-bold text-gray-900">{value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{label}</p>
        </div>
    );
}

function StatusProgressBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-900">{count}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color}`} 
                />
            </div>
        </div>
    );
}
