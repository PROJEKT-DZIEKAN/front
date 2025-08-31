'use client';

import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  UserIcon,
  ClockIcon
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

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  className?: string;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  className = ''
}: NotificationItemProps) {
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

  const Icon = getIcon(notification.type);

  return (
    <div
      className={`relative border-l-4 p-4 bg-white rounded-lg shadow-sm ${
        getTypeColor(notification.type)
      } ${!notification.read ? 'border-r-4 border-r-blue-500' : ''} ${
        className
      }`}
      onClick={() => onMarkAsRead?.(notification.id)}
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
}
