'use client';

import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function Surveys() {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <ChartBarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ankiety i Głosowania</h1>
        <p className="text-gray-600">Wypełnij ankiety organizatorów</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dostępne Ankiety</h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900">Preferencje Grupowe</h3>
            <p className="text-sm text-blue-700 mt-1">Pomóż nam dobrać Cię do odpowiedniej grupy</p>
            <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Wypełnij ankietę
            </button>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900">Ocena Wydarzenia</h3>
            <p className="text-sm text-green-700 mt-1">Oceń dotychczasowy przebieg wydarzenia</p>
            <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Wypełnij ankietę
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}