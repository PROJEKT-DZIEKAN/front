'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  MapPinIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

interface Event {
  id: string;
  title: string;
  time: string;
  location: string;
  status: 'upcoming' | 'live' | 'ended';
}

interface RegistrationStep {
  id: number;
  title: string;
  completed: boolean;
  description: string;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registrationSteps, setRegistrationSteps] = useState<RegistrationStep[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userGroup, setUserGroup] = useState<string | null>(null);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Mock data - in real app this would come from API
    setUpcomingEvents([
      {
        id: '1',
        title: 'Powitanie Studentów',
        time: '14:00',
        location: 'Aula Główna',
        status: 'upcoming'
      },
      {
        id: '2',
        title: 'Prezentacja Wydziałów',
        time: '15:30',
        location: 'Sala 201',
        status: 'upcoming'
      },
      {
        id: '3',
        title: 'Integracja - Gry i Zabawy',
        time: '17:00',
        location: 'Dziedziniec',
        status: 'live'
      }
    ]);

    setRegistrationSteps([
      {
        id: 1,
        title: 'Pierwsza rejestracja',
        completed: true,
        description: 'Odbiór wejściówki i materiałów'
      },
      {
        id: 2,
        title: 'Druga rejestracja',
        completed: false,
        description: 'Odbiór gadżetów i przydziału do grupy'
      },
      {
        id: 3,
        title: 'Finalna rejestracja',
        completed: false,
        description: 'Potwierdzenie uczestnictwa w wydarzeniach'
      }
    ]);

    setUnreadMessages(2);
    setUnreadNotifications(3);
    setUserGroup('Grupa A - Informatyka');

    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      id: 'program',
      title: 'Program',
      subtitle: 'Zobacz wydarzenia',
      icon: CalendarIcon,
      color: 'bg-blue-500',
      action: () => onNavigate('program')
    },
    {
      id: 'notifications',
      title: 'Tablica',
      subtitle: `${unreadNotifications} nowych`,
      icon: BellIcon,
      color: 'bg-purple-500',
      badge: unreadNotifications,
      action: () => onNavigate('notifications')
    },
    {
      id: 'chat',
      title: 'Chat',
      subtitle: `${unreadMessages} wiadomości`,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500',
      badge: unreadMessages,
      action: () => onNavigate('chat')
    },
    {
      id: 'emergency',
      title: 'Alarmowy',
      subtitle: 'Pomoc w nagłych',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      action: () => onNavigate('emergency')
    },
    {
      id: 'qr',
      title: 'QR Code',
      subtitle: 'Skanuj i rejestruj',
      icon: QrCodeIcon,
      color: 'bg-indigo-500',
      action: () => onNavigate('qr')
    },
    {
      id: 'location',
      title: 'Lokalizacja',
      subtitle: 'Mapa i nawigacja',
      icon: MapPinIcon,
      color: 'bg-orange-500',
      action: () => onNavigate('location')
    }
  ];

  return (
    <div className="p-4 space-y-6 pb-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Cześć! 👋</h2>
        <p className="text-blue-100 mb-4">
          {format(currentTime, "EEEE, d MMMM yyyy", { locale: pl })}
        </p>
        <p className="text-blue-100 text-sm">
          {format(currentTime, "HH:mm")}
        </p>
      </div>

      {/* Registration Progress */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          Status Rejestracji
        </h3>
        <div className="space-y-3">
          {registrationSteps.map((step) => (
            <div key={step.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                step.completed ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {step.completed ? (
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-white text-xs font-bold">{step.id}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-700'}`}>
                  {step.title}
                </p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        {!registrationSteps.every(step => step.completed) && (
          <button
            onClick={() => onNavigate('qr')}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors btn-press"
          >
            Kontynuuj rejestrację
          </button>
        )}
      </div>

      {/* User Group */}
      {userGroup && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <UserGroupIcon className="h-5 w-5 text-blue-500 mr-2" />
            Twoja Grupa
          </h3>
          <p className="text-blue-600 font-medium">{userGroup}</p>
          <button
            onClick={() => onNavigate('groups')}
            className="text-blue-600 text-sm hover:underline mt-1"
          >
            Zobacz szczegóły grupy →
          </button>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
          Nadchodzące Wydarzenia
        </h3>
        <div className="space-y-3">
          {upcomingEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                event.status === 'live' ? 'bg-red-500 animate-pulse' :
                event.status === 'upcoming' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-500">{event.time} • {event.location}</p>
              </div>
              {event.status === 'live' && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  NA ŻYWO
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate('program')}
          className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Zobacz pełny program
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Szybkie Akcje</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="relative p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left btn-press"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                <p className="text-xs text-gray-500">{action.subtitle}</p>
                {action.badge && action.badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Survey Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <ChartBarIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">Nowa ankieta dostępna!</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Organizatorzy udostępnili ankietę dotyczącą preferencji grupowych.
            </p>
            <button
              onClick={() => onNavigate('surveys')}
              className="mt-2 text-yellow-800 text-sm font-medium hover:underline"
            >
              Wypełnij teraz →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}