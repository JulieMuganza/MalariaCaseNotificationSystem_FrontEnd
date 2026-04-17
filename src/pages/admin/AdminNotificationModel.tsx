import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend } from
'recharts';
import { DISTRICTS } from '../../data/mockData';
import { useCasesApi } from '../../context/CasesContext';

type DistrictRow = {
  district: string;
  systemCases: number;
  eidsrCases: number;
  gap: number;
  gapPercent: number;
};

export function AdminNotificationModel() {
  const { cases } = useCasesApi();

  const eidsrComparison = useMemo((): DistrictRow[] => {
    return DISTRICTS.map((district) => {
      const inDistrict = cases.filter((c) => c.district === district);
      const systemCases = inDistrict.length;
      const eidsrCases = inDistrict.filter((c) => c.reportedToEIDSR).length;
      const gap = systemCases - eidsrCases;
      const gapPercent =
        systemCases > 0 ? Math.round((gap / systemCases) * 100) : 0;
      return {
        district,
        systemCases,
        eidsrCases,
        gap,
        gapPercent,
      };
    });
  }, [cases]);

  const totalSystem = eidsrComparison.reduce((a, b) => a + b.systemCases, 0);
  const totalEIDSR = eidsrComparison.reduce((a, b) => a + b.eidsrCases, 0);
  const totalGap = totalSystem - totalEIDSR;
  const overallGapPct =
  totalSystem > 0 ? Math.round(totalGap / totalSystem * 100) : 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Notification Model Comparison
        </h1>
        <p className="text-sm text-gray-500">
          EIDSR reported cases vs. system-captured cases (live data by district)
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-teal-50 rounded-xl border border-teal-100 p-4">
          <p className="text-xs font-medium text-teal-600">System Cases</p>
          <p className="text-2xl font-bold text-teal-800">{totalSystem}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-xs font-medium text-blue-600">EIDSR Reported</p>
          <p className="text-2xl font-bold text-blue-800">{totalEIDSR}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-xs font-medium text-amber-600">Gap (Unreported)</p>
          <p className="text-2xl font-bold text-amber-800">{totalGap}</p>
        </div>
        <div className="bg-danger-50 rounded-xl border border-danger-100 p-4">
          <p className="text-xs font-medium text-danger-600">Gap Percentage</p>
          <p className="text-2xl font-bold text-danger-800">{overallGapPct}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Side-by-Side Comparison by District
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={eidsrComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="district"
              tick={{
                fontSize: 11
              }} />
            
            <YAxis
              tick={{
                fontSize: 11
              }} />
            
            <Tooltip />
            <Legend />
            <Bar
              dataKey="systemCases"
              name="System Cases"
              fill="#0B6E6E"
              radius={[4, 4, 0, 0]} />
            
            <Bar
              dataKey="eidsrCases"
              name="EIDSR Reported"
              fill="#60a5fa"
              radius={[4, 4, 0, 0]} />
            
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gap Analysis Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            Gap Analysis by District
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
              'District',
              'System Cases',
              'EIDSR Reported',
              'Gap',
              'Gap %'].
              map((h) =>
              <th
                key={h}
                className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                
                  {h}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {eidsrComparison.map((d) =>
            <tr key={d.district} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">
                  {d.district}
                </td>
                <td className="px-5 py-3 text-gray-700">{d.systemCases}</td>
                <td className="px-5 py-3 text-gray-700">{d.eidsrCases}</td>
                <td className="px-5 py-3 font-semibold text-amber-600">
                  {d.gap}
                </td>
                <td className="px-5 py-3">
                  <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.gapPercent > 40 ? 'bg-danger-100 text-danger-700' : d.gapPercent > 20 ? 'bg-amber-100 text-amber-700' : 'bg-success-100 text-success-700'}`}>
                  
                    {d.gapPercent}%
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}
