import type { ReactNode } from 'react';

/** Small red count badge (aligned with notification badge styling). */
export function IconWithBadge({
  children,
  count,
  className = '',
}: {
  children: ReactNode;
  count: number;
  className?: string;
}) {
  const show = count > 0;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      {show && (
        <span
          className="pointer-events-none absolute -right-1 -top-1 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#DC2626] px-[5px] text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
          aria-label={`${count} unread`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
