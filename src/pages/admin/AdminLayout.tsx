import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboardIcon,
  MapIcon,
  ShieldAlertIcon,
  GitCompareIcon,
  CalendarIcon,
  UsersIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoutSidebarButton } from '../../components/auth/LogoutSidebarButton';
import { NotificationBell } from '../../components/shared/NotificationBell';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import {
  shell,
  sidebarNavClassesAdmin,
  sidebarIconClasses,
} from '../../theme/appShell';

const SIDEBAR_W = 240;
const SIDEBAR_COLLAPSED_W = 80;

export function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentSidebarW = isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const navItems = useMemo(
    () =>
      [
        { to: '/admin', icon: LayoutDashboardIcon, label: t('admin.layout.nav.dashboard'), end: true },
        { to: '/admin/map', icon: MapIcon, label: t('admin.layout.nav.mapView'), end: false },
        { to: '/admin/risk-factors', icon: ShieldAlertIcon, label: t('admin.layout.nav.riskFactors'), end: false },
        { to: '/admin/notification-model', icon: GitCompareIcon, label: t('admin.layout.nav.eidsrComparison'), end: false },
        { to: '/admin/timeline', icon: CalendarIcon, label: t('admin.layout.nav.timeline'), end: false },
        { to: '/admin/users', icon: UsersIcon, label: t('admin.layout.nav.userManagement'), end: false },
        { to: '/admin/export', icon: DownloadIcon, label: t('admin.layout.nav.dataExport'), end: false },
      ] as const,
    [t, i18n.language]
  );

  useEffect(() => {
    if (!isProfileOpen) return;

    function onDocumentMouseDown(e: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function onDocumentKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsProfileOpen(false);
    }

    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <div data-app-role="admin" className={shell.page}>
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
            <ShieldCheckIcon size={22} strokeWidth={2} />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
              <p className="truncate text-base font-bold leading-tight text-[var(--app-text)]">
                {t('admin.layout.brand.title')}
              </p>
              <p className={shell.roleSubtitle}>{t('admin.layout.brand.subtitle')}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => sidebarNavClassesAdmin(isActive)}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={20}
                    strokeWidth={2.5}
                    className={sidebarIconClasses(isActive)}
                  />
                  {!isSidebarCollapsed && (
                    <span className="min-w-0 flex-1 truncate transition-opacity duration-300">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--app-border)] px-2 py-3">
          <LogoutSidebarButton
            label={t('logout')}
            className="flex h-12 w-full items-center gap-4 rounded-xl px-4 text-sm font-bold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
          />
        </div>
      </aside>

      <div
        className="flex min-h-screen flex-col transition-all duration-300 lg:pl-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${currentSidebarW}px` } as React.CSSProperties}
      >
        <header className={shell.header}>
          <div className="flex h-[88px] items-center justify-between gap-6 px-6">
            <div className="flex items-center gap-3">
              <div className={`${shell.logoIcon} rounded-lg lg:hidden`}>
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--app-text)]">
                  {t('admin.layout.header.title')}
                </h1>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {t('admin.layout.header.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageToggle variant="light" />
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm transition hover:bg-slate-50">
                <NotificationBell variant="light" indicator="dot" />
              </div>
              <div className="h-6 w-px bg-[var(--app-border)]" />
              <div ref={profileMenuRef} className="relative">
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
                    <span className="truncate text-sm font-bold leading-none text-[var(--app-text)]">
                      {user?.name ?? t('admin.layout.profile.fallbackName')}
                    </span>
                    <span className="mt-0.5 text-xs font-medium leading-[14px] text-[var(--app-text-muted)]">
                      {t('admin.layout.profile.role')}
                    </span>
                  </div>
                  <ChevronDownIcon size={16} className="text-slate-400" strokeWidth={2.5} />
                </div>
                {isProfileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-lg">
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
