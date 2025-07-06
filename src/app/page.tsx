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
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  CameraIcon,
  QuestionMarkCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@/context/UserContext';

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
import QRLoginPopup from '@/components/QRLoginPopup';

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
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showQRPopup, setShowQRPopup] = useState(false);
  
  const { user, isAuthenticated, isLoading, logout } = useUser();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowTutorial(true);
      localStorage.setItem('hasVisited', 'true');
    }
    setNotifications(3);
  }, []);

  // Efekt do pokazywania pop-up QR gdy użytkownik nie jest zalogowany
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowQRPopup(true);
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold - hide nav
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show nav
        setIsNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
            <div>
            <h1 className="text-lg font-bold text-gray-900">College App</h1>
              {isAuthenticated && user && (
                <p className="text-xs text-gray-500">
                  Witaj, {user.firstName}!
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Wyloguj się"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-600" />
              </button>
            )}
            {!isAuthenticated && (
              <button
                onClick={() => setShowQRPopup(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Zaloguj się"
              >
                <QrCodeIcon className="h-6 w-6 text-gray-600" />
              </button>
            )}
            <button
              onClick={() => setIsNavVisible(!isNavVisible)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={isNavVisible ? 'Ukryj nawigację' : 'Pokaż nawigację'}
            >
              {isNavVisible ? (
                <ChevronDownIcon className="h-6 w-6 text-gray-600" />
              ) : (
                <ChevronUpIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <QuestionMarkCircleIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-64">
        {renderActiveComponent()}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
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

      {/* Floating Action Button - pokazuje się gdy nawigacja jest ukryta */}
      {!isNavVisible && (
        <button
          onClick={() => setIsNavVisible(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50"
          title="Pokaż nawigację"
        >
          <ChevronUpIcon className="h-6 w-6" />
        </button>
      )}

      {/* QR Login Popup */}
      <QRLoginPopup
        isOpen={showQRPopup}
        onClose={() => setShowQRPopup(false)}
        onLoginSuccess={() => {
          setShowQRPopup(false);
          setActiveTab('card'); // Przejdź do wizytówki po zalogowaniu
        }}
      />

      {/* Tutorial Modal */}
      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
