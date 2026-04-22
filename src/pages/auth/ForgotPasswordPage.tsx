import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MailIcon, SendIcon, ArrowLeftIcon } from 'lucide-react';
import { apiFetch } from '../../lib/api';

/** Same hero asset as login; lowercase filename for Vercel/Linux builds. */
const forgotImage = new URL('../../assets/img/image (8).jpg', import.meta.url).href;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setDevLink(null);
    try {
      const res = await apiFetch<{
        data: { message?: string; debugResetLink?: string };
      }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
        skipAuth: true,
      });
      toast.success(res?.data?.message ?? t('auth.forgot.toast.checkEmail'));
      if (res?.data?.debugResetLink) {
        setDevLink(res.data.debugResetLink);
        toast.info(t('auth.forgot.dev.toast'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.forgot.toast.requestFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[80%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] h-[85vh] min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 h-full flex flex-col pt-8 pb-10 px-6 sm:px-12 md:px-16 overflow-y-auto">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors self-start mb-8"
          >
            <ArrowLeftIcon size={18} /> {t('auth.forgot.backToLogin')}
          </Link>

          <div className="w-full max-w-md mx-auto my-auto space-y-6 md:space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30 mb-8 md:hidden">
                M
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('auth.forgot.title')}</h2>
              <p className="text-gray-500 font-medium">{t('auth.forgot.subtitle')}</p>
            </div>
            
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1">
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t('auth.forgot.placeholder.email')}
                    className={inputClass}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20 hover:shadow-lg active:scale-[0.98]"
              >
                <SendIcon size={20} strokeWidth={2} />
                {submitting ? t('auth.forgot.submit.sending') : t('auth.forgot.submit.send')}
              </button>
            </form>

            {devLink ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs break-all">
                <p className="mb-2 font-semibold text-amber-900">{t('auth.forgot.dev.title')}</p>
                <a href={devLink} className="font-medium text-[#3B82F6] underline">
                  {devLink}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="hidden md:block w-1/2 h-full z-20 pointer-events-none bg-primary overflow-hidden relative">
          <motion.img 
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            src={forgotImage} 
            alt="Malaria vector awareness illustration" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-gray-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-12 text-white pointer-events-auto">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-md">{t('auth.forgot.hero.title')}</h2>
            <p className="text-lg font-medium text-white/90 drop-shadow-sm max-w-sm">
              {t('auth.forgot.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
