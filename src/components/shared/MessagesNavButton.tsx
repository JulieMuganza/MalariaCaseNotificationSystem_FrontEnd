import { MessageSquareIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconWithBadge } from './IconWithBadge';

/** Header icon: navigate to role messages route with unread count. */
export function MessagesNavButton({
  to,
  unreadCount,
  variant = 'light',
}: {
  to: string;
  unreadCount: number;
  variant?: 'light' | 'dark';
}) {
  const navigate = useNavigate();
  const iconColor =
    variant === 'dark' ? 'text-white' : 'text-[var(--dash-text,#111827)]';
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm transition hover:bg-slate-50 active:scale-95"
      aria-label="Messages"
    >
      <IconWithBadge count={unreadCount}>
        <MessageSquareIcon size={18} className={iconColor} />
      </IconWithBadge>
    </button>
  );
}
