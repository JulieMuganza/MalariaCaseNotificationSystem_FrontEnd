import { useState, type FormEvent, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShieldCheckIcon, ArrowLeftIcon, KeyIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole } from '../../auth/rolePaths';
import { apiFetch } from '../../lib/api';

const otpImage = new URL('../../assets/img/Image (6).jpg', import.meta.url).href;

export function OTPPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, user, ready } = useAuth();
  const emailFromUrl = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setEmail(emailFromUrl);
  }, [emailFromUrl]);

  useEffect(() => {
    if (ready && user) {
      if (user.mustChangePassword) {
        navigate('/account/setup-password', { replace: true });
      } else {
        navigate(dashboardPathForRole(user.role), { replace: true });
      }
    }
  }, [ready, user, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error(t('auth.otp.toast.enterSixDigits'));
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error(t('auth.otp.toast.emailRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const u = await verifyEmail(trimmedEmail, code);
      toast.success(t('auth.otp.toast.verifiedWelcome'));
      navigate(dashboardPathForRole(u.role), { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.otp.toast.verificationFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error(t('auth.otp.toast.enterEmailFirst'));
      return;
    }
    setResending(true);
    try {
      await apiFetch<{ data: { message?: string } }>('/api/v1/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail }),
        skipAuth: true,
      });
      toast.success(t('auth.otp.toast.resendSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.otp.toast.resendFailed'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[80%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] h-[85vh] min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        <div className="w-full md:w-1/2 h-full flex flex-col pt-8 pb-10 px-6 sm:px-12 md:px-16 overflow-y-auto">
          <Link
            to="/login?mode=register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors self-start mb-8"
          >
            <ArrowLeftIcon size={18} /> {t('auth.otp.backToSignUp')}
          </Link>

          <div className="w-full max-w-md mx-auto my-auto space-y-6 md:space-y-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto md:mx-0">
                <ShieldCheckIcon size={32} strokeWidth={2} className="opacity-90" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('auth.otp.title')}</h2>
              <p className="text-gray-500 font-medium leading-relaxed">{t('auth.otp.subtitle')}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('auth.otp.label.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 py-3 px-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50"
                placeholder={t('auth.otp.placeholder.email')}
              />
            </div>
            
            <form onSubmit={onSubmit} className="space-y-8 pt-2">
              <div className="flex justify-center md:justify-start gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{1}"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-sm"
                  />
                ))}
              </div>
              
              <button
                type="submit"
                disabled={submitting || otp.some((d) => !d) || !email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20 hover:shadow-lg active:scale-[0.98]"
              >
                {submitting ? t('auth.otp.submit.verifying') : t('auth.otp.submit.completeRegistration')}
              </button>
              
              <div className="text-center font-medium text-sm text-gray-500">
                {t('auth.otp.resend.prompt')}{' '}
                <button
                  type="button"
                  disabled={resending}
                  onClick={() => void resend()}
                  className="text-primary hover:underline transition-all font-semibold disabled:opacity-50"
                >
                  {resending ? t('auth.otp.resend.sending') : t('auth.otp.resend.action')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden md:block w-1/2 h-full z-20 pointer-events-none bg-primary overflow-hidden relative">
          <motion.img 
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            src={otpImage} 
            alt={t('auth.otp.image.alt.secure')} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900 via-gray-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-12 text-white pointer-events-auto">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20">
              <KeyIcon className="text-white" size={24} />
            </div>
            <h2 className="text-4xl font-bold mb-4 drop-shadow-md">{t('auth.otp.panel.title')}</h2>
            <p className="text-lg font-medium text-white/90 drop-shadow-sm max-w-sm">
              {t('auth.otp.panel.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
