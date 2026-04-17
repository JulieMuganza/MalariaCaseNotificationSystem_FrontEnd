import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeIcon } from 'lucide-react';

export function LanguageToggle({
  variant = 'dark',
}: {
  variant?: 'dark' | 'light';
}) {
  const { i18n, t } = useTranslation();
  const nextLng = i18n.language.startsWith('rw') ? 'en' : 'rw';
  const styles =
    variant === 'dark'
      ? 'bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-2'
      : 'bg-white hover:bg-[#F3F4F6] text-[#6B7280] rounded-full border border-[#E5E7EB] h-10 px-4 shadow-sm';
  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(nextLng)}
      className={`flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors active:scale-95 ${styles}`}
      aria-label={t('shared.language.aria.toggle')}
    >
      <GlobeIcon size={16} />
      <span>{nextLng === 'rw' ? 'RW' : 'EN'}</span>
    </button>
  );
}
