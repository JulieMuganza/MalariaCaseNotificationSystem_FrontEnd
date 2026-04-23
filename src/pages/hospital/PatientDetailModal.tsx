import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import type { MalariaCase } from '../../types/domain';
import { mergedSymptoms } from './caseHelpers';

const roleColors: Record<string, string> = {
  CHW: 'bg-slate-100 text-slate-700 border-slate-200',
  'Health Center': 'bg-blue-100 text-blue-800 border-blue-200',
  Hospital: 'bg-purple-100 text-purple-800 border-purple-200',
  'District Hospital': 'bg-purple-100 text-purple-800 border-purple-200',
  'Referral Hospital':
    'bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent)] border-[color:var(--role-accent)]/25',
};

export function PatientDetailModal({
  c,
  onClose,
  onOpenCase,
  en,
}: {
  c: MalariaCase | null;
  onClose: () => void;
  onOpenCase: () => void;
  en: boolean;
}) {
  const open = Boolean(c);
  const sx = c ? mergedSymptoms(c) : [];

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
            className="max-h-[88vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-900">
                {en ? 'Patient' : 'Umurwayi'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label={en ? 'Close' : 'Funga'}
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="max-h-[calc(88vh-48px)] overflow-y-auto px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900">{c.patientName}</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {c.sex}, {c.age}y · {c.district}
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-400">
                {c.patientCode} · {c.id}
              </p>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {en ? 'Symptoms' : 'Ibimenyetso'}
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-800">
                  {sx.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {sx.length === 0 && (
                  <p className="text-xs text-slate-500">—</p>
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {en ? 'Timeline' : 'Uruhererekane'}
                </p>
                <div className="mt-2 space-y-2">
                  {c.timeline.slice(-12).map((t, i) => (
                    <div key={`${t.timestamp}-${i}`} className="text-xs">
                      <span className="font-medium text-slate-800">{t.event}</span>
                      <span className="ml-1 text-slate-400">
                        {new Date(t.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`ml-1 rounded border px-1 text-[10px] ${
                          roleColors[t.role] ||
                          'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {t.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenCase}
                className="mt-4 w-full rounded-xl bg-[color:var(--role-accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                {en ? 'Open case' : 'Fungura dosiye'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
