import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { LanguageToggle } from '../components/shared/LanguageToggle';
import {
  HeartPulseIcon,
  BuildingIcon,
  Building2Icon,
  HospitalIcon,
  LandmarkIcon,
  ShieldCheckIcon,
  ActivityIcon,
  MapPinnedIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

const roles = [
  {
    key: 'CHW' as const,
    i18n: 'chw' as const,
    icon: HeartPulseIcon,
    path: '/chw',
    color: 'from-teal-700 to-teal-600',
    hoverColor: 'hover:shadow-teal-200',
  },
  {
    key: 'Health Center' as const,
    i18n: 'hc' as const,
    icon: BuildingIcon,
    path: '/hc',
    color: 'from-blue-600 to-blue-500',
    hoverColor: 'hover:shadow-blue-200',
  },
  {
    key: 'Local Clinic' as const,
    i18n: 'lc' as const,
    icon: Building2Icon,
    path: '/lc',
    color: 'from-sky-600 to-sky-500',
    hoverColor: 'hover:shadow-sky-200',
  },
  {
    key: 'District Hospital' as const,
    i18n: 'dh' as const,
    icon: HospitalIcon,
    path: '/hospital',
    color: 'from-purple-600 to-purple-500',
    hoverColor: 'hover:shadow-purple-200',
  },
  {
    key: 'Referral Hospital' as const,
    i18n: 'rh' as const,
    icon: LandmarkIcon,
    path: '/referral-hospital',
    color: 'from-indigo-600 to-indigo-500',
    hoverColor: 'hover:shadow-indigo-200',
  },
  {
    key: 'RICH' as const,
    i18n: 'rich' as const,
    icon: MapPinnedIcon,
    path: '/rich',
    color: 'from-indigo-700 to-indigo-600',
    hoverColor: 'hover:shadow-indigo-200',
  },
  {
    key: 'PFTH' as const,
    i18n: 'pfth' as const,
    icon: MapPinnedIcon,
    path: '/pfth',
    color: 'from-teal-800 to-teal-700',
    hoverColor: 'hover:shadow-teal-200',
  },
  {
    key: 'SFR' as const,
    i18n: 'sfr' as const,
    icon: MapPinnedIcon,
    path: '/sfr',
    color: 'from-violet-700 to-violet-600',
    hoverColor: 'hover:shadow-violet-200',
  },
  {
    key: 'Admin' as const,
    i18n: 'admin' as const,
    icon: ShieldCheckIcon,
    path: '/admin',
    color: 'from-gray-800 to-gray-700',
    hoverColor: 'hover:shadow-gray-300',
  },
];

export function RoleSelector() {
  const navigate = useNavigate();
  const { setRole } = useApp();
  const { t, i18n } = useTranslation();

  const cards = useMemo(
    () =>
      roles.map((role) => ({
        ...role,
        label: t(`role.${role.i18n}.label`),
        subtitle: t(`role.${role.i18n}.subtitle`),
        description: t(`role.${role.i18n}.description`),
      })),
    [t, i18n.language]
  );

  function handleSelect(role: (typeof roles)[number]) {
    setRole(role.key);
    navigate(role.path);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 flex flex-col">
      <header className="bg-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <ActivityIcon size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">{t('role.selector.header.title')}</h1>
              <p className="text-xs text-teal-200">{t('role.selector.header.subtitle')}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('role.selector.main.title')}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">{t('role.selector.main.subtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cards.map((role, i) => (
              <motion.button
                key={role.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => handleSelect(roles[i])}
                className={`group relative bg-white rounded-2xl border border-gray-200 p-6 text-left transition-all duration-200 hover:shadow-xl ${role.hoverColor} hover:border-gray-300 hover:-translate-y-0.5`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <role.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{role.label}</h3>
                <p className="text-xs font-medium text-teal-700 mb-2">{role.subtitle}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors text-gray-400">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M5 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">{t('role.selector.footer')}</p>
        </div>
      </main>
    </div>
  );
}
