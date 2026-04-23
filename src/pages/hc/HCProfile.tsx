import { UserIcon, MailIcon, MapPinIcon, HashIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { hcPage } from '../../theme/appShell';

export function HCProfile() {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';
  const isHealthPost = user?.role === 'Local Clinic';
  const roleLabel =
    isHealthPost
      ? en
        ? 'Health Post'
        : 'Ivuriro Riciriritse'
      : (user?.role ?? '—');
  const accountLabel =
    isHealthPost
      ? en
        ? 'Health Post account details'
        : "Konti y'ivuriro riciriritse"
      : en
        ? 'Health Center account details'
        : "Konti y'ikigo nderabuzima";

  return (
    <div className={hcPage.wrap}>
      <div>
        <h1 className={hcPage.title}>
          {en ? 'Your profile' : 'Umwirondoro'}
        </h1>
        <p className={hcPage.desc}>
          {accountLabel}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--role-accent)] text-white shadow-md">
          <UserIcon size={32} />
        </div>
        <dl className="grid gap-6 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm font-semibold text-gray-500">
                {en ? 'Name' : 'Amazina'}
              </dt>
              <dd className="mt-1 font-semibold text-gray-900">{user?.name ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm font-semibold text-gray-500">
                Email
              </dt>
              <dd className="mt-1 font-semibold text-gray-900">{user?.email ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm font-semibold text-gray-500">
                {en ? 'District' : 'Akarere'}
              </dt>
              <dd className="mt-1 font-semibold text-gray-900">{user?.district ?? '—'}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <HashIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm font-semibold text-gray-500">
                {en ? 'Role' : 'Uruhare'}
              </dt>
              <dd className="mt-1 font-semibold text-gray-900">{roleLabel}</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
