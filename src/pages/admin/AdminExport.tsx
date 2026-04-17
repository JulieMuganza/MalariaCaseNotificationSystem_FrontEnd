import React from 'react';
import {
  FileSpreadsheetIcon,
  ImageIcon,
  FileTextIcon,
  DownloadIcon } from
'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { getStoredAccessToken } from '../../lib/api';

async function downloadCasesCsv() {
  const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const token = getStoredAccessToken();
  const res = await fetch(`${BASE}/api/v1/cases/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    toast.error(text || 'Export failed');
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'malaria-cases-export.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV download started');
}
const exportOptions = [
{
  title: 'Full Dataset (CSV)',
  description:
  'Export all case data including demographics, symptoms, and outcomes',
  icon: FileSpreadsheetIcon,
  format: 'CSV',
  color: 'bg-success-50 text-success-700 border-success-200'
},
{
  title: 'Full Dataset (Excel)',
  description:
  'Export with multiple sheets: Cases, Risk Factors, EIDSR Comparison',
  icon: FileSpreadsheetIcon,
  format: 'XLSX',
  color: 'bg-teal-50 text-teal-700 border-teal-200'
},
{
  title: 'Maps (PNG)',
  description: 'Export district maps with case distribution and heatmaps',
  icon: ImageIcon,
  format: 'PNG',
  color: 'bg-blue-50 text-blue-700 border-blue-200'
},
{
  title: 'Summary Report (PDF)',
  description:
  'Generate a comprehensive report with charts, tables, and analysis',
  icon: FileTextIcon,
  format: 'PDF',
  color: 'bg-purple-50 text-purple-700 border-purple-200'
}];

export function AdminExport() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Data Export</h1>
        <p className="text-sm text-gray-500">
          Download data in various formats for reporting and analysis
        </p>
      </div>

      <div className="space-y-4">
        {exportOptions.map((opt, i) =>
        <motion.div
          key={opt.title}
          initial={{
            opacity: 0,
            y: 8
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: i * 0.05
          }}
          className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${opt.color}`}>
          
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
              <opt.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{opt.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
            </div>
            <button
            type="button"
            onClick={() => {
              if (opt.format === 'CSV') {
                void downloadCasesCsv();
                return;
              }
              toast.info('MVP: use CSV export for live data');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            
              <DownloadIcon size={14} /> Export {opt.format}
            </button>
          </motion.div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Export Notes</h3>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li>• Data covers the period July 2025 – March 2026</li>
          <li>
            • All exports include data from all 8 districts of Southern Province
          </li>
          <li>• Personal identifiers are anonymized in exported datasets</li>
          <li>
            • PDF reports include executive summary, methodology, and findings
          </li>
        </ul>
      </div>
    </div>);

}