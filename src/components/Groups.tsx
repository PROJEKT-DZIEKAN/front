'use client';

import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Groups() {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <UserGroupIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Grupy</h1>
        <p className="text-gray-600">Twoja grupa i członkowie</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Twoja Grupa</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900">Grupa A - Informatyka</h3>
          <p className="text-sm text-blue-700">5 członków • Opiekun: Dr. Jan Kowalski</p>
        </div>
        
        <h3 className="font-medium text-gray-900 mb-3">Członkowie grupy:</h3>
        <div className="space-y-2">
          {['Anna Nowak', 'Piotr Wiśniewski', 'Kasia Kowalczyk', 'Michał Zieliński'].map((member, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-900">{member}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}