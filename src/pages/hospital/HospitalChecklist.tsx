import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { HOSPITAL_CHECKLIST_ITEMS } from '../../data/mockData';
import { useCasesApi } from '../../context/CasesContext';
import { useAuth } from '../../context/AuthContext';
import { useHospitalBasePath } from './useHospitalBasePath';
type ComplianceStatus = 'Compliant' | 'Non-compliant' | 'N/A';
export function HospitalChecklist() {
  const { i18n } = useTranslation();
  const en = i18n.language?.toLowerCase().startsWith('en');
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
  const [checklist, setChecklist] = useState<Record<string, ComplianceStatus>>(
    {}
  );
  useEffect(() => {
    if (c?.hospitalChecklist) {
      setChecklist(c.hospitalChecklist as Record<string, ComplianceStatus>);
    }
  }, [c?.id]);
  if (loading && !c)
    return (
      <div className="py-12 text-center text-gray-500">
        {en ? 'Loading…' : 'Birimo gutegurwa…'}
      </div>
    );
  if (!c)
  return (
    <div className="py-12 text-center text-gray-500">
      {en ? 'Case not found' : 'Dosiye ntiyabonetse'}
    </div>
  );
  const statusColors: Record<ComplianceStatus, string> = {
    Compliant: 'bg-success-600 text-white',
    'Non-compliant': 'bg-danger-600 text-white',
    'N/A': 'bg-gray-400 text-white'
  };
  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate(base)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        
        <ChevronLeftIcon size={16} /> {en ? 'Back' : 'Subira inyuma'}
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {en
            ? 'Case Management Checklist'
            : "Urutonde rw'igenzura ry'ubuvuzi bwa dosiye"}
        </h1>
        <p className="text-sm text-gray-500">
          {c.id} — {c.patientName}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {HOSPITAL_CHECKLIST_ITEMS.map((item) =>
        <div
          key={item}
          className="p-4 flex items-center justify-between gap-4">
          
            <p className="text-sm font-medium text-gray-900 flex-1">{item}</p>
            <div className="flex gap-2">
              {(
            ['Compliant', 'Non-compliant', 'N/A'] as ComplianceStatus[]).
            map((status) =>
            <button
              key={status}
              onClick={() =>
              setChecklist((prev) => ({
                ...prev,
                [item]: status
              }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${checklist[item] === status ? statusColors[status] + ' border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              
                  {status === 'Compliant'
                    ? (en ? 'Compliant' : 'Byubahirijwe')
                    : status === 'Non-compliant'
                      ? (en ? 'Non-compliant' : 'Ntibyubahirijwe')
                      : 'N/A'}
                </button>
            )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={async () => {
          if (!c) return;
          try {
            await patchCase(c.id, {
              hospitalChecklist: checklist,
              timelineEvent: {
                event: 'Hospital management checklist updated',
                actorName,
                actorRole,
              },
            });
            toast.success(en ? 'Checklist saved' : 'Urutonde rwabitswe');
            navigate(base);
          } catch (e) {
            toast.error(
              e instanceof Error
                ? e.message
                : en
                  ? 'Could not save checklist'
                  : 'Ntibyabashije kubika urutonde'
            );
          }
        }}
        className="flex items-center gap-2 px-6 py-3 bg-purple-700 text-white rounded-xl font-medium text-sm hover:bg-purple-800 transition-colors">
        
        <SaveIcon size={16} /> {en ? 'Save Checklist' : 'Bika urutonde'}
      </button>
    </div>);

}