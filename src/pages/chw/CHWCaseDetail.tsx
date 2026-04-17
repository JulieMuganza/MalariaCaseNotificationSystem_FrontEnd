import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon } from
'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PatientJourneyTimeline } from '../../components/dashboard/PatientJourneyTimeline';
import { useCasesApi } from '../../context/CasesContext';
export function CHWCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCaseByRef, loading } = useCasesApi();
  const c = id ? getCaseByRef(id) : undefined;
  if (loading && !c) {
    return (
      <div className="px-4 py-12 text-center lg:px-0 text-gray-500 text-sm">
        Loading…
      </div>
    );
  }
  if (!c) {
    return (
      <div className="px-4 py-12 text-center lg:px-0">
        <p className="text-gray-500">Case not found</p>
        <button
          onClick={() => navigate('/chw/cases')}
          className="mt-4 text-blue-600 font-medium text-sm">
          
          Go back
        </button>
      </div>);

  }
  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate('/chw/cases')}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        
        <ChevronLeftIcon size={16} /> Back to patients
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
      <div className="space-y-4 xl:col-span-1">
      {/* Patient card */}
      <motion.div
        initial={{
          opacity: 0,
          y: 8
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-1">
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {c.patientName.
            split(' ').
            map((n) => n[0]).
            join('')}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">
              {c.patientName}
            </h2>
            <p className="text-xs text-gray-500">
              {c.id} •{' '}
              <span className="font-mono">{c.patientCode}</span>
            </p>
          </div>
          <StatusBadge status={c.status} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-500">
            <UserIcon size={14} /> {c.sex}, {c.age}y
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPinIcon size={14} /> {c.village}, {c.sector}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <ClockIcon size={14} /> {new Date(c.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="w-3.5 h-3.5 rounded-full bg-danger-100 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
            </span>
            {c.symptomCount} symptoms
          </div>
        </div>
      </motion.div>
      <PatientJourneyTimeline c={c} />
      </div>

      <div className="space-y-4 xl:col-span-2">
      {/* Timeline events */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 sm:text-base">Activity log</h3>
        <div className="space-y-3">
          {c.timeline.map((t, i) =>
          <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5" />
                {i < c.timeline.length - 1 &&
              <div className="w-0.5 flex-1 bg-emerald-200 mt-1" />
              }
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-gray-900">{t.event}</p>
                <p className="text-xs text-gray-500">
                  {t.actor} • {t.role}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(t.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      </div>
      </div>
    </div>);

}