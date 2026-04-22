import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboardIcon,
  UsersIcon,
  MessageSquareIcon,
  PlusCircleIcon,
  FileTextIcon,
  BarChart3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ActivityIcon,
  BellIcon,
  MenuIcon,
  XIcon,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const currentSidebarW = isSidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, messageUnreadCount, user } = useAuth();
  const { t, i18n } = useTranslation();
  const en = !i18n.language.startsWith('rw');

  const desktopNav: {
    to: string;
    end?: boolean;
    icon: typeof LayoutDashboardIcon;
    label: string;
    badge?: number;
  }[] = useMemo(
    () => [
      {
        to: '/chw',
        end: true,
        icon: LayoutDashboardIcon,
        label: t('chw.layout.nav.dashboard'),
      },
      {
        to: '/chw/new-case',
        icon: PlusCircleIcon,
        label: t('chw.layout.fab.newCase'),
      },
      {
        to: '/chw/patients',
        icon: UsersIcon,
        label: t('chw.layout.nav.patients'),
      },
      {
        to: '/chw/cases',
        icon: FileTextIcon,
        label: t('chw.layout.nav.myCases'),
      },
      {
        to: '/chw/messages',
        icon: MessageSquareIcon,
        label: t('chw.layout.nav.message'),
        badge: messageUnreadCount > 0 ? messageUnreadCount : undefined,
      },
      {
        to: '/chw/notifications',
        icon: BellIcon,
        label: t('chw.layout.nav.notifications'),
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
      {
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
            location.pathname === n.to ||
            (n.to !== '/chw' && location.pathname.startsWith(n.to))
        )?.label ?? t('chw.layout.nav.dashboard');

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
    <div data-app-role="chw" className={shell.page}>
      {/* Desktop sidebar */}
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
          {desktopNav.map((item) => (
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
          ))}
        </nav>
      </aside>

      {/* Mobile slide-over menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={en ? 'Close menu' : 'Funga menu'}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-[var(--app-surface)] shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-[var(--app-border)] px-4">
              <span className="text-sm font-bold text-[var(--app-text)]">
                {t('chw.layout.brand.title')}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-[var(--app-text-muted)] hover:bg-slate-100"
                aria-label={en ? 'Close' : 'Funga'}
              >
                <XIcon size={22} />
              </button>
            </div>
            <div className="border-b border-[var(--app-border)] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={shell.profileAvatar}>
                  <span className="text-[11px] font-bold tracking-wide">
                    {(user?.name ?? '?')
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                    {user?.name ?? t('chw.layout.profile.fallbackName')}
                  </p>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">
                    {t('chw.layout.brand.subtitle')}
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {desktopNav.map((item) => (
                <NavLink
                  key={`m-${item.to}`}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => sidebarNavClassesChw(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={22} strokeWidth={2.5} className={sidebarIconClasses(isActive)} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className="flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[10px] font-bold text-white">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto border-t border-[var(--app-border)] bg-slate-50/80 px-3 py-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                {t('chw.layout.drawer.preferences')}
              </p>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-white px-3 py-2.5 shadow-sm">
                <span className="text-sm text-[var(--app-text)]">{t('chw.layout.drawer.language')}</span>
                <LanguageToggle variant="light" />
              </div>
              <LogoutSidebarButton
                label={t('logout')}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 [&_svg]:text-white"
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="flex min-h-screen flex-col transition-all duration-300 lg:pl-[var(--sidebar-w)]"
        style={{ '--sidebar-w': `${currentSidebarW}px` } as React.CSSProperties}
      >
        <header className={shell.header}>
          <div className="flex flex-col gap-2 px-3 py-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6 lg:py-0 lg:h-[88px]">
            {/* Mobile: menu + title + notifications only (language & logout live in the drawer) */}
            <div className="flex w-full min-h-0 items-center gap-2 lg:hidden">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-white text-[var(--app-text)] shadow-sm"
                onClick={() => setMobileMenuOpen(true)}
                aria-label={en ? 'Open menu' : 'Fungura menu'}
              >
                <MenuIcon size={20} />
              </button>
              <h1 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-[var(--app-text)]">
                {headerTitle}
              </h1>
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
                <NotificationBell variant="light" indicator="count" />
              </div>
            </div>

            {/* Desktop title + profile */}
            <div className="hidden w-full items-center justify-between gap-4 lg:flex">
              <h1 className="truncate text-xl font-bold text-[var(--app-text)]">{headerTitle}</h1>
            <div className="hidden lg:flex items-center justify-end gap-4 lg:gap-5">
              <div className="flex items-center gap-2">
                <LanguageToggle variant="light" />
                <MessagesNavButton to="/chw/messages" unreadCount={messageUnreadCount} variant="light" />
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm transition hover:bg-slate-50 active:scale-95">
                  <NotificationBell variant="light" indicator="count" />
                </div>
              </div>

              <div className="h-6 w-px bg-[var(--app-border)]" />

              <div ref={profileMenuRef} className="relative">
                <div
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex cursor-pointer select-none items-center gap-2.5 rounded-full border border-[var(--app-border)] bg-slate-50 py-1.5 pr-3 pl-1.5 shadow-sm transition hover:bg-slate-100 active:scale-95"
                >
                  <div className={shell.profileAvatar}>
                    <span className="text-[11px] font-bold tracking-wide">
                      {(user?.name ?? '?')
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
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
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-6 transition-all duration-300 lg:px-10 lg:pt-4 lg:pb-10">
          <div className={`${shell.mainInner} transition-all duration-300`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
