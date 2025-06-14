'use client';

import { UserIcon, QrCodeIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function DigitalCard() {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <UserIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Elektroniczna Wizytówka</h1>
        <p className="text-gray-600">Twoja cyfrowa wizytówka do udostępniania</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
            <UserIcon className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Jan Kowalski</h2>
            <p className="text-gray-600">Student Informatyki</p>
            <p className="text-sm text-gray-500">jan.kowalski@student.edu.pl</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Twój QR Code</h3>
        <div className="text-center space-y-4">
          <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
            <QrCodeIcon className="h-16 w-16 text-gray-400" />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            <ShareIcon className="h-4 w-4 mr-2" />
            Udostępnij wizytówkę
          </button>
        </div>
      </div>
    </div>
  );
}