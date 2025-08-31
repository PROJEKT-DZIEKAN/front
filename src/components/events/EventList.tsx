'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import EventCard from '../ui/EventCard';

interface User {
  id: number;
  firstName: string;
  surname: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  organizer?: User;
  currentParticipants: number;
  maxParticipants?: number;
  category: string;
  isRegistered: boolean;
  isFavorite: boolean;
  tags: string[];
  links: Array<{ text: string; url: string }>;
}

interface EventListProps {
  events: Event[];
  isLoading: boolean;
  onToggleFavorite: (eventId: number) => void;
  onToggleRegistration: (eventId: number) => void;
  onViewDetails: (event: Event) => void;
}

export default function EventList({
  events,
  isLoading,
  onToggleFavorite,
  onToggleRegistration,
  onViewDetails
}: EventListProps) {
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Ładowanie wydarzeń..." />;
  }

  if (events.length === 0) {
    return (
      <Card className="text-center py-8">
        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Brak wydarzeń pasujących do kryteriów</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onToggleFavorite={onToggleFavorite}
          onToggleRegistration={onToggleRegistration}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
