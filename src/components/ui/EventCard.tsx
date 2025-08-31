'use client';

import { 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  StarIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import Card from './Card';
import StatusBadge from './StatusBadge';
import Button from './Button';

interface Event {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  organizer?: {
    firstName: string;
    surname: string;
  };
  currentParticipants: number;
  maxParticipants?: number;
  category: string;
  isRegistered: boolean;
  isFavorite: boolean;
  tags: string[];
  links: Array<{ text: string; url: string }>;
}

interface EventCardProps {
  event: Event;
  onToggleFavorite?: (eventId: number) => void;
  onToggleRegistration?: (eventId: number) => void;
  onViewDetails?: (event: Event) => void;
  className?: string;
}

export default function EventCard({
  event,
  onToggleFavorite,
  onToggleRegistration,
  onViewDetails,
  className = ''
}: EventCardProps) {
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = parseISO(event.startTime);
    const endTime = parseISO(event.endTime);

    if (now < startTime) {
      return { status: 'upcoming' as const, label: 'Nadchodzi' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'live' as const, label: 'Na żywo' };
    } else {
      return { status: 'ended' as const, label: 'Zakończone' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'presentation': return CalendarIcon;
      case 'workshop': return UserGroupIcon;
      case 'social': return StarIcon;
      case 'competition': return CheckCircleIcon;
      default: return CalendarIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'presentation': return 'bg-blue-500';
      case 'workshop': return 'bg-green-500';
      case 'social': return 'bg-purple-500';
      case 'competition': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const eventStatus = getEventStatus(event);
  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`p-1.5 rounded-lg ${getCategoryColor(event.category)}`}>
                <CategoryIcon className="h-4 w-4 text-white" />
              </div>
              <StatusBadge status={eventStatus.status}>
                {eventStatus.label}
              </StatusBadge>
              {event.isRegistered && (
                <StatusBadge status="success">
                  Zarejestrowany
                </StatusBadge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {event.title}
            </h3>
            {event.organizer && (
              <p className="text-sm text-gray-600 mb-2">
                {event.organizer.firstName} {event.organizer.surname}
              </p>
            )}
          </div>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(event.id)}
              className={`p-2 rounded-full transition-colors ${
                event.isFavorite 
                  ? 'text-yellow-500 bg-yellow-50' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <StarIcon className={`h-5 w-5 ${event.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>
              {format(parseISO(event.startTime), 'HH:mm', { locale: pl })} - 
              {format(parseISO(event.endTime), 'HH:mm', { locale: pl })}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>{event.location}</span>
          </div>
          {event.maxParticipants && (
            <div className="flex items-center text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span>{event.currentParticipants}/{event.maxParticipants} uczestników</span>
              {event.maxParticipants - event.currentParticipants <= 5 && (
                <StatusBadge status="warning" size="sm" className="ml-2">
                  Mało miejsc!
                </StatusBadge>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          {onToggleRegistration && (
            <Button
              onClick={() => onToggleRegistration(event.id)}
              disabled={
                event.maxParticipants !== undefined && 
                event.currentParticipants >= event.maxParticipants && 
                !event.isRegistered
              }
              variant={event.isRegistered ? 'danger' : 'primary'}
              className="flex-1"
            >
              {event.isRegistered ? 'Wypisz się' : 'Zapisz się'}
            </Button>
          )}
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(event)}
              variant="secondary"
            >
              Szczegóły
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
