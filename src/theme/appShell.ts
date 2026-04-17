/**
 * Unified shell — use with data-app-role on the layout root (see index.css).
 */

export const shell = {
  page: 'min-h-screen bg-[var(--app-page-bg)] text-[var(--app-text)] font-sans antialiased',
  aside:
    'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] transition-all duration-300 lg:flex',
  header:
    'sticky top-0 z-30 border-b border-[var(--app-border)] bg-[var(--app-surface)]',
  main: 'flex-1 px-4 pt-6 pb-6 lg:px-10 lg:pt-8 lg:pb-10',
  mainInner: 'mx-auto w-full max-w-[1600px]',
  collapseBtn:
    'absolute -right-5 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] shadow-sm transition hover:bg-slate-50 active:scale-95 hover:text-[color:var(--role-accent)]',
  logoIcon:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--role-accent)] text-white shadow-sm',
  roleSubtitle: 'text-[11px] font-semibold text-[color:var(--role-accent)]',
  profileAvatar:
    'flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[color:var(--role-accent)] text-[11px] font-bold tracking-wide text-white shadow-sm',
} as const;

export function sidebarNavClasses(isActive: boolean): string {
  const base =
    'flex h-12 items-center gap-4 rounded-xl px-3 text-[15px] font-semibold transition-colors border-l-[3px]';
  if (isActive) {
    return `${base} border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)] shadow-sm`;
  }
  return `${base} border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900`;
}

export function sidebarIconClasses(isActive: boolean): string {
  if (isActive) return 'text-[color:var(--role-accent)]';
  return 'text-slate-400';
}

export function sidebarNavClassesChw(isActive: boolean): string {
  const base =
    'flex h-12 items-center gap-4 rounded-xl px-4 text-base font-bold transition-colors border-l-[3px]';
  if (isActive) {
    return `${base} border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)] shadow-sm`;
  }
  return `${base} border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900`;
}

export function sidebarNavClassesAdmin(isActive: boolean): string {
  const base =
    'flex h-11 items-center gap-4 rounded-xl px-4 text-sm font-bold transition-colors border-l-[3px]';
  if (isActive) {
    return `${base} border-[color:var(--role-accent)] bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)] shadow-sm`;
  }
  return `${base} border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900`;
}

/** Health Center inner pages — same hierarchy as CHW reports / other roles */
export const hcPage = {
  wrap: 'w-full space-y-6 animate-in fade-in duration-300',
  headerRow: 'flex flex-wrap items-end justify-between gap-4',
  title: 'text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl',
  desc: 'mt-1 text-sm text-gray-500',
  pill: 'inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--role-accent)]/25 bg-[color:var(--role-accent-soft)] px-4 text-sm font-semibold text-[color:var(--role-accent)]',
} as const;
