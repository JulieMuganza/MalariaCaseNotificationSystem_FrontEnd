import { MessageSquareIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSurveillancePartnerLabel } from './useSurveillanceBasePath';

export function RichMessagesPage() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const partnerLabel = useSurveillancePartnerLabel();

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--role-accent)]">
            {partnerLabel}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {en ? 'Messages' : 'Ubutumwa'}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-400">
            {en
              ? 'Secure messaging with districts and facilities (coming soon).'
              : 'Ubutumwa bwihari.'}
          </p>
        </div>
        <div className="flex h-10 items-center rounded-xl bg-[color:var(--role-accent)] px-4 text-sm font-semibold text-white">
          <MessageSquareIcon size={16} className="mr-2 text-white/80" />
          {partnerLabel}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-10 shadow-sm">
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
          {en
            ? 'Structured handoffs use the notification center and case records. Direct messaging can be connected here for district coordination.'
            : 'Ubutumwa bwihari buzashyirwaho hano.'}
        </p>
      </div>
    </div>
  );
}
