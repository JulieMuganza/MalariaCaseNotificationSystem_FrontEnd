import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeftIcon, KeyRoundIcon, LockIcon, SaveIcon } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { AuthWebLayout } from '../../components/auth/AuthWebLayout';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{ data: { message?: string } }>(
        '/api/v1/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ token: token.trim(), newPassword: password }),
          skipAuth: true,
        }
      );
      toast.success(res?.data?.message ?? t('auth.reset.toast.success'));
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.reset.toast.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#E5E7EB] py-3 pl-10 pr-3 text-base text-[#111827] placeholder:text-[#9CA3AF] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-[15px]';

  return (
    <AuthWebLayout
      pageTitle={t('auth.reset.pageTitle')}
      pageSubtitle={t('auth.reset.pageSubtitle')}
      headerLeft={
        <Link
          to="/login"
          className="mr-1 flex shrink-0 items-center gap-1 rounded-lg p-2 text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6]"
        >
          <ChevronLeftIcon size={20} />
          <span className="hidden sm:inline">{t('back')}</span>
        </Link>
      }
      headerRight={<LanguageToggle variant="light" />}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10"
      >
        <div className="hidden border-b border-[#F3F4F6] pb-5 sm:block">
          <h2 className="text-xl font-bold text-[#111827]">{t('auth.reset.formTitle')}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{t('auth.reset.formHint')}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              {t('auth.reset.label.token')}
            </label>
            <div className="relative">
              <KeyRoundIcon
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className={`${inputClass} pl-10 font-mono text-xs sm:text-sm`}
                placeholder={t('auth.reset.placeholder.token')}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              {t('auth.reset.label.newPassword')}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            <SaveIcon size={20} strokeWidth={2} />
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280]">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t('auth.reset.backToSignIn')}
          </Link>
        </p>
      </motion.div>
    </AuthWebLayout>
  );
}
