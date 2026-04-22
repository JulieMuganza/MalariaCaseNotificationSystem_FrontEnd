import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { HomeIcon, LogInIcon, ArrowLeftIcon, MapPinOffIcon } from 'lucide-react';
import { LanguageToggle } from '../components/shared/LanguageToggle';

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <header className="relative z-10 flex justify-end px-4 py-4 sm:px-8">
        <LanguageToggle variant="light" />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg text-center"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20">
            <MapPinOffIcon className="h-10 w-10" strokeWidth={1.75} aria-hidden />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            {t('notFound.code')}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t('notFound.title')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {t('notFound.description')}
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <HomeIcon size={18} strokeWidth={2.25} aria-hidden />
              {t('notFound.home')}
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <LogInIcon size={18} strokeWidth={2.25} aria-hidden />
              {t('notFound.signIn')}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeftIcon size={16} strokeWidth={2.25} aria-hidden />
            {t('notFound.goBack')}
          </button>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/60 py-4 text-center text-xs text-slate-500 backdrop-blur-sm">
        {t('appTitle')}
      </footer>
    </div>
  );
}
