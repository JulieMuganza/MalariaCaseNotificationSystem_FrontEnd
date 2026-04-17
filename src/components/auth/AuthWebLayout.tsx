import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIcon, ShieldCheckIcon, UsersIcon, BellIcon } from 'lucide-react';

type Props = {
  /** Top bar: page title next to logo */
  pageTitle: string;
  pageSubtitle: string;
  headerExtra?: React.ReactNode;
  /** Right side of header (e.g. language toggle) */
  headerRight: React.ReactNode;
  /** Optional back control (e.g. register → login) */
  headerLeft?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Desktop-first auth shell: full-width header + two-column main (hero | form).
 * On small screens stacks with a short hero then the form.
 */
export function AuthWebLayout({
  pageTitle,
  pageSubtitle,
  headerExtra,
  headerRight,
  headerLeft,
  children,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6]">
      <header className="w-full border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-5 sm:px-8 lg:h-[72px] lg:px-12">
          {headerLeft ? (
            <div className="flex shrink-0 items-center">{headerLeft}</div>
          ) : null}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6] text-white lg:h-12 lg:w-12">
              <ActivityIcon size={26} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-[#111827] lg:text-xl">
                {pageTitle}
              </h1>
              <p className="truncate text-xs text-[#6B7280] sm:text-sm">
                {pageSubtitle}
              </p>
            </div>
            {headerExtra}
          </div>
          <div className="shrink-0">{headerRight}</div>
        </div>
      </header>

      <main className="flex flex-1">
        <div className="mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-14">
          <section className="flex flex-col justify-center lg:col-span-5">
            <div className="mb-2 lg:mb-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6] lg:text-sm">
                {t('auth.shell.brand.name')}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-[#111827] sm:text-3xl lg:text-4xl lg:leading-tight">
                {t('auth.shell.hero.titleLead')}{' '}
                <span className="text-[#3B82F6]">{t('auth.shell.hero.highlight')}</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6B7280] lg:text-base">
                {t('auth.shell.hero.body')}
              </p>
              <ul className="mt-6 hidden space-y-3 sm:block">
                <li className="flex items-start gap-3 text-sm text-[#374151]">
                  <ShieldCheckIcon
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#3B82F6]"
                    strokeWidth={2}
                  />
                  <span>{t('auth.shell.bullet.access')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#374151]">
                  <UsersIcon
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#3B82F6]"
                    strokeWidth={2}
                  />
                  <span>{t('auth.shell.bullet.handoffs')}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#374151]">
                  <BellIcon
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#3B82F6]"
                    strokeWidth={2}
                  />
                  <span>{t('auth.shell.bullet.notifications')}</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="flex items-start justify-center lg:col-span-7 lg:items-center lg:justify-end lg:pl-4">
            <div className="w-full max-w-[480px] lg:w-[480px]">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
