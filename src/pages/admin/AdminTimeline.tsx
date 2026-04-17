import React from 'react';
import { timelineData } from '../../data/mockData';
export function AdminTimeline() {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthStarts = months.map((_, i) => new Date(2026, 1 + i, 1).getTime());
  const totalRange =
  new Date(2026, 6, 1).getTime() - new Date(2026, 1, 1).getTime();
  function getPosition(dateStr: string) {
    const d = new Date(dateStr).getTime();
    const start = new Date(2026, 1, 1).getTime();
    return (d - start) / totalRange * 100;
  }
  function getWidth(startStr: string, endStr: string) {
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    return (e - s) / totalRange * 100;
  }
  const statusColors: Record<string, string> = {
    Completed: 'bg-success-500',
    'In Progress': 'bg-amber-500',
    Upcoming: 'bg-gray-300'
  };
  const statusBadgeColors: Record<string, string> = {
    Completed: 'bg-success-100 text-success-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Upcoming: 'bg-gray-100 text-gray-500'
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Project Timeline</h1>
        <p className="text-sm text-gray-500">
          Deliverables and activities — Feb to Jun 2026
        </p>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Month headers */}
        <div className="flex border-b border-gray-200 pb-2 mb-4 ml-64">
          {months.map((m) =>
          <div
            key={m}
            className="flex-1 text-xs font-semibold text-gray-500 text-center">
            
              {m} 2026
            </div>
          )}
        </div>

        {/* Bars */}
        <div className="space-y-6">
          {timelineData.map((item) =>
          <div key={item.deliverable} className="flex items-center gap-4">
              <div className="w-60 flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {item.deliverable}
                </p>
                <p className="text-xs text-gray-500">{item.responsible}</p>
                <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${statusBadgeColors[item.status]}`}>
                
                  {item.status}
                </span>
              </div>
              <div className="flex-1 relative h-8 bg-gray-50 rounded-lg overflow-hidden">
                {/* Grid lines */}
                {months.map((_, i) =>
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-gray-200"
                style={{
                  left: `${i / months.length * 100}%`
                }} />

              )}
                {/* Bar */}
                <div
                className={`absolute top-1 bottom-1 rounded-md ${statusColors[item.status]} opacity-80`}
                style={{
                  left: `${getPosition(item.start)}%`,
                  width: `${getWidth(item.start, item.end)}%`
                }} />
              
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activities detail */}
      <div className="grid grid-cols-2 gap-4">
        {timelineData.map((item) =>
        <div
          key={item.deliverable}
          className="bg-white rounded-xl border border-gray-200 p-4">
          
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                {item.deliverable}
              </h3>
              <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadgeColors[item.status]}`}>
              
                {item.status}
              </span>
            </div>
            <ul className="space-y-1.5">
              {item.activities.map((a) =>
            <li
              key={a}
              className="flex items-center gap-2 text-sm text-gray-600">
              
                  <div
                className={`w-1.5 h-1.5 rounded-full ${item.status === 'Completed' ? 'bg-success-500' : 'bg-gray-300'}`} />
              
                  {a}
                </li>
            )}
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              {item.responsible} • {new Date(item.start).toLocaleDateString()} –{' '}
              {new Date(item.end).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>);

}