import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  MailIcon, LockIcon, LogInIcon, 
  UserIcon, MapPinIcon, EyeIcon, EyeOffIcon, PhoneIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole } from '../../auth/rolePaths';
import { apiFetch } from '../../lib/api';
import { backendAuthUrl } from '../../lib/config';
import { LanguageToggle } from '../../components/shared/LanguageToggle';

const loginImage = new URL('../../assets/img/Image (8).jpg', import.meta.url).href;
const registerImage = new URL('../../assets/img/Image (6).jpg', import.meta.url).href;

// Reusable icon wrapper
function FieldIconWrap({ children, icon: Icon }: { children: React.ReactNode; icon: any }) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function UnifiedAuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, user, ready } = useAuth();
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  // Register State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'google') {
      toast.error(t('auth.unified.toast.googleSignInFailed'));
    }
    if (searchParams.get('registered') === '1') {
      toast.success(t('auth.unified.toast.registeredCanSignIn'));
      setIsLogin(true);
    }
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    } else if (searchParams.get('mode') === 'login') {
      setIsLogin(true);
    }
  }, [searchParams, t]);

  useEffect(() => {
    apiFetch<{ data: { configured: boolean } }>('/api/v1/auth/google/status', { skipAuth: true })
      .then((r) => setGoogleConfigured(r.data.configured))
      .catch(() => setGoogleConfigured(false));
  }, []);

  useEffect(() => {
    if (ready && user) {
      if (user.mustChangePassword) {
        navigate('/account/setup-password', { replace: true });
      } else {
        navigate(dashboardPathForRole(user.role), { replace: true });
      }
    }
  }, [ready, user, navigate]);

  async function onLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setLoginSubmitting(true);
    try {
      const u = await login(loginEmail.trim(), loginPassword);
      toast.success(t('auth.unified.toast.signedIn'));
      if (u.mustChangePassword) {
        navigate('/account/setup-password', { replace: true });
      } else {
        navigate(dashboardPathForRole(u.role), { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.unified.toast.signInFailed'));
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function onRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      const { email } = await register({
        email: regEmail.trim(),
        password: regPassword,
        name: regName.trim(),
        phone: regPhone.trim(),
        district: regDistrict.trim(),
      });
      toast.success(t('auth.unified.toast.checkEmailCode'));
      navigate(`/otp?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.unified.toast.registrationFailed'));
    } finally {
      setRegSubmitting(false);
    }
  }

  function startGoogle() {
    if (!googleConfigured) {
      toast.error(t('auth.unified.toast.googleNotConfigured'));
      return;
    }
    window.location.href = backendAuthUrl('/api/v1/auth/google');
  }

  const inputClass = "w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[80%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-400/10 blur-3xl" />
      </div>
      <div className="absolute right-4 top-4 z-30 sm:right-8 sm:top-8">
        <LanguageToggle variant="light" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] h-[85vh] min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/*
          SLIDING PANEL (Image + Overlay)
        */}
        <motion.div 
          className="hidden md:block absolute top-0 left-0 w-1/2 h-full z-20 pointer-events-none bg-primary overflow-hidden"
          animate={{ x: isLogin ? '0%' : '100%' }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.8 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login-img' : 'reg-img'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={isLogin ? registerImage : loginImage}
                alt={t('auth.unified.image.alt.healthcare')}
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${isLogin ? 'from-primary' : 'from-teal-800'} via-gray-900/40 to-transparent`} />
              
              <div className="absolute bottom-0 left-0 w-full p-12 text-white pointer-events-auto">
                {isLogin ? (
                  <>
                    <h2 className="text-4xl font-bold mb-4 drop-shadow-md">
                      {t('auth.unified.hero.joinTitle')}
                    </h2>
                    <p className="text-lg font-medium text-white/90 mb-8 max-w-sm drop-shadow-sm">
                      {t('auth.unified.hero.joinSubtitle')}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-semibold rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/20 w-max">
                      <span className="text-white/80">{t('auth.unified.hero.noAccount')}</span>
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors border border-white/30"
                      >
                        {t('auth.unified.hero.signUp')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-bold mb-4 drop-shadow-md">
                      {t('auth.unified.hero.welcomeBackTitle')}
                    </h2>
                    <p className="text-lg text-white/90 mb-8 max-w-sm drop-shadow-sm font-medium">
                      {t('auth.unified.hero.welcomeBackSubtitle')}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-semibold rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/20 w-max">
                      <span className="text-white/80">{t('auth.unified.hero.hasAccount')}</span>
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors border border-white/30"
                      >
                        {t('auth.unified.hero.logIn')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 
          FORM CONTAINERS 
        */}
        
        {/* Register Form Area (Left) */}
        <div className={`w-full md:w-1/2 h-full flex flex-col pt-8 pb-10 px-6 sm:px-12 md:px-16 overflow-y-auto ${isLogin ? 'hidden md:flex opacity-0 pointer-events-none' : 'flex opacity-100'}`}>
          <div className="w-full max-w-md mx-auto my-auto space-y-6 md:space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30 mb-8 md:hidden">
                M
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {t('auth.unified.register.title')}
              </h2>
              <p className="text-gray-500 text-sm">{t('auth.unified.register.chwOnlyNote')}</p>
            </div>
            
            <form onSubmit={onRegisterSubmit} className="space-y-5">
              <div>
                <FieldIconWrap icon={UserIcon}>
                  <input
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder={t('auth.unified.register.placeholder.fullName')}
                    className={inputClass}
                  />
                </FieldIconWrap>
              </div>
              <div>
                <FieldIconWrap icon={MailIcon}>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t('auth.unified.register.placeholder.email')}
                    className={inputClass}
                  />
                </FieldIconWrap>
              </div>
              <div>
                <FieldIconWrap icon={LockIcon}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder={t('auth.unified.register.placeholder.password')}
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                    {showRegPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </FieldIconWrap>
              </div>
              <div>
                <FieldIconWrap icon={PhoneIcon}>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                    minLength={7}
                    placeholder={t('auth.unified.register.placeholder.phone')}
                    className={inputClass}
                    autoComplete="tel"
                  />
                </FieldIconWrap>
              </div>
              <div>
                <FieldIconWrap icon={MapPinIcon}>
                  <input
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    placeholder={t('auth.unified.register.placeholder.district')}
                    className={inputClass}
                    autoComplete="off"
                  />
                </FieldIconWrap>
              </div>

              <button type="submit" disabled={regSubmitting || !ready} className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20 hover:shadow-lg active:scale-[0.98]">
                {regSubmitting
                  ? t('auth.unified.register.submit.creating')
                  : t('auth.unified.register.submit.createAccount')}
              </button>
            </form>

            <div className="md:hidden text-center text-sm font-medium text-gray-500 pt-4 border-t border-gray-100">
              {t('auth.unified.register.mobile.signIn')}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary hover:underline cursor-pointer bg-transparent border-0 p-0 font-inherit"
              >
                {t('auth.unified.register.mobile.signInLink')}
              </button>
            </div>
          </div>
        </div>

        {/* Login Form Area (Right) */}
        <div className={`w-full md:w-1/2 h-full flex flex-col pt-8 pb-10 px-6 sm:px-12 md:px-16 overflow-y-auto md:ml-auto ${!isLogin ? 'hidden md:flex opacity-0 pointer-events-none' : 'flex opacity-100'}`}>
          <div className="w-full max-w-md mx-auto my-auto space-y-6 md:space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30 mb-8 md:hidden">
                M
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {t('auth.unified.login.title')}
              </h2>
              <p className="text-gray-500 font-medium">{t('auth.unified.login.subtitle')}</p>
            </div>
            
            <form onSubmit={onLoginSubmit} className="space-y-5">
              <div className="space-y-1">
                <FieldIconWrap icon={MailIcon}>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t('auth.unified.register.placeholder.email')}
                    className={inputClass}
                  />
                </FieldIconWrap>
              </div>
              <div className="space-y-1">
                <FieldIconWrap icon={LockIcon}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder={t('auth.unified.login.placeholder.password')}
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                    {showLoginPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </FieldIconWrap>
                <div className="flex justify-end pt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('auth.unified.login.forgotPassword')}
                  </Link>
                </div>
              </div>
              
              <button type="submit" disabled={loginSubmitting || !ready} className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20 hover:shadow-lg active:scale-[0.98]">
                <LogInIcon size={20} strokeWidth={2} />
                {loginSubmitting
                  ? t('auth.unified.login.submit.signingIn')
                  : t('auth.unified.login.submit.signIn')}
              </button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t('auth.unified.login.divider')}
                </span>
              </div>
            </div>

            <button type="button" disabled={loginSubmitting || !googleConfigured} onClick={startGoogle} className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-base font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 active:scale-[0.98]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('auth.unified.login.google')}
            </button>

            <div className="md:hidden text-center text-sm font-medium text-gray-500 pt-4 border-t border-gray-100">
              {t('auth.unified.login.mobile.signUp')}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-primary hover:underline cursor-pointer bg-transparent border-0 p-0 font-inherit"
              >
                {t('auth.unified.login.mobile.signUpLink')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
