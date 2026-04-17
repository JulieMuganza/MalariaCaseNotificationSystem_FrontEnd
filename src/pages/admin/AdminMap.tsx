import React from 'react';
import { RwandaCaseMap } from '../../components/shared/RwandaCaseMap';

export function AdminMap() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Map View</h1>
        <p className="text-sm text-gray-500">
          Southern Province — Case distribution by district
        </p>
      </div>
      <RwandaCaseMap accent="teal" />
    </div>);

}
