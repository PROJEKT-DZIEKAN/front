'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import EventProgram from './EventProgram';
import Groups from './Groups';
import Surveys from './Surveys';
import NotificationsBoard from './NotificationsBoard';
import EmergencyServices from './EmergencyServices';
import LocationServices from './LocationServices';
import QRCodeSection from './QRCodeSection';
import Tutorial from './Tutorial';
import DigitalCard from './DigitalCard';
import PersonRecognition from './PersonRecognition';
import ChatApp from './ChatApp';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const { user } = useAuth();

  const tabs = [
    { id: 'events', label: 'Wydarzenia', component: <EventProgram /> },
    { id: 'groups', label: 'Grupy', component: <Groups /> },
    { id: 'surveys', label: 'Ankiety', component: <Surveys /> },
    { id: 'notifications', label: 'Powiadomienia', component: <NotificationsBoard /> },
    { id: 'emergency', label: 'Pomoc', component: <EmergencyServices /> },
    { id: 'location', label: 'Lokalizacja', component: <LocationServices /> },
    { id: 'qr', label: 'QR Code', component: <QRCodeSection /> },
    { id: 'tutorial', label: 'Tutorial', component: <Tutorial onClose={() => {}} /> },
    { id: 'card', label: 'Karta', component: <DigitalCard /> },
    { id: 'recognition', label: 'Rozpoznawanie', component: <PersonRecognition /> },
    { id: 'chat', label: 'Chat', component: <ChatApp /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">College App</h1>
            </div>
            {user && (
              <div className="text-sm text-gray-600">
                Witaj, {user.firstName} {user.surname}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;