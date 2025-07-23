'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@/context/UserContext';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

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

  // Funkcja do ładowania eventów
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventsData = await getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Błąd ładowania eventów:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getAllEvents]);

  // Załadowanie eventów przy inicjalizacji
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Sprawdzenie uprawnień admina
  if (!isAdmin) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <XMarkIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Brak dostępu</h1>
          <p className="text-gray-600 mb-4">Nie masz uprawnień do panelu administracyjnego</p>
          {user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Zalogowany jako:</strong> {user.firstName} {user.surname} (ID: {user.id})
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Role:</strong> {user.roles?.join(', ') || 'Brak ról'}
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                Potrzebujesz roli &quot;ADMIN&quot; aby uzyskać dostęp do tego panelu
              </p>
            </div>
          )}
        </div>
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
          setEvents(prev => prev.map(event => 
            event.id === editingEvent.id ? updated : event
          ));
          setEditingEvent(null);
          alert('Event zaktualizowany pomyślnie!');
        } else {
          alert('Błąd aktualizacji eventu');
        }
      } else {
        // Tworzenie nowego eventu
        const newEvent = await createEvent(formData);
        if (newEvent) {
          setEvents(prev => [...prev, newEvent]);
          setShowAddForm(false);
          alert('Event utworzony pomyślnie!');
        } else {
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
        setEvents(prev => prev.filter(event => event.id !== eventId));
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
      <div className="text-center">
        <CogIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel Administratora</h1>
        <p className="text-gray-600">Zarządzaj wydarzeniami</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-green-600">
            Zalogowany jako: <strong>{user?.firstName} {user?.surname}</strong> (ID: {user?.id})
          </p>
          <p className="text-xs text-purple-600">
            Role: <strong>{user?.roles?.join(', ') || 'Brak ról'}</strong>
          </p>
        </div>
      </div>

      {/* Przycisk dodawania nowego eventu */}
      {!showAddForm && (
        <div className="text-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Dodaj nowy event
          </button>
        </div>
      )}

      {/* Formularz dodawania/edycji eventu */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingEvent ? 'Edytuj Event' : 'Dodaj Nowy Event'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Wprowadź tytuł eventu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Wprowadź opis eventu"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data i godzina rozpoczęcia *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data i godzina zakończenia *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokalizacja *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Wprowadź lokalizację eventu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksymalna liczba uczestników
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants || ''}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Pozostaw puste dla nieograniczonej liczby"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Zapisywanie...' : (editingEvent ? 'Aktualizuj' : 'Dodaj Event')}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista eventów */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Zarządzaj Eventami ({events.length})
        </h2>

        {isLoading && !showAddForm ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Ładowanie eventów...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Brak eventów do wyświetlenia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
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
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edytuj"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => event.id && handleDelete(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Usuń"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 