import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { useCasesApi } from '../../context/CasesContext';
export function AdminRiskFactors() {
  const { cases: mockCases } = useCasesApi();
  const total = mockCases.length;
  const pct = (count: number) =>
  total > 0 ? Math.round(count / total * 100) : 0;
  const tradMedicine = pct(
    mockCases.filter((c) => c.usedTraditionalMedicine).length
  );
  const lateCare = pct(
    mockCases.filter((c) => c.timeToSeekCare === '3 days+').length
  );
  const noInsurance = pct(mockCases.filter((c) => !c.hasInsurance).length);
  const noLLIN = pct(
    mockCases.filter(
      (c) => !c.preventionMeasures.includes('LLINs') || c.llinStatus === 'Torn'
    ).length
  );
  const farHC = pct(mockCases.filter((c) => c.distanceToHC === '> 2hrs').length);
  const riskData = [
  {
    factor: 'Traditional medicine first',
    percent: tradMedicine
  },
  {
    factor: 'Sought care after 3+ days',
    percent: lateCare
  },
  {
    factor: 'No health insurance',
    percent: noInsurance
  },
  {
    factor: 'No/torn LLINs',
    percent: noLLIN
  },
  {
    factor: 'Lives > 2hrs from HC',
    percent: farHC
  }];

  // Occupation breakdown
  const occupationCounts: Record<string, number> = {};
  mockCases.forEach((c) => {
    occupationCounts[c.occupation] = (occupationCounts[c.occupation] || 0) + 1;
  });
  const occupationData = Object.entries(occupationCounts).
  sort((a, b) => b[1] - a[1]).
  slice(0, 10).
  map(([name, count]) => ({
    name,
    count
  }));
  // Breeding sites
  const breedingCounts: Record<string, number> = {};
  mockCases.forEach((c) => {
    c.breedingSites.forEach((s) => {
      breedingCounts[s] = (breedingCounts[s] || 0) + 1;
    });
  });
  const breedingData = Object.entries(breedingCounts).
  sort((a, b) => b[1] - a[1]).
  map(([name, count]) => ({
    name: name.length > 20 ? name.slice(0, 20) + '...' : name,
    count
  }));
  // Comorbidities
  const comorbidCounts: Record<string, number> = {};
  mockCases.forEach((c) => {
    ;(c.vulnerabilities || []).forEach((v) => {
      if (v !== 'N/A') comorbidCounts[v] = (comorbidCounts[v] || 0) + 1;
    });
  });
  const comorbidData = Object.entries(comorbidCounts).
  sort((a, b) => b[1] - a[1]).
  map(([name, count]) => ({
    name,
    count,
    percent: pct(count)
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Risk Factors Analysis
        </h1>
        <p className="text-sm text-gray-500">
          Distribution of key risk factors among severe malaria cases
        </p>
      </div>

      {/* Key Risk Factors */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Key Risk Factor Prevalence
        </h3>
        <div className="space-y-3">
          {riskData.map((r) =>
          <div key={r.factor} className="flex items-center gap-4">
              <span className="text-sm text-gray-700 w-56 flex-shrink-0">
                {r.factor}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                className="h-full bg-amber-500 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{
                  width: `${Math.max(r.percent, 5)}%`
                }}>
                
                  <span className="text-xs font-bold text-white">
                    {r.percent}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Occupation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Occupation Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={occupationData}
              layout="vertical"
              margin={{
                left: 100
              }}>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{
                  fontSize: 11
                }} />
              
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fontSize: 10
                }}
                width={100} />
              
              <Tooltip />
              <Bar dataKey="count" fill="#0B6E6E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breeding Sites */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Breeding Sites Near Household
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={breedingData}
              layout="vertical"
              margin={{
                left: 120
              }}>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{
                  fontSize: 11
                }} />
              
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fontSize: 10
                }}
                width={120} />
              
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comorbidities */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Comorbidities</h3>
        <div className="grid grid-cols-4 gap-4">
          {comorbidData.map((c) =>
          <div key={c.name} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{c.count}</p>
              <p className="text-xs text-gray-500 mt-1">{c.name}</p>
              <p className="text-xs font-medium text-teal-700">
                {c.percent}% of cases
              </p>
            </div>
          )}
        </div>
      </div>
    </div>);

}