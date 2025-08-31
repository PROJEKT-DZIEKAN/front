'use client';

import { ClockIcon, MapPinIcon, UserGroupIcon, LinkIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Event } from '@/types/event';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleRegistration: (eventId: number) => void;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onToggleRegistration
}: EventDetailsModalProps) {
  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">{event.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {format(parseISO(event.startTime), 'PPp', { locale: pl })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <MapPinIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center text-sm">
            <UserGroupIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>{event.organizer?.firstName} {event.organizer?.surname}</span>
          </div>
        </div>

        {event.links && event.links.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Przydatne linki:</h3>
            <div className="space-y-2">
              {event.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 text-sm hover:underline"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <Button
            onClick={() => onToggleRegistration(event.id)}
            variant={event.isRegistered ? 'danger' : 'primary'}
            className="flex-1"
          >
            {event.isRegistered ? 'Wypisz się' : 'Zapisz się'}
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Zamknij
          </Button>
        </div>
      </div>
    </Modal>
  );
}
