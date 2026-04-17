import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActivityIcon } from 'lucide-react';
import { setStoredTokens } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole } from '../../auth/rolePaths';

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    const access = params.get('accessToken');
    const refresh = params.get('refreshToken');
    if (!access || !refresh) {
      navigate('/login?error=google', { replace: true });
      return;
    }
    setStoredTokens(access, refresh);
    void (async () => {
      try {
        const u = await refreshUser();
        if (u) {
          if (u.mustChangePassword) {
            navigate('/account/setup-password', { replace: true });
          } else {
            navigate(dashboardPathForRole(u.role), { replace: true });
          }
        } else {
          setMessage('Could not load profile');
          navigate('/login', { replace: true });
        }
      } catch {
        setMessage('Sign-in failed');
        navigate('/login?error=google', { replace: true });
      }
    })();
  }, [params, navigate, refreshUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3F4F6] px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
          <ActivityIcon size={28} strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-[#374151]">{message}</p>
        <p className="text-xs text-[#9CA3AF]">You will be redirected automatically.</p>
      </div>
    </div>
  );
}
