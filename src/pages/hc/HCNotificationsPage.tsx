import { useNavigate } from 'react-router-dom';
import { BellIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { hcPage } from '../../theme/appShell';
import { useFirstLineBasePath } from './useFirstLineBasePath';

export function HCNotificationsPage() {
  const { notifications, markNotificationRead, user } = useAuth();
  const { i18n } = useTranslation();
  const base = useFirstLineBasePath();

  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const navigate = useNavigate();
  const en = language === 'en';

  const hcList = notifications
    .filter((n) => n.targetRole === user?.role)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return (
    <div className={hcPage.wrap}>
      <div className={hcPage.headerRow}>
        <div>
          <h1 className={hcPage.title}>
            {en ? 'Notifications' : 'Amakuru'}
          </h1>
          <p className={hcPage.desc}>
            {en
              ? 'Alerts for your district. Open a case when linked.'
              : 'Amakuru y\'akarere.'}
          </p>
        </div>
        <div className={hcPage.pill}>
          <BellIcon size={16} strokeWidth={2} />
          {hcList.length} {en ? 'total' : 'byose'}
        </div>
      </div>

      <ul className="space-y-4">
        {hcList.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <p className="text-sm font-medium text-gray-400">
              {en ? 'No notifications yet.' : 'Nta makuru.'}
            </p>
          </li>
        ) : (
          hcList.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border p-6 shadow-sm ${
                n.read
                  ? 'border-gray-100 bg-white'
                  : 'border-emerald-200/80 bg-emerald-50/30 ring-1 ring-emerald-100'
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
