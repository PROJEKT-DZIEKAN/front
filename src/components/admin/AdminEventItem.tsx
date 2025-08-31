'use client';

import { PencilIcon, TrashIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import Button from '../ui/Button';

interface User {
  id: number;
  firstName: string;
  surname: string;
  roles?: string[];
}

interface Event {
  id?: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  maxParticipants?: number;
  organizer?: User;
}

interface AdminEventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
}

export default function AdminEventItem({ event, onEdit, onDelete }: AdminEventItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {event.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {event.description}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => onEdit(event)}
            variant="ghost"
            size="sm"
            icon={<PencilIcon className="h-4 w-4" />}
          >
            Edytuj
          </Button>
          <Button
            onClick={() => event.id && onDelete(event.id)}
            variant="ghost"
            size="sm"
            icon={<TrashIcon className="h-4 w-4" />}
          >
            Usuń
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>
            {event.startTime ? format(parseISO(event.startTime), 'dd.MM.yyyy HH:mm', { locale: pl }) : 'Brak daty'}
          </span>
        </div>
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span>{event.location}</span>
        </div>
        {event.maxParticipants && (
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            <span>Max: {event.maxParticipants}</span>
          </div>
        )}
      </div>
    </div>
  );
}
