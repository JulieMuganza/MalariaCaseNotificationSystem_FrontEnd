import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useHospitalBasePath } from './useHospitalBasePath';
export function HospitalOutcome() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCaseByRef, loading, patchCase } = useCasesApi();
  const { user } = useAuth();
  const base = useHospitalBasePath();
  const actorRole =
    user?.role === 'Referral Hospital'
      ? 'Referral Hospital'
      : 'District Hospital';
  const actorName = user?.name ?? actorRole;
  const c = id ? getCaseByRef(id) : undefined;
  const [outcome, setOutcome] = useState<
    'Improving' | 'Admitted' | 'Recovered' | 'Deceased' | ''
  >('');
  const [outcomeDate, setOutcomeDate] = useState('');
  const [dischargeDateTime, setDischargeDateTime] = useState('');
  const [smResult, setSmResult] = useState<'Positive' | 'Negative' | ''>('');
  const [management, setManagement] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  if (loading && !c)
    return <div className="py-12 text-center text-gray-500">Loading…</div>;
  if (!c)
  return <div className="py-12 text-center text-gray-500">Case not found</div>;
  const coreOutcomes = [
    'Improving',
    'Admitted',
    'Recovered',
    'Deceased',
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => navigate(base)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        
        <ChevronLeftIcon size={16} /> Back
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Log Outcome</h1>
        <p className="text-sm text-gray-500">
          {c.id} — {c.patientName}{' '}
          <span className="font-mono text-xs">({c.patientCode})</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severe malaria result
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['Positive', 'Negative'] as const).map((r) =>
            <button
              key={r}
              type="button"
              onClick={() => setSmResult(r)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${smResult === r ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {r}
            </button>
            )}
          </div>
        </div>

        {smResult === 'Positive' &&
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Management / medicines (internal — not in partial notifications)
            </label>
            <textarea
            value={management}
            onChange={(e) => setManagement(e.target.value)}
            rows={3}
            placeholder="Record treatment given (visible to Hospital & RICH full feed only)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none" />
          
            <p className="text-[11px] text-amber-800 mt-1.5">
              Omitted from partial Phase retour messages to HC and CHW.
            </p>
          </div>
        }

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical outcome
          </label>
          <div className="grid grid-cols-2 gap-3">
            {coreOutcomes.map((o) =>
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${outcome === o ? o === 'Deceased' ? 'border-danger-500 bg-danger-50 text-danger-700' : o === 'Recovered' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {o}
            </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Use <span className="font-semibold">Improving</span> or{' '}
            <span className="font-semibold">Admitted</span> to keep the patient in active care.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of outcome (summary)
          </label>
          <input
            type="date"
            value={outcomeDate}
            onChange={(e) => setOutcomeDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date & time of discharge
          </label>
          <input
            type="datetime-local"
            value={dischargeDateTime}
            onChange={(e) => setDischargeDateTime(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Additional notes..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none" />
          
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
          
          <SendIcon size={16} /> Save outcome update
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={async () => {
          if (!c) return;
          if (!smResult || !outcome) {
            toast.error('Select severe malaria result and clinical outcome.');
            return;
          }
          try {
            const deceased = outcome === 'Deceased';
            const recovered = outcome === 'Recovered';
            const stillAdmitted = outcome === 'Admitted' || outcome === 'Improving';
            await patchCase(c.id, {
              severeMalariaTestResult: smResult,
              hospitalManagementMedication:
                smResult === 'Positive' && management.trim()
                  ? management
                  : undefined,
              finalOutcomeHospital:
                recovered ? 'Recovered'
                : deceased ? 'Deceased'
                : undefined,
              outcomeDate: outcomeDate
                ? new Date(outcomeDate).toISOString()
                : undefined,
              hospitalDischargeDateTime:
                recovered && dischargeDateTime ?
                  new Date(dischargeDateTime).toISOString()
                : undefined,
              phaseRetourEligible: smResult === 'Positive',
              outcomeNotes: notes.trim() || undefined,
              outcome:
                deceased ? 'Deceased'
                : stillAdmitted ? 'Still Admitted'
                : 'Treated & Discharged',
              status:
                deceased ? 'Deceased'
                : outcome === 'Admitted' ? 'Admitted'
                : outcome === 'Improving' ? 'Treated'
                : 'Discharged',
              reportedToEIDSR: true,
              timelineEvent: {
                event:
                  deceased ? 'Hospital outcome recorded — deceased (EIDSR)'
                  : recovered ? 'Hospital outcome and discharge recorded'
                  : outcome === 'Admitted' ? 'Hospital outcome update — still admitted'
                  : 'Hospital outcome update — improving on treatment',
                actorName,
                actorRole,
              },
            });
            toast.success('Outcome update saved');
            setShowConfirm(false);
            navigate(base);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : 'Could not save outcome'
            );
          }
        }}
        title="Submit to EIDSR?"
        message="This will save the current hospital outcome and update surveillance data."
        confirmText="Save"
        confirmColor="amber" />
      
    </div>);

}