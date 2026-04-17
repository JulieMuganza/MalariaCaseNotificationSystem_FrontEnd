import React from 'react';
import { SparklinePolyline } from './MiniSparkline';

function sparkTone(trend: { pct: number; up: boolean } | null | undefined) {
  if (!trend) return 'neutral' as const;
  return trend.up ? ('up' as const) : ('down' as const);
}

/**
 * Flat metric card: label + polyline sparkline, large value,
 * footer row “Since last week” (left) and ±% with ▲▼ (green / red).
 */
export function StatCard({
  label,
  value,
  sparkline,
  sinceLabel,
  trend,
}: {
  label: string;
  value: string | number;
  sparkline?: number[];
  sinceLabel?: string;
  trend?: { pct: number; up: boolean } | null;
}) {
  const tone = sparkTone(trend ?? null);
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-[#6B7280]">{label}</p>
        {sparkline && sparkline.length > 0 ? (
          <SparklinePolyline data={sparkline} tone={tone} />
        ) : null}
      </div>
      <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-[#111827] tabular-nums sm:text-[30px]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        {sinceLabel ? (
          <p className="text-xs font-medium text-[#6B7280]">{sinceLabel}</p>
        ) : (
          <span />
        )}
        {trend ? (
          <span
            className={`inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums ${
              trend.up ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {trend.up ? '+' : '−'}
            {trend.pct}%
            <span aria-hidden className="text-xs font-bold">
              {trend.up ? '▲' : '▼'}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
