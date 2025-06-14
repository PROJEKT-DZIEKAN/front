'use client';

import { useState, useEffect } from 'react';
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  author: string;
  timestamp: Date;
  read: boolean;
  pinned: boolean;
}

export default function NotificationsBoard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  useEffect(() => {
    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Zmiana lokalizacji wydarzenia',
        content: 'Prezentacja wydziałów została przeniesiona z Sali 201 do Auli Głównej z powodu większej liczby uczestników.',
        type: 'warning',
        author: 'Organizator Anna K.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        read: false,
        pinned: true
      },
      {
        id: '2',
        title: 'Informacja o posiłkach',
        content: 'Lunch będzie serwowany od 12:00 do 14:00 w stołówce głównej. Pamiętajcie o zabraniu identyfikatorów uczestnika.',
        type: 'info',
        author: 'Organizator Michał S.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        pinned: true
      },
      {
        id: '3',
        title: 'Gratulacje dla zwycięzców!',
        content: 'Gratulujemy zespołowi "CodeMasters" za wygraną w konkursie programistycznym! Nagrody można odebrać w biurze organizatorów.',
        type: 'success',
        author: 'Organizator Kasia L.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        pinned: false
      },
      {
        id: '4',
        title: 'PILNE: Ewakuacja budynku B',
        content: 'Z powodu usterki systemu wentylacyjnego, budynek B jest czasowo zamknięty. Wszystkie wydarzenia przeniesiono do budynku A.',
        type: 'urgent',
        author: 'Organizator Główny',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: true,
        pinned: false
      },
      {
        id: '5',
        title: 'Dodatkowe materiały dostępne',
        content: 'Udostępniliśmy prezentacje z dzisiejszych wykładów w sekcji materiałów. Link znajdziecie w wiadomości e-mail.',
        type: 'info',
        author: 'Organizator Piotr M.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        pinned: false
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return ExclamationTriangleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'success':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read;
      case 'pinned':
        return notif.pinned;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BellIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Tablica Ogłoszeń</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'all', label: 'Wszystkie', count: notifications.length },
          { key: 'unread', label: 'Nieprzeczytane', count: unreadCount },
          { key: 'pinned', label: 'Przypięte', count: notifications.filter(n => n.pinned).length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.key 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'unread' ? 'Wszystkie wiadomości zostały przeczytane' :
               filter === 'pinned' ? 'Brak przypiętych wiadomości' :
               'Brak wiadomości'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            
            return (
              <div
                key={notification.id}
                className={`relative border-l-4 p-4 bg-white rounded-lg shadow-sm ${
                  getTypeColor(notification.type)
                } ${!notification.read ? 'border-r-4 border-r-blue-500' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                {notification.pinned && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <Icon className={`h-5 w-5 mt-1 flex-shrink-0 ${getIconColor(notification.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-2"></div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {notification.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-3 w-3" />
                        <span>{notification.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-3 w-3" />
                        <span title={format(notification.timestamp, "PPp", { locale: pl })}>
                          {formatDistanceToNow(notification.timestamp, { 
                            addSuffix: true,
                            locale: pl 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Empty state for filtered results */}
      {filteredNotifications.length === 0 && notifications.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => setFilter('all')}
            className="text-blue-600 hover:underline text-sm"
          >
            Pokaż wszystkie wiadomości
          </button>
        </div>
      )}
    </div>
  );
}