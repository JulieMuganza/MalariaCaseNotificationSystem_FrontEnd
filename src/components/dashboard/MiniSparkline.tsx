import React from 'react';

/** Thin SVG sparkline (polyline) for flat metric cards — tone matches % direction. */
export function SparklinePolyline({
  data,
  tone,
}: {
  data: number[];
  tone: 'up' | 'down' | 'neutral';
}) {
  const w = 76;
  const h = 32;
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 2;
  const points = data
    .map((v, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const stroke =
    tone === 'up' ? '#10B981' : tone === 'down' ? '#EF4444' : '#0d9488';
  return (
    <svg
      width={w}
      height={h}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/** Simple 7-point bar sparkline from counts (e.g. cases per day). */
export function MiniSparkline({
  data,
  className = '',
  compact = false,
}: {
  data: number[];
  className?: string;
  compact?: boolean;
}) {
  const max = Math.max(...data, 1);
  const h = compact ? 'h-8' : 'h-9';
  const gap = compact ? 'gap-px' : 'gap-0.5';
  return (
    <div
      className={`flex items-end justify-between ${gap} ${h} ${className}`}
      aria-hidden
    >
      {data.map((v, i) => (
        <div
          key={i}
          className="max-w-[5px] min-w-[2px] flex-1 rounded-[2px] bg-teal-600 opacity-80"
          style={{ height: `${Math.max(compact ? 6 : 8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function isCriticalSnapshot(c: {
  symptomCount?: number;
  symptoms?: string[];
  status: string;
}) {
  return (
    (c.symptomCount ?? c.symptoms?.length ?? 0) >= 3 ||
    ['Escalated', 'Admitted'].includes(c.status)
  );
}

export function criticalCreatedPerDayLast7Days(
  cases: {
    createdAt: string;
    symptomCount?: number;
    symptoms?: string[];
    status: string;
  }[]
): number[] {
  const days: number[] = Array(7).fill(0);
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    days[i] = cases.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return (
        t >= dayStart.getTime() &&
        t <= dayEnd.getTime() &&
        isCriticalSnapshot(c)
      );
    }).length;
  }
  return days;
}

export function pipelineActivityPerDayLast7Days(
  cases: { updatedAt: string; status: string }[],
  inPipeline: (status: string) => boolean
): number[] {
  const days: number[] = Array(7).fill(0);
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    days[i] = cases.filter((c) => {
      const t = new Date(c.updatedAt).getTime();
      return (
        t >= dayStart.getTime() &&
        t <= dayEnd.getTime() &&
        inPipeline(c.status)
      );
    }).length;
  }
  return days;
}

export function casesPerDayLast7Days(
  cases: { createdAt: string }[]
): number[] {
  const days: number[] = Array(7).fill(0);
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    days[i] = cases.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    }).length;
  }
  return days;
}

export function casesPerDayLast14Days(
  cases: { createdAt: string }[]
): number[] {
  const days: number[] = Array(14).fill(0);
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (13 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    days[i] = cases.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    }).length;
  }
  return days;
}

export function weekOverWeekTrendFromDaily(daily14: number[]): {
  pct: number;
  up: boolean;
} | null {
  if (daily14.length < 14) return null;
  const prev = daily14.slice(0, 7).reduce((a, b) => a + b, 0);
  const curr = daily14.slice(7).reduce((a, b) => a + b, 0);
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return { pct: curr > 0 ? 100 : 0, up: curr > 0 };
  const raw = Math.round(((curr - prev) / prev) * 100);
  return { pct: Math.abs(raw), up: raw >= 0 };
}
