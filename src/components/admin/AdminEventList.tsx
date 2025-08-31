'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';
import { Event } from '@/types/event';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import AdminEventItem from './AdminEventItem';

interface AdminEventListProps {
  events: Event[];
  isLoading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
}

export default function AdminEventList({ events, isLoading, onEdit, onDelete }: AdminEventListProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Zarządzaj Eventami ({events.length})
      </h2>

      {isLoading ? (
        <LoadingSpinner size="lg" text="Ładowanie eventów..." />
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Brak eventów do wyświetlenia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <AdminEventItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
