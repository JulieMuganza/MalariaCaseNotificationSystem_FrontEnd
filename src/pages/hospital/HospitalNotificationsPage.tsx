import { useNavigate } from 'react-router-dom';
import { BellIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useHospitalBasePath } from './useHospitalBasePath';

export function HospitalNotificationsPage() {
  const { notifications, markNotificationRead, user } = useAuth();
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const base = useHospitalBasePath();
  const en = language === 'en';

  const inboxRole =
    user?.role === 'Referral Hospital' ? 'Referral Hospital' : 'District Hospital';

  const list = notifications
    .filter((n) => n.targetRole === inboxRole)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {en ? 'Notifications' : 'Amakuru'}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-400">
            {en
              ? 'Alerts for your hospital tier and district.'
              : 'Amakuru yawe.'}
          </p>
        </div>
        <div
          className="flex h-10 items-center rounded-xl bg-[color:var(--role-accent)] px-4 text-sm font-semibold text-white"
        >
          <BellIcon size={16} className="mr-2 opacity-90" />
          {list.length} {en ? 'total' : 'byose'}
        </div>
      </div>

      <ul className="space-y-4">
        {list.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <p className="text-sm font-medium text-gray-400">
              {en ? 'No notifications yet.' : 'Nta makuru.'}
            </p>
          </li>
        ) : (
          list.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border p-6 shadow-sm ${
                n.read
                  ? 'border-gray-100 bg-white'
                  : 'border-[color:var(--role-accent)]/30 bg-[color:var(--role-accent-soft)] ring-1 ring-[color:var(--role-accent)]/15'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-bold text-gray-900">{n.title}</p>
                <span className="text-sm font-medium text-gray-500">
                  {new Date(n.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {n.message || (en ? '(No message body)' : 'Nta butumwa')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => void markNotificationRead(n.id)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {en ? 'Mark read' : 'Soma'}
                  </button>
                )}
                {n.caseId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!n.read) await markNotificationRead(n.id);
                      navigate(`${base}/case/${n.caseId}`);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-[color:var(--role-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {en ? 'Open case' : 'Fungura dosiye'}
                    <ChevronRightIcon size={14} />
                  </button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
