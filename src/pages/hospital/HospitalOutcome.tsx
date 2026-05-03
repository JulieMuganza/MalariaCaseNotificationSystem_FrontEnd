import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useHospitalBasePath } from './useHospitalBasePath';
import { useTranslation } from 'react-i18next';
export function HospitalOutcome() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCaseByRef, loading, patchCase } = useCasesApi();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const en = !i18n.language.startsWith('rw');
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

  useEffect(() => {
    if (!c) return;
    const fromCase =
      user?.role === 'Referral Hospital'
        ? c.severeMalariaTestResult
        : c.dhSevereMalariaTestResult;
    setSmResult(fromCase ?? '');
    setManagement(c.hospitalManagementMedication ?? '');
  }, [c?.id, user?.role, c?.severeMalariaTestResult, c?.dhSevereMalariaTestResult, c?.hospitalManagementMedication]);

  if (loading && !c)
    return <div className="py-12 text-center text-gray-500">{en ? 'Loading…' : 'Birakorwa...'}</div>;
  if (!c)
  return <div className="py-12 text-center text-gray-500">{en ? 'Case not found' : 'Dosiye ntiyabonetse'}</div>;
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
        
        <ChevronLeftIcon size={16} /> {en ? 'Back' : 'Subira inyuma'}
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{en ? 'Log outcome' : 'Andika ibyavuye mu buvuzi'}</h1>
        <p className="text-sm text-gray-500">
          {c.id} — {c.patientName}{' '}
          <span className="font-mono text-xs">({c.patientCode})</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {en
              ? user?.role === 'Referral Hospital'
                ? 'Severe malaria result (referral hospital)'
                : 'Severe malaria result (district hospital)'
              : user?.role === 'Referral Hospital'
                ? "Ibisubizo bya malariya ikomeye (ibitaro byoherezwaho)"
                : "Ibisubizo bya malariya ikomeye (ibitaro by'akarere)"}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['Positive', 'Negative'] as const).map((r) =>
            <button
              key={r}
              type="button"
              onClick={() => setSmResult(r)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${smResult === r ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {en ? r : r === 'Positive' ? 'Byagaragaye' : 'Nta byagaragaye'}
            </button>
            )}
          </div>
        </div>

        {smResult === 'Positive' &&
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {en ? 'Management / medicines (internal — not in partial notifications)' : 'Ubuyobozi bw\'ubuvuzi / imiti (imbere muri sisitemu gusa)'}
            </label>
            <textarea
            value={management}
            onChange={(e) => setManagement(e.target.value)}
            rows={3}
            placeholder={en ? 'Record treatment given (visible to Hospital & RICH full feed only)' : 'Andika ubuvuzi bwatanzwe (burebwa na Hospital na RICH gusa)'}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none" />
          
            <p className="text-[11px] text-amber-800 mt-1.5">
              {en ? 'Omitted from partial Phase retour messages to HC and CHW.' : 'Ntibijya mu butumwa bugufi bwoherezwa kuri HC na CHW.'}
            </p>
          </div>
        }

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {en ? 'Clinical outcome' : 'Ibyavuye mu buvuzi'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {coreOutcomes.map((o) =>
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${outcome === o ? o === 'Deceased' ? 'border-danger-500 bg-danger-50 text-danger-700' : o === 'Recovered' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {en ? o : o === 'Improving' ? 'Arimo koroherwa' : o === 'Admitted' ? 'Ari mu bitaro' : o === 'Recovered' ? 'Yakize' : 'Yitabye Imana'}
            </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {en ? 'Use ' : 'Koresha '}
            <span className="font-semibold">{en ? 'Improving' : 'Arimo koroherwa'}</span>
            {en ? ' or ' : ' cyangwa '}
            <span className="font-semibold">{en ? 'Admitted' : 'Ari mu bitaro'}</span>
            {en ? ' to keep the patient in active care.' : ' kugira ngo umurwayi akomeze kwitabwaho.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {en ? 'Date of outcome (summary)' : 'Itariki y\'ibyavuye mu buvuzi'}
          </label>
          <input
            type="date"
            value={outcomeDate}
            onChange={(e) => setOutcomeDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {en ? 'Date & time of discharge' : 'Itariki n\'isaha yo gusezererwa'}
          </label>
          <input
            type="datetime-local"
            value={dischargeDateTime}
            onChange={(e) => setDischargeDateTime(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {en ? 'Notes' : 'Ibisobanuro'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={en ? 'Additional notes...' : 'Andi makuru...'}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none" />
          
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
          
          <SendIcon size={16} /> {en ? 'Save outcome update' : 'Bika ivugurura ry\'ibyavuye mu buvuzi'}
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={async () => {
          if (!c) return;
          if (!smResult || !outcome) {
            toast.error(en ? 'Select severe malaria result and clinical outcome.' : 'Hitamo ibisubizo bya malariya ikomeye n\'ibyavuye mu buvuzi.');
            return;
          }
          try {
            const deceased = outcome === 'Deceased';
            const recovered = outcome === 'Recovered';
            const stillAdmitted = outcome === 'Admitted' || outcome === 'Improving';
            const severeField =
              user?.role === 'Referral Hospital'
                ? { severeMalariaTestResult: smResult }
                : { dhSevereMalariaTestResult: smResult };
            await patchCase(c.id, {
              ...severeField,
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
            toast.success(en ? 'Outcome update saved' : 'Ivugurura ry\'ibyavuye mu buvuzi ryabitswe');
            setShowConfirm(false);
            navigate(base);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : en ? 'Could not save outcome' : 'Ntibyashobotse kubika ibyavuye mu buvuzi'
            );
          }
        }}
        title={en ? 'Submit to EIDSR?' : 'Ohereza muri EIDSR?'}
        message={en ? 'This will save the current hospital outcome and update surveillance data.' : 'Ibi bibika ibyavuye mu buvuzi kandi bivugurure amakuru y\'igenzura.'}
        confirmText={en ? 'Save' : 'Bika'}
        confirmColor="amber" />
      
    </div>);

}