import React, { useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboardIcon,
  FileBarChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BedDoubleIcon,
  BellIcon,
  MessageSquareIcon,
  UserIcon,
  StethoscopeIcon,
  UsersIcon,
  FolderOpenIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoutSidebarButton } from '../../components/auth/LogoutSidebarButton';
import { NotificationBell } from '../../components/shared/NotificationBell';
import { MessagesNavButton } from '../../components/shared/MessagesNavButton';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { useHospitalBasePath } from './useHospitalBasePath';
import {
  shell,
  sidebarNavClasses,
  sidebarIconClasses,
} from '../../theme/appShell';

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 80;

export function HospitalLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, messageUnreadCount, unreadCount } = useAuth();
  const base = useHospitalBasePath();
  const facilityLabel =
    user?.role === 'Referral Hospital'
      ? t('hospital.layout.facility.referral')
      : t('hospital.layout.facility.district');
  const isReferral = user?.role === 'Referral Hospital';
  const clinicalActive =
    (location.pathname.startsWith(`${base}/triage`) ||
      location.pathname.startsWith(`${base}/case/`) ||
      location.pathname.startsWith(`${base}/checklist/`) ||
      location.pathname.startsWith(`${base}/outcome/`)) &&
    !location.pathname.startsWith(`${base}/cases`);
  const casesActive =
    location.pathname === `${base}/cases` || location.pathname.startsWith(`${base}/cases/`);
  const patientsActive = location.pathname.startsWith(`${base}/patients`);

  const navItems = useMemo(() => {
    return [
      {
        to: base,
        icon: LayoutDashboardIcon,
        label: t('hospital.layout.nav.dashboard'),
        end: true,
        badge: 0,
      },
      {
        to: `${base}/triage`,
        icon: StethoscopeIcon,
        label: t('hospital.layout.nav.clinicalManagement'),
        end: false,
        isActive: clinicalActive,
        badge: 0,
      },
      {
        to: `${base}/cases`,
        icon: FolderOpenIcon,
        label: t('hospital.layout.nav.allCases'),
        end: false,
        isActive: casesActive,
        badge: 0,
      },
      {
        to: `${base}/patients`,
        icon: UsersIcon,
        label: t('hospital.layout.nav.patients'),
        end: false,
        isActive: patientsActive,
        badge: 0,
      },
      {
        to: `${base}/notifications`,
        icon: BellIcon,
        label: t('hospital.layout.nav.notifications'),
        end: false,
        badge: unreadCount,
      },
      {
        to: `${base}/messages`,
        icon: MessageSquareIcon,
        label: t('hospital.layout.nav.messages'),
        end: false,
        badge: messageUnreadCount,
      },
      {
        to: `${base}/reports`,
        icon: FileBarChartIcon,
        label: t('hospital.layout.nav.reports'),
        end: false,
        badge: 0,
      },
    ] as const;
  }, [
    base,
    t,
    i18n.language,
    clinicalActive,
    casesActive,
    patientsActive,
    unreadCount,
    messageUnreadCount,
  ]);
  const currentSidebarW = isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  return (
    <div
      data-app-role={isReferral ? 'referral' : 'district'}
      className={shell.page}
    >
      <aside className={shell.aside} style={{ width: currentSidebarW }}>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={shell.collapseBtn}
        >
          {isSidebarCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
        </button>

        <div className="flex h-[88px] shrink-0 items-center gap-3 border-b border-[var(--app-border)] px-3">
          <div className={shell.logoIcon}>
            <BedDoubleIcon size={22} strokeWidth={2} />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
              <p className="truncate text-base font-semibold leading-tight text-slate-900">
                {t('hospital.layout.brand.title')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">{facilityLabel}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                sidebarNavClasses(
                  'isActive' in item && item.isActive !== undefined ? item.isActive : isActive
                )
              }
            >
              {({ isActive }) => {
                const on =
                  'isActive' in item && item.isActive !== undefined ? item.isActive : isActive;
                const b = 'badge' in item ? item.badge : 0;
                return (
                  <>
                    <span className="relative inline-flex shrink-0">
                      <item.icon
                        size={22}
                        strokeWidth={2.25}
                        className={sidebarIconClasses(on)}
                      />
                      {!isSidebarCollapsed && b > 0 && (
                        <span className="absolute -right-1.5 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                          {b > 99 ? '99+' : b}
                        </span>
                      )}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="min-w-0 flex-1 truncate transition-opacity duration-300">
                        {item.label}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        className="flex min-h-screen flex-col transition-all duration-300 lg:pl-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${currentSidebarW}px` } as React.CSSProperties}
      >
        <header className={`${shell.header} backdrop-blur-sm`}>
          <div className="flex h-[88px] items-center gap-4 px-4 sm:px-6">
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <LanguageToggle variant="light" />
              <MessagesNavButton
                to={`${base}/messages`}
                unreadCount={messageUnreadCount}
                variant="light"
              />
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm transition hover:bg-slate-50">
                <NotificationBell variant="light" indicator="count" />
              </div>
              <div className="h-6 w-px bg-[var(--app-border)]" />
              <div className="relative">
                <div
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex cursor-pointer select-none items-center gap-2.5 rounded-full border border-[var(--app-border)] bg-slate-50 py-1.5 pr-3 pl-1.5 shadow-sm transition hover:bg-slate-100 active:scale-95"
                >
                  <div className={shell.profileAvatar}>
                    <span className="text-[11px] font-bold tracking-wide">
                      {(user?.name ?? '?').split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col pt-0.5 min-w-[90px]">
                    <span className="truncate text-sm font-semibold leading-none text-slate-900">
                      {user?.name ?? t('hospital.layout.profile.fallbackName')}
                    </span>
                    <span className="mt-0.5 text-xs font-medium leading-[14px] text-slate-500">
                      {facilityLabel}
                    </span>
                  </div>
                  <ChevronDownIcon size={16} className="text-slate-400" strokeWidth={2.5} />
                </div>
                {isProfileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate(`${base}/profile`);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                    >
                      <UserIcon size={18} className="text-slate-500" />
                      {t('profile')}
                    </button>
                    <LogoutSidebarButton
                      label={t('logout')}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#EF4444] transition hover:bg-[#FEF2F2]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={shell.main}>
          <div className={shell.mainInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
