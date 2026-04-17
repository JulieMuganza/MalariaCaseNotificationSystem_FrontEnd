import React, { useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboardIcon,
  UsersIcon,
  MessageSquareIcon,
  CalendarDaysIcon,
  FileTextIcon,
  BarChart3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ActivityIcon,
  BellIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoutSidebarButton } from '../../components/auth/LogoutSidebarButton';
import { NotificationBell } from '../../components/shared/NotificationBell';
import { MessagesNavButton } from '../../components/shared/MessagesNavButton';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import {
  shell,
  sidebarNavClassesChw,
  sidebarIconClasses,
} from '../../theme/appShell';

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 80;

export function CHWLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const currentSidebarW = isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, messageUnreadCount, user } = useAuth();
  const { t, i18n } = useTranslation();

  const desktopNav: (
    | {
        type: 'link';
        to: string;
        end?: boolean;
        icon: typeof LayoutDashboardIcon;
        label: string;
        badge?: number;
      }
  )[] = useMemo(
    () => [
      {
        type: 'link',
        to: '/chw',
        end: true,
        icon: LayoutDashboardIcon,
        label: t('chw.layout.nav.dashboard'),
      },
      {
        type: 'link',
        to: '/chw/patients',
        icon: UsersIcon,
        label: t('chw.layout.nav.patients'),
      },
      {
        type: 'link',
        to: '/chw/cases',
        icon: FileTextIcon,
        label: t('chw.layout.nav.myCases'),
      },
      {
        type: 'link',
        to: '/chw/messages',
        icon: MessageSquareIcon,
        label: t('chw.layout.nav.message'),
        badge: messageUnreadCount > 0 ? messageUnreadCount : undefined,
      },
      {
        type: 'link',
        to: '/chw/notifications',
        icon: BellIcon,
        label: t('chw.layout.nav.notifications'),
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
      {
        type: 'link',
        to: '/chw/reports',
        icon: BarChart3Icon,
        label: t('chw.layout.nav.report'),
      },
    ],
    [t, i18n.language, messageUnreadCount, unreadCount]
  );

  const headerTitle =
    location.pathname === '/chw' || location.pathname === '/chw/'
      ? t('chw.layout.nav.dashboard')
      : desktopNav.find(
          (n) =>
            n.type === 'link' &&
            (location.pathname === n.to ||
              (n.to !== '/chw' && location.pathname.startsWith(n.to)))
        )?.label ?? t('chw.layout.nav.dashboard');

  const mobileNav: {
    to: string;
    icon: typeof LayoutDashboardIcon;
    label: string;
    end: boolean;
    badge?: number;
  }[] = useMemo(
    () => [
      { to: '/chw', icon: LayoutDashboardIcon, label: t('chw.layout.nav.dashboard'), end: true },
      { to: '/chw/patients', icon: UsersIcon, label: t('chw.layout.nav.patients'), end: false },
      { to: '/chw/cases', icon: FileTextIcon, label: t('chw.layout.nav.myCases'), end: false },
      {
        to: '/chw/messages',
        icon: MessageSquareIcon,
        label: t('chw.layout.nav.message'),
        end: false,
        badge: messageUnreadCount,
      },
      {
        to: '/chw/notifications',
        icon: BellIcon,
        label: t('chw.layout.nav.notifications'),
        end: false,
        badge: unreadCount,
      },
      { to: '/chw/reports', icon: BarChart3Icon, label: t('chw.layout.nav.report'), end: false },
    ],
    [t, i18n.language, messageUnreadCount, unreadCount]
  );

  return (
    <div data-app-role="chw" className={shell.page}>
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
              <p className="truncate text-base font-bold leading-tight text-[var(--app-text)]">
                {t('chw.layout.brand.title')}
              </p>
              <p className={shell.roleSubtitle}>{t('chw.layout.brand.subtitle')}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-4">
          {desktopNav.map((item) => {
            return (
              <NavLink
                key={`${item.to}-${item.label}`}
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
                    {!isSidebarCollapsed && item.badge != null && item.badge > 0 && (
                      <span className="flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[10px] font-bold leading-none text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div
        className="flex min-h-screen flex-col transition-all duration-300 lg:pl-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${currentSidebarW}px` } as React.CSSProperties}
      >
        <header className={shell.header}>
          <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6 lg:py-0 lg:h-[88px]">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex w-full items-center justify-between gap-3 lg:hidden">
                <h1 className="truncate text-xl font-bold text-[var(--app-text)]">{headerTitle}</h1>
                <div className="flex items-center gap-1.5">
                  <LanguageToggle variant="light" />
                  <MessagesNavButton to="/chw/messages" unreadCount={messageUnreadCount} variant="light" />
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
                    <NotificationBell variant="light" indicator="count" />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-end gap-4 lg:gap-5">
              <div className="flex items-center gap-2">
                <LanguageToggle variant="light" />
                <MessagesNavButton to="/chw/messages" unreadCount={messageUnreadCount} variant="light" />
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm transition hover:bg-slate-50 active:scale-95">
                  <NotificationBell variant="light" indicator="count" />
                </div>
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
                  <div className="flex flex-col pt-0.5 min-w-[100px]">
                    <span className="truncate text-sm font-bold leading-none text-[var(--app-text)]">
                      {user?.name ?? t('chw.layout.profile.fallbackName')}
                    </span>
                    <span className="mt-0.5 text-xs font-medium leading-[14px] text-[var(--app-text-muted)]">
                      {user?.role ?? t('chw.layout.profile.fallbackRole')}
                    </span>
                  </div>
                  <ChevronDownIcon size={16} className="text-[#9CA3AF]" strokeWidth={2.5} />
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-lg">
                    <button
                      onClick={() => {
                        navigate('/chw/settings');
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 border-b border-gray-100"
                    >
                      <UsersIcon size={16} className="text-gray-400" />
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

        <main className="flex-1 px-4 pt-6 pb-6 transition-all duration-300 lg:px-10 lg:pt-4 lg:pb-10">
          <div className={`${shell.mainInner} transition-all duration-300`}>
            <Outlet />
          </div>
        </main>

        <button
          type="button"
          onClick={() => navigate('/chw/new-case')}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-xl border border-[color:var(--role-accent)] bg-[color:var(--role-accent)] text-white shadow-lg transition hover:opacity-95 active:scale-[0.98] lg:hidden"
          aria-label={t('chw.layout.fab.newCase')}
        >
          <CalendarDaysIcon size={26} strokeWidth={2} />
        </button>

        <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--app-border)] bg-[var(--app-surface)] lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around py-2">
            {mobileNav.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition ${
                    isActive
                      ? 'text-[color:var(--role-accent)]'
                      : 'text-[var(--app-text-muted)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                      {tab.badge != null && tab.badge > 0 && (
                        <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-0.5 text-[9px] font-bold text-white">
                          {tab.badge > 9 ? '9+' : tab.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`max-w-[64px] truncate text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}
                    >
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="h-16 shrink-0 lg:hidden" aria-hidden />
      </div>
    </div>
  );
}
