'use client';

import { CameraIcon, UserIcon } from '@heroicons/react/24/outline';

export default function PersonRecognition() {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <CameraIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rozpoznawanie Osób</h1>
        <p className="text-gray-600">Zrób zdjęcie aby rozpoznać osobę</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center space-y-4">
          <div className="w-64 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
            <CameraIcon className="h-16 w-16 text-gray-400" />
          </div>
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Włącz kamerę
          </button>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="font-medium text-yellow-800">Funkcja w rozwoju</h3>
        <p className="text-sm text-yellow-700 mt-1">
          Rozpoznawanie osób będzie dostępne wkrótce. Funkcja wykorzystuje uczenie maszynowe do identyfikacji osób na podstawie zdjęć.
        </p>
      </div>
    </div>
  );
}