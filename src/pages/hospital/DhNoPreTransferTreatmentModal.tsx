import { useMemo, useState } from 'react';
import { CalculatorIcon, PlusIcon, SaveIcon, XIcon } from 'lucide-react';

type DoseRow = { drug: string; dose: string; route: string; time: string };

type Props = {
  open: boolean;
  onClose: () => void;
  existingHcPreTreatment: string[];
  onSave: (lines: string[]) => Promise<void>;
};

/** When HC did not give pre-transfer treatment: capture weight + ART-style doses at DH (same math as HC clinical file). */
export function DhNoPreTransferTreatmentModal({
  open,
  onClose,
  existingHcPreTreatment,
  onSave,
}: Props) {
  const [weight, setWeight] = useState<number | ''>('');
  const [selectedDrug, setSelectedDrug] = useState<'Artesunate' | 'Artemeter'>('Artesunate');
  const [log, setLog] = useState<DoseRow[]>([]);
  const [saving, setSaving] = useState(false);

  const suggested = useMemo(() => {
    if (!weight || typeof weight !== 'number') return null;
    if (selectedDrug === 'Artesunate') {
      const perKg = weight <= 20 ? 3.0 : 2.4;
      return {
        val: (weight * perKg).toFixed(1),
        unit: 'mg',
        label: `Artesunate (${perKg} mg/kg)`,
      };
    }
    return {
      val: (weight * 3.2).toFixed(1),
      unit: 'mg',
      label: 'Artemeter IM (3.2 mg/kg)',
    };
  }, [weight, selectedDrug]);

  if (!open) return null;

  function addDoseFromSuggestion() {
    if (!suggested) return;
    setLog((prev) => [
      ...prev,
      {
        drug: selectedDrug,
        dose: `${suggested.val} ${suggested.unit}`,
        route: selectedDrug === 'Artesunate' ? 'IV' : 'IM',
        time: new Date().toISOString(),
      },
    ]);
  }

  async function handleSave() {
    if (!weight || typeof weight !== 'number') return;
    const modeLine =
      'Pre-transfer mode: DH (no HC handoff — treatment started at district hospital)';
    const wLine = `DH weight (kg): ${weight}`;
    const doseLines = log.map(
      (e) =>
        `${e.drug} ${e.dose} ${e.route} @ ${new Date(e.time).toLocaleString()}`
    );
    const merged = [
      ...existingHcPreTreatment.filter(
        (x) => !x.toLowerCase().startsWith('dh weight')
      ),
      modeLine,
      wLine,
      ...doseLines,
    ];
    setSaving(true);
    try {
      await onSave(merged);
      onClose();
      setLog([]);
      setWeight('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Pre-transfer treatment at district hospital
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              No HC handoff — enter weight, review suggested dose, add doses, then save (same logic as health center
              clinical file).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Weight (kg)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={weight === '' ? '' : weight}
              onChange={(e) => {
                const v = e.target.value;
                setWeight(v === '' ? '' : Number(v));
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Drug</label>
            <div className="flex gap-2">
              {(['Artesunate', 'Artemeter'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDrug(d)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${
                    selectedDrug === d
                      ? 'bg-[color:var(--role-accent-soft)] ring-[color:var(--role-accent)]'
                      : 'bg-white ring-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {suggested && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
              <CalculatorIcon size={18} className="text-slate-500" />
              <span className="font-medium text-slate-800">
                Suggested: {suggested.val} {suggested.unit}
              </span>
              <span className="text-xs text-slate-500">({suggested.label})</span>
              <button
                type="button"
                onClick={addDoseFromSuggestion}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[color:var(--role-accent)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <PlusIcon size={14} /> Add dose
              </button>
            </div>
          )}
          {log.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-800">
              {log.map((e, i) => (
                <li key={i}>
                  {e.drug} {e.dose} {e.route} @ {new Date(e.time).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !weight || log.length === 0}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--role-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <SaveIcon size={18} />
            {saving ? 'Saving…' : 'Save treatment'}
          </button>
        </div>
      </div>
    </div>
  );
}
