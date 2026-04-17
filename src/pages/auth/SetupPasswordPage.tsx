import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LockIcon, SaveIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole } from '../../auth/rolePaths';
import { AuthWebLayout } from '../../components/auth/AuthWebLayout';

export function SetupPasswordPage() {
  const { t } = useTranslation();
  const { user, ready, completePasswordSetup, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!user.mustChangePassword) {
      navigate(dashboardPathForRole(user.role), { replace: true });
    }
  }, [ready, user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await completePasswordSetup(password);
      toast.success(t('auth.setup.toast.passwordUpdated'));
      navigate(dashboardPathForRole(u.role), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.setup.toast.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#E5E7EB] py-3 pl-10 pr-3 text-base text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 sm:text-[15px]';

  if (!ready || !user?.mustChangePassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] text-sm text-[#6B7280]">
        {t('auth.setup.loading')}
      </div>
    );
  }

  return (
    <AuthWebLayout
      pageTitle={t('auth.setup.title')}
      pageSubtitle={t('auth.setup.subtitle')}
      headerRight={<span className="inline-block w-8" aria-hidden />}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              {t('auth.setup.label.newPassword')}
            </label>
            <div className="relative">
              <LockIcon
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-3.5 text-base font-semibold text-white transition hover:bg-[#2563EB] disabled:opacity-50"
          >
            <SaveIcon size={20} strokeWidth={2} />
            {submitting ? t('auth.setup.submit.saving') : t('auth.setup.submit.saveContinue')}
          </button>
        </form>
        <p className="text-center text-sm text-[#6B7280]">
          <button
            type="button"
            onClick={() => void logout().then(() => navigate('/login'))}
            className="font-semibold text-[#3B82F6] hover:underline"
          >
            {t('auth.setup.signOut')}
          </button>
        </p>
      </motion.div>
    </AuthWebLayout>
  );
}
