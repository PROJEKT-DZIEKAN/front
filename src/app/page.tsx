'use client';

import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon,
  BellIcon,
  UserIcon,
  QrCodeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  CameraIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

// Import components
import Dashboard from '@/components/Dashboard';
import EventProgram from '@/components/EventProgram';
import NotificationsBoard from '@/components/NotificationsBoard';
import ChatWithOrganizers from '@/components/ChatWithOrganizers';
import QRCodeSection from '@/components/QRCodeSection';
import LocationServices from '@/components/LocationServices';
import EmergencyServices from '@/components/EmergencyServices';
import Surveys from '@/components/Surveys';
import Groups from '@/components/Groups';
import PersonRecognition from '@/components/PersonRecognition';
import DigitalCard from '@/components/DigitalCard';
import Tutorial from '@/components/Tutorial';

const navigationItems = [
  { id: 'dashboard', label: 'Główna', icon: HomeIcon },
  { id: 'program', label: 'Program', icon: CalendarIcon },
  { id: 'notifications', label: 'Tablica', icon: BellIcon },
  { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
  { id: 'qr', label: 'QR Code', icon: QrCodeIcon },
  { id: 'location', label: 'Lokalizacja', icon: MapPinIcon },
  { id: 'emergency', label: 'Alarmowe', icon: ExclamationTriangleIcon },
  { id: 'surveys', label: 'Ankiety', icon: ChartBarIcon },
  { id: 'groups', label: 'Grupy', icon: UserGroupIcon },
  { id: 'recognition', label: 'Rozpoznaj', icon: CameraIcon },
  { id: 'card', label: 'Wizytówka', icon: UserIcon },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTutorial, setShowTutorial] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowTutorial(true);
      localStorage.setItem('hasVisited', 'true');
    }
    setNotifications(3);
  }, []);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'program':
        return <EventProgram />;
      case 'notifications':
        return <NotificationsBoard />;
      case 'chat':
        return <ChatWithOrganizers />;
      case 'qr':
        return <QRCodeSection />;
      case 'location':
        return <LocationServices />;
      case 'emergency':
        return <EmergencyServices />;
      case 'surveys':
        return <Surveys />;
      case 'groups':
        return <Groups />;
      case 'recognition':
        return <PersonRecognition />;
      case 'card':
        return <DigitalCard />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">College App</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <QuestionMarkCircleIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="relative">
              <BellIcon className="h-6 w-6 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        {renderActiveComponent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors btn-press ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="grid grid-cols-4 gap-1 p-2 pt-0 border-t border-gray-100">
          {navigationItems.slice(4, 8).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors btn-press ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-1 p-2 pt-0 border-t border-gray-100">
          {navigationItems.slice(8).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors btn-press ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tutorial Modal */}
      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
