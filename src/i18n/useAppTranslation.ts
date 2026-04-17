import { useTranslation } from 'react-i18next';

/** Replaces legacy `useApp().language` + `t` from labels — use with `t('key')` */
export function useAppTranslation() {
  const { t, i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? ('rw' as const) : ('en' as const);
  return { t, i18n, language };
}
