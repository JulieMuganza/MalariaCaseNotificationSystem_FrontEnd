import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboardIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  GlobeIcon,
  BellIcon,
  FileTextIcon,
  MessageSquareIcon,
  BarChart3Icon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoutSidebarButton } from '../../components/auth/LogoutSidebarButton';
import { NotificationBell } from '../../components/shared/NotificationBell';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { MessagesNavButton } from '../../components/shared/MessagesNavButton';
import {
  shell,
  sidebarNavClassesChw,
  sidebarIconClasses,
} from '../../theme/appShell';
import {
  useSurveillanceBasePath,
  useSurveillanceI18nNs,
} from './useSurveillanceBasePath';

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 80;

export function RichLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, messageUnreadCount } = useAuth();
  const base = useSurveillanceBasePath();
  const ns = useSurveillanceI18nNs();
  const dataAppRole = ns;
  const currentSidebarW = isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const nav = useMemo(
    () =>
      [
        { to: base, label: t(`${ns}.layout.nav.dashboard`), icon: LayoutDashboardIcon, end: true },
        { to: `${base}/cases`, label: t(`${ns}.layout.nav.cases`), icon: FileTextIcon, end: false },
        { to: `${base}/patients`, label: t(`${ns}.layout.nav.patients`), icon: UsersIcon, end: false },
        { to: `${base}/notifications`, label: t(`${ns}.layout.nav.notifications`), icon: BellIcon, end: false },
        { to: `${base}/messages`, label: t(`${ns}.layout.nav.messages`), icon: MessageSquareIcon, end: false },
        { to: `${base}/reports`, label: t(`${ns}.layout.nav.reports`), icon: BarChart3Icon, end: false },
        { to: `${base}/map`, label: t(`${ns}.layout.nav.map`), icon: MapIcon, end: false },
      ] as const,
    [t, i18n.language, base, ns]
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
    <div data-app-role={dataAppRole} className={shell.page}>
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
            <GlobeIcon size={22} strokeWidth={2} />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
              <p className="truncate text-base font-bold leading-tight text-[var(--app-text)]">
                {t(`${ns}.layout.brand.title`)}
              </p>
              <p className={shell.roleSubtitle}>{t(`${ns}.layout.brand.subtitle`)}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => sidebarNavClassesChw(isActive)}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
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
      </aside>

      <div
        className="flex min-h-screen flex-col transition-all duration-300 lg:pl-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${currentSidebarW}px` } as React.CSSProperties}
      >
        <header className={shell.header}>
          <div className="flex h-[88px] w-full items-center justify-end gap-6 px-6">
            <div className="flex items-center gap-3">
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
                  <div className="flex min-w-[90px] flex-col pt-0.5">
                    <span className="truncate text-sm font-bold leading-none text-[var(--app-text)]">
                      {user?.name ?? t(`${ns}.layout.profile.fallbackName`)}
                    </span>
                    <span className="mt-0.5 text-xs font-medium leading-[14px] text-[var(--app-text-muted)]">
                      {t(`${ns}.layout.profile.role`)}
                    </span>
                  </div>
                  <ChevronDownIcon size={16} className="text-slate-400" strokeWidth={2.5} />
                </div>
                {isProfileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate(`${base}/profile`);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                    >
                      <UserIcon size={18} className="text-slate-500" />
                      {t(`${ns}.layout.profile.menu.profile`)}
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
          <nav
            className="mx-auto mb-4 flex max-w-[1600px] gap-1 overflow-x-auto pb-1 lg:hidden"
            aria-label={t(`${ns}.layout.mobileNav.aria`)}
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[color:var(--role-accent)] text-white shadow-sm'
                      : 'bg-[var(--app-surface)] text-slate-600 ring-1 ring-[var(--app-border)]'
                  }`
                }
              >
                <item.icon size={14} strokeWidth={2.5} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={shell.mainInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
