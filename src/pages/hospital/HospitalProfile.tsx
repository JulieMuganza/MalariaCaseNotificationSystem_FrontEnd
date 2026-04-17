import { UserIcon, MailIcon, MapPinIcon, HashIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function HospitalProfile() {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const en = language === 'en';

  const facility =
    user?.role === 'Referral Hospital'
      ? en
        ? 'Referral Hospital'
        : 'Ibitaro bwohereza'
      : en
        ? 'District Hospital'
        : 'Ibitaro by\'akarere';

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {en ? 'Your profile' : 'Umwirondoro'}
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-400">
          {facility} · {user?.district ?? '—'}
        </p>
      </div>

      <div
        className="rounded-2xl border border-[color:var(--role-accent)]/20 bg-white p-8 shadow-sm"
      >
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--role-accent)] text-white shadow-md"
        >
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
              <dt className="text-sm font-semibold text-gray-500">Email</dt>
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
              <dd className="mt-1 font-semibold text-gray-900">{user?.role ?? '—'}</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
