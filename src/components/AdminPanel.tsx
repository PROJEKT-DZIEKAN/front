'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  CogIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@/context/UserContext';
import Button from './ui/Button';
import Alert from './ui/Alert';
import SectionHeader from './ui/SectionHeader';
import AdminEventForm from './admin/AdminEventForm';
import AdminEventList from './admin/AdminEventList';

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

export default function AdminPanel() {
  const { user, isAdmin, createEvent, updateEvent, deleteEvent, getAllEvents } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: undefined
  });

  // Funkcja do ładowania eventów - TYLKO ręczne wywołanie
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventsData = await getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Błąd ładowania eventów:', error);
      setError('Nie można załadować eventów');
    } finally {
      setIsLoading(false);
    }
  }, [getAllEvents]);

  // DODAJĘ automatyczne ładowanie przy mount dla admina
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const [error, setError] = useState<string | null>(null);

  // Sprawdzenie uprawnień admina
  if (!isAdmin) {
    return (
      <div className="p-4 space-y-6">
        <SectionHeader
          icon={<XMarkIcon className="h-12 w-12 text-red-500 mx-auto" />}
          title="Brak dostępu"
          subtitle="Nie masz uprawnień do panelu administracyjnego"
        />
        {user && (
          <Alert type="warning" className="max-w-md mx-auto">
            <div className="space-y-2">
              <p><strong>Zalogowany jako:</strong> {user.firstName} {user.surname} (ID: {user.id})</p>
              <p><strong>Role:</strong> {user.roles?.join(', ') || 'Brak ról'}</p>
              <p className="text-xs">Potrzebujesz roli "ADMIN" aby uzyskać dostęp do tego panelu</p>
            </div>
          </Alert>
        )}
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingEvent && editingEvent.id) {
        // Edycja istniejącego eventu
        const updated = await updateEvent(editingEvent.id, formData);
        if (updated) {
          // Odśwież listę eventów z serwera po edycji
          await loadEvents();
          setEditingEvent(null);
          alert('Event zaktualizowany pomyślnie!');
        } else {
          alert('Błąd aktualizacji eventu');
        }
      } else {
        // Tworzenie nowego eventu
        console.log('🚀 Tworzenie eventu z danymi:', formData);
        const newEvent = await createEvent(formData);
        if (newEvent) {
          console.log('✅ Utworzono event:', newEvent);
          // Odśwież listę eventów z serwera po dodaniu
          await loadEvents();
          setShowAddForm(false);
          alert('Event utworzony pomyślnie!');
        } else {
          console.log('❌ Nie udało się utworzyć eventu');
          alert('Błąd tworzenia eventu');
        }
      }

      // Reset formularza
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        maxParticipants: undefined
      });
    } catch (error) {
      console.error('Błąd zapisywania eventu:', error);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      maxParticipants: event.maxParticipants
    });
    setShowAddForm(true);
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten event?')) return;

    setIsLoading(true);
    try {
      const success = await deleteEvent(eventId);
      if (success) {
        // Odśwież listę eventów z serwera po usunięciu
        await loadEvents();
        alert('Event usunięty pomyślnie!');
      } else {
        alert('Błąd usuwania eventu');
      }
    } catch (error) {
      console.error('Błąd usuwania eventu:', error);
      alert('Wystąpił błąd podczas usuwania');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      maxParticipants: undefined
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <SectionHeader
        icon={<CogIcon className="h-12 w-12 text-blue-500 mx-auto" />}
        title="Panel Administratora"
        subtitle="Zarządzaj wydarzeniami"
        action={
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-600">
              Zalogowany jako: <strong>{user?.firstName} {user?.surname}</strong> (ID: {user?.id})
            </p>
            <p className="text-xs text-purple-600">
              Role: <strong>{user?.roles?.join(', ') || 'Brak ról'}</strong>
            </p>
          </div>
        }
      />

      {/* Przycisk dodawania nowego eventu */}
      {!showAddForm && (
        <div className="text-center space-y-3">
          <Button
            onClick={() => setShowAddForm(true)}
            variant="primary"
            size="lg"
            icon={<PlusIcon className="h-5 w-5" />}
            className="mx-auto"
          >
            Dodaj nowy event
          </Button>
          
          <Button
            onClick={loadEvents}
            disabled={isLoading}
            loading={isLoading}
            variant="secondary"
            icon={<ArrowPathIcon className="h-4 w-4" />}
            className="mx-auto"
          >
            Załaduj eventy z serwera
          </Button>
        </div>
      )}

      {/* Wyświetlanie błędu */}
      {error && (
        <Alert type="error" title="Błąd">
          {error}
        </Alert>
      )}

      {/* Formularz dodawania/edycji eventu */}
      {showAddForm && (
        <AdminEventForm
          editingEvent={editingEvent}
          formData={formData}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={cancelEdit}
        />
      )}

      {/* Lista eventów */}
      <AdminEventList
        events={events}
        isLoading={isLoading && !showAddForm}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
} 