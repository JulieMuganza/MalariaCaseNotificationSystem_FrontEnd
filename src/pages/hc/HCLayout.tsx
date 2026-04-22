import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboardIcon,
  HistoryIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ActivityIcon,
  StethoscopeIcon,
  MessageSquareIcon,
  BellIcon,
  BarChart3Icon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoutSidebarButton } from '../../components/auth/LogoutSidebarButton';
import { NotificationBell } from '../../components/shared/NotificationBell';
import { MessagesNavButton } from '../../components/shared/MessagesNavButton';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import {
  shell,
  sidebarNavClasses,
  sidebarIconClasses,
} from '../../theme/appShell';

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 80;

export function HCLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, messageUnreadCount, unreadCount } = useAuth();
  const isLc = location.pathname.startsWith('/lc');
  const base = isLc ? '/lc' : '/hc';
  const layoutNs = isLc ? 'lc.layout' : 'hc.layout';

  const tailNavItems = useMemo(
    () =>
      [
        {
          to: `${base}/messages`,
          icon: MessageSquareIcon,
          label: t(`${layoutNs}.tail.messages`),
          badge: messageUnreadCount,
        },
        {
          to: `${base}/notifications`,
          icon: BellIcon,
          label: t(`${layoutNs}.tail.notifications`),
          badge: unreadCount,
        },
        {
          to: `${base}/reports`,
          icon: BarChart3Icon,
          label: t(`${layoutNs}.tail.reports`),
          badge: 0,
        },
      ] as const,
    [t, i18n.language, messageUnreadCount, unreadCount, base, layoutNs]
  );
  const currentSidebarW = isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

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
    <div data-app-role={isLc ? 'lc' : 'hc'} className={shell.page}>
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
            <ActivityIcon size={22} strokeWidth={2} />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
              <p className="truncate text-base font-semibold leading-tight text-slate-900">
                {t(`${layoutNs}.brand.title`)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">{t(`${layoutNs}.brand.subtitle`)}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
          <NavLink to={base} end className={({ isActive }) => sidebarNavClasses(isActive)}>
            {({ isActive }) => (
              <>
                <LayoutDashboardIcon
                  size={22}
                  strokeWidth={2.25}
                  className={sidebarIconClasses(isActive)}
                />
                {!isSidebarCollapsed && (
                  <span className="min-w-0 flex-1 truncate transition-opacity duration-300">
                    {t(`${layoutNs}.nav.dashboard`)}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to={`${base}/triage`}
            className={({ isActive }) =>
              sidebarNavClasses(
                isActive ||
                  location.pathname.startsWith(`${base}/case/`) ||
                  location.pathname === `${base}/new-case`
              )
            }
          >
            {({ isActive }) => (
              <>
                <StethoscopeIcon
                  size={22}
                  strokeWidth={2.25}
                  className={sidebarIconClasses(isActive)}
                />
                {!isSidebarCollapsed && (
                  <span className="min-w-0 flex-1 truncate transition-opacity duration-300">
                    {t(`${layoutNs}.nav.clinicalManagement`)}
                  </span>
                )}
              </>
            )}
          </NavLink>
          <NavLink to={`${base}/history`} className={({ isActive }) => sidebarNavClasses(isActive)}>
            {({ isActive }) => (
              <>
                <HistoryIcon
                  size={22}
                  strokeWidth={2.25}
                  className={sidebarIconClasses(isActive)}
                />
                {!isSidebarCollapsed && (
                  <span className="min-w-0 flex-1 truncate transition-opacity duration-300">
                    {t(`${layoutNs}.nav.allCases`)}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink to={`${base}/patients`} className={({ isActive }) => sidebarNavClasses(isActive)}>
            {({ isActive }) => (
              <>
                <UsersIcon
                  size={22}
                  strokeWidth={2.25}
                  className={sidebarIconClasses(isActive)}
                />
                {!isSidebarCollapsed && (
                  <span className="min-w-0 flex-1 truncate transition-opacity duration-300">
                    {t(`${layoutNs}.nav.patients`)}
                  </span>
                )}
              </>
            )}
          </NavLink>

          {tailNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => sidebarNavClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  <span className="relative inline-flex shrink-0">
                    <item.icon
                      size={22}
                      strokeWidth={2.25}
                      className={sidebarIconClasses(isActive)}
                    />
                    {!isSidebarCollapsed && item.badge > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </span>
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
        <header className={`${shell.header} backdrop-blur-sm`}>
          <div className="flex h-[88px] items-center gap-4 px-4 sm:px-6">
            <div className={`${shell.logoIcon} shrink-0 lg:hidden`}>
              <ActivityIcon size={20} />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <LanguageToggle variant="light" />
              <MessagesNavButton to={`${base}/messages`} unreadCount={messageUnreadCount} variant="light" />
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
                  <div className="flex flex-col pt-0.5 min-w-[90px]">
                    <span className="truncate text-sm font-semibold leading-none text-slate-900">
                      {user?.name ?? t(`${layoutNs}.profile.fallbackName`)}
                    </span>
                    <span className="mt-0.5 text-xs font-medium leading-[14px] text-slate-500">
                      {t(`${layoutNs}.brand.subtitle`)}
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
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-slate-50"
                    >
                      <UserIcon size={18} className="text-[var(--app-text-muted)]" />
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
