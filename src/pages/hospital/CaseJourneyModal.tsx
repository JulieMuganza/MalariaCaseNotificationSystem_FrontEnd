import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import type { MalariaCase } from '../../types/domain';

const roleColors: Record<string, string> = {
  CHW: 'bg-slate-100 text-slate-700 border-slate-200',
  'Health Center': 'bg-blue-100 text-blue-800 border-blue-200',
  Hospital: 'bg-purple-100 text-purple-800 border-purple-200',
  'District Hospital': 'bg-purple-100 text-purple-800 border-purple-200',
  'Referral Hospital':
    'bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)] border-[color:var(--role-accent)]/25',
};

export function CaseJourneyModal({
  c,
  onClose,
  title,
}: {
  c: MalariaCase | null;
  onClose: () => void;
  title?: string;
}) {
  const open = Boolean(c);

  return (
    <AnimatePresence>
      {open && c && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.28 }}
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {title ?? 'Patient journey'}
                </p>
                <p className="truncate font-mono text-[11px] text-slate-500">{c.id}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="max-h-[calc(85vh-52px)] overflow-y-auto px-4 py-3">
              <div className="space-y-0">
                {c.timeline.map((t, i) => (
                  <div key={`${t.timestamp}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      {i < c.timeline.length - 1 && (
                        <div className="my-0.5 w-0.5 flex-1 bg-blue-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900">{t.event}</p>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                            roleColors[t.role] ||
                            'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{t.actor}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(t.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
