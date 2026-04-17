import { useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Props = {
  className?: string;
  label?: string;
};

export function LogoutSidebarButton({
  className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-200 hover:bg-white/10 hover:text-white transition-colors w-full',
  label = 'Log out',
}: Props) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={async () => {
        await logout();
        navigate('/login', { replace: true });
      }}
      className={className}
    >
      <LogOutIcon size={18} />
      {label}
    </button>
  );
}
