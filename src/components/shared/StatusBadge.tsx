import { useTranslation } from 'react-i18next';
import type { CaseStatus } from '../../data/mockData';
const statusConfig: Record<
  CaseStatus,
  {
    bg: string;
    text: string;
    dot: string;
  }> =
{
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  Referred: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  'HC Received': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500'
  },
  Escalated: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500'
  },
  Admitted: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500'
  },
  Treated: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    dot: 'bg-success-500'
  },
  Discharged: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    dot: 'bg-success-600'
  },
  Resolved: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400'
  },
  Deceased: {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    dot: 'bg-danger-600'
  }
};
export function StatusBadge({ status }: {status: CaseStatus;}) {
  const { i18n } = useTranslation();
  const en = !i18n.language.startsWith('rw');
  const config = statusConfig[status] || statusConfig.Pending;
  const normalized = status === 'Treated' ? 'Discharged' : status;
  const labels: Record<string, string> = {
    Pending: en ? 'Pending' : 'Bitegereje',
    Referred: en ? 'Referred' : 'Byoherejwe',
    'HC Received': en ? 'HC received' : 'Byakiriwe ku kigonderabuzima',
    Escalated: en ? 'Escalated' : 'Byazamuwe',
    Admitted: en ? 'Admitted' : 'Byakiriwe mu bitaro',
    Treated: en ? 'Treated' : 'Yazamuwe',
    Discharged: en ? 'Discharged' : 'Yasezerewe',
    Resolved: en ? 'Resolved' : 'Yasezerewe',
    Deceased: en ? 'Deceased' : 'Yitabye Imana',
  };
  const label = labels[normalized] ?? normalized;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>);

}