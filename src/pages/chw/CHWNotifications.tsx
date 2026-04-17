import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/shared/EmptyState';
import { BellIcon, CheckIcon } from 'lucide-react';

export function CHWNotifications() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const { notifications, markNotificationRead } = useAuth();
  
  const notifs = [...notifications]
    .filter((n) => n.targetRole === 'CHW')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const styleMap: Record<string, { border: string, bg: string, text: string, icon: string, accent: string }> = {
    alert: { border: 'border-red-100', bg: 'bg-red-50/50', text: 'text-red-700', icon: 'text-red-500', accent: 'bg-red-600' },
    warning: { border: 'border-amber-100', bg: 'bg-amber-50/50', text: 'text-amber-700', icon: 'text-amber-500', accent: 'bg-amber-600' },
    info: { border: 'border-blue-100', bg: 'bg-blue-50/50', text: 'text-blue-700', icon: 'text-blue-500', accent: 'bg-blue-600' },
    success: { border: 'border-emerald-100', bg: 'bg-emerald-50/50', text: 'text-emerald-700', icon: 'text-emerald-500', accent: 'bg-emerald-600' }
  };

  return (
    <div className="px-4 py-4 space-y-5 lg:px-0 lg:py-0">
      {/* Consistent Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            {en ? 'Notifications' : 'Amakuru'}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {en
              ? 'Real-time alerts for patient care pathways'
              : 'Amakuru igihe umurwayi anyura mu nzira y’ubuvuzi.'}
          </p>
        </div>
        <button className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-[10px] font-black text-gray-500 hover:bg-gray-50 uppercase tracking-widest transition-all shadow-sm">
            <CheckIcon size={12} />
            {en ? 'Mark All' : 'Byose'}
        </button>
      </div>

      {notifs.length === 0 ? (
        <div className="py-20 lg:py-32">
            <EmptyState
            icon={<BellIcon size={40} className="text-gray-200" />}
            title={en ? "Inbox Clear" : "Nta makuru"}
            description={en ? "You'll see alerts from Health Centers here" : "Nta makuru mashya ufite."} 
            />
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n, i) => {
            const s = styleMap[n.type] || styleMap.info;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => void markNotificationRead(n.id)}
                className={`group relative flex w-full gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left transition-all hover:border-emerald-200 hover:shadow-md active:scale-[0.99] ${!n.read ? 'ring-1 ring-emerald-500/20 shadow-sm' : ''}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${s.border} ${s.bg} ${s.icon} transition-colors group-hover:scale-110`}>
                  <BellIcon size={18} strokeWidth={2.5} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm tracking-tight ${!n.read ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter shrink-0 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-500 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  
                  {!n.read && (
                    <div className="mt-2 flex items-center gap-1.5">
                       <span className={`h-1.5 w-1.5 rounded-full ${s.accent}`} />
                       <span className={`text-[9px] font-black uppercase tracking-widest ${s.text}`}>{en ? 'Action Required' : 'Gishya'}</span>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
