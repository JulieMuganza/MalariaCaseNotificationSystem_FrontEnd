import React from 'react';
export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-gray-100 p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>);

}
export function TableSkeleton({ rows = 5 }: {rows?: number;}) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 bg-gray-200 rounded" />
      {Array.from({
        length: rows
      }).map((_, i) =>
      <div key={i} className="h-12 bg-gray-100 rounded" />
      )}
    </div>);

}
export function StatSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-gray-100 p-5">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>);

}