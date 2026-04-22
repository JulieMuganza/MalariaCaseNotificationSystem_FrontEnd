import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/shared/LanguageToggle';

const heroImage = new URL('../assets/img/image (11).jpg', import.meta.url).href;
const teamImage = new URL('../assets/img/image (9).jpg', import.meta.url).href;
const patientImage = new URL('../assets/img/image (7).jpg', import.meta.url).href;

export function LandingPage() {
  const { t } = useTranslation();
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              {t('landing.brand.malaria')}
              <span className="text-primary text-opacity-80">{t('landing.brand.sync')}</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#hero" onClick={(e) => handleNavClick(e, 'hero')} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              {t('landing.nav.home')}
            </a>
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              {t('landing.nav.features')}
            </a>
            <a href="#trust" onClick={(e) => handleNavClick(e, 'trust')} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              {t('landing.nav.impact')}
            </a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageToggle variant="light" />
            <Link 
              to="/login?mode=login" 
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('landing.signIn')}
            </Link>
            <Link 
              to="/login?mode=register" 
              className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              {t('landing.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-24 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {t('landing.hero.badge')}
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
                {t('landing.hero.titleBefore')}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-500">
                  {t('landing.hero.titleHighlight')}
                </span>
                {t('landing.hero.titleAfter')}
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/login?mode=register" 
                  className="inline-flex justify-center items-center gap-2 bg-primary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 group"
                >
                  {t('landing.cta.joinNetwork')}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link 
                  to="/login?mode=login" 
                  className="inline-flex justify-center items-center px-8 py-4 rounded-full text-lg font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  {t('landing.cta.accessPortal')}
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto w-full max-w-lg lg:max-w-none"
            >
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt={t('landing.img.heroAlt')}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/0 to-gray-900/0"></div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -z-10 top-1/2 -right-12 w-72 h-72 bg-teal-400/20 blur-3xl rounded-full"></div>
              <div className="absolute -z-10 bottom-0 -left-12 w-64 h-64 bg-primary/20 blur-3xl rounded-full"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-16 bg-gray-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.feature1.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('landing.feature1.body')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.feature2.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('landing.feature2.body')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.feature3.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('landing.feature3.body')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                {t('landing.trust.title')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('landing.trust.subtitle')}
              </p>
              <ul className="space-y-4">
                {[t('landing.trust.bullet1'), t('landing.trust.bullet2'), t('landing.trust.bullet3')].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="pt-8">
                <div className="overflow-hidden rounded-3xl shadow-lg bg-gray-100 aspect-[3/4]">
                  <img
                    src={teamImage}
                    alt={t('landing.img.teamAlt')}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </div>
              <div>
                <div className="overflow-hidden rounded-3xl shadow-lg bg-gray-100 aspect-[3/4]">
                  <img
                    src={patientImage}
                    alt={t('landing.img.patientAlt')}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
              M
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {t('landing.brand.malaria')}
              <span className="text-primary text-opacity-80">{t('landing.brand.sync')}</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {t('landing.footer.copyright')}
          </p>
          <div className="flex gap-4">
             <a href="#" className="text-gray-400 hover:text-gray-600">{t('landing.footer.privacy')}</a>
             <a href="#" className="text-gray-400 hover:text-gray-600">{t('landing.footer.terms')}</a>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            aria-label={t('landing.backToTop')}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
