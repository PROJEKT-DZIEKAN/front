'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  LinkIcon,
  StarIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useUser } from '@/context/UserContext';
import axios from 'axios';

// Dodaję funkcję debounce
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface User {
  id: number;
  firstName: string;
  surname: string;
}

// Interface dla odpowiedzi z API
interface ApiEventRegistration {
  id: number;
  participant: User;
  event: {
    id: number;
    title: string;
  };
  status: string;
  registrationDate: string;
}

interface ApiEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  qrcodeUrl?: string;
  maxParticipants?: number;
  organizer?: User;
  registrations?: ApiEventRegistration[];
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

const API_BASE_URL = 'https://dziekan-backend-ywfy.onrender.com';

export default function EventProgram() {
  const { user, isAuthenticated, getAllEvents } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEventsFromAPI = useCallback(async () => {
    if (isLoading) return; // Zapobiegaj wielokrotnym wywołaniom podczas ładowania
    
    try {
      setIsLoading(true);
      setError(null);
      const apiEvents = await getAllEvents();
      
      // Konwersja eventów z API do formatu frontendowego
      const convertedEvents: Event[] = (apiEvents as ApiEvent[]).map((event: ApiEvent) => ({
        ...event,
        // Dodanie frontendowych pól
        currentParticipants: event.registrations?.length || 0,
        category: determineCategory(event.title, event.description),
        isRegistered: event.registrations?.some((reg: ApiEventRegistration) => 
          reg.participant.id === user?.id && reg.status === 'REGISTERED'
        ) || false,
        isFavorite: false, // TODO: Implement favorites storage
        tags: generateTags(event.title, event.description),
        links: generateLinks(event.location)
      }));

      setEvents(convertedEvents);
      console.log('📅 Załadowano eventy z API:', convertedEvents.length);
    } catch (error) {
      console.error('❌ Błąd ładowania eventów:', error);
      setError('Nie można załadować eventów. Spróbuj ponownie później.');
      console.log('🔄 Fallback do mock data');
      loadMockEvents(); // Fallback do mock data
    } finally {
      setIsLoading(false);
    }
  }, [getAllEvents, user?.id]);

  // Używam debounce dla loadEventsFromAPI
  const debouncedLoadEvents = useCallback(
    debounce(() => loadEventsFromAPI(), 5000), // 5 sekund debounce
    [loadEventsFromAPI]
  );

  // Ładowanie eventów z API
  useEffect(() => {
    debouncedLoadEvents();
    
    // Ustawiam interwał na odświeżanie co 30 sekund
    const interval = setInterval(debouncedLoadEvents, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [debouncedLoadEvents]);

  // Funkcja do określania kategorii na podstawie tytułu i opisu
  const determineCategory = (title: string, description: string): Event['category'] => {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();

    if (titleLower.includes('prezentacja') || titleLower.includes('powitanie')) {
      return 'presentation';
    } else if (titleLower.includes('warsztat') || descLower.includes('warsztat')) {
      return 'workshop';
    } else if (titleLower.includes('integracja') || titleLower.includes('gry') || titleLower.includes('zabawy')) {
      return 'social';
    } else if (titleLower.includes('konkurs') || descLower.includes('konkurs')) {
      return 'competition';
    }
    return 'other';
  };

  // Funkcja do generowania tagów
  const generateTags = (title: string, description: string): string[] => {
    const tags: string[] = [];
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('student')) tags.push('Studenci');
    if (text.includes('programowanie')) tags.push('Programowanie');
    if (text.includes('wiedza')) tags.push('Wiedza');
    if (text.includes('nagrody')) tags.push('Nagrody');
    if (text.includes('integracja')) tags.push('Integracja');
    if (text.includes('warsztat')) tags.push('Warsztat');
    if (text.includes('prezentacja')) tags.push('Prezentacja');

    return tags.length > 0 ? tags : ['Event'];
  };

  // Funkcja do generowania linków
  const generateLinks = (location: string) => {
    const links = [];
    
    // Dodaj link do Google Maps
    links.push({
      text: 'Lokalizacja na mapie',
      url: `https://maps.google.com/search/${encodeURIComponent(location)}`
    });

    return links;
  };

  // Fallback mock data
  const loadMockEvents = () => {
    const mockEvents: Event[] = [
      {
        id: 1,
        title: 'Powitanie Studentów',
        description: 'Oficjalne powitanie nowych studentów przez władze uczelni. Prezentacja struktury uczelni, wydziałów i możliwości rozwoju.',
        startTime: '2024-12-15T14:00:00',
        endTime: '2024-12-15T15:00:00',
        location: 'Aula Główna',
        maxParticipants: 500,
        currentParticipants: 347,
        category: 'presentation',
        isRegistered: true,
        isFavorite: true,
        links: [
          {
            text: 'Lokalizacja na mapie',
            url: 'https://maps.google.com'
          }
        ],
        tags: ['Oficjalne', 'Powitanie', 'Informacje']
      }
    ];
    setEvents(mockEvents);
  };

  // Funkcja rejestracji na event
  const registerForEvent = async (eventId: number, register: boolean) => {
    if (!isAuthenticated || !user) {
      alert('Musisz być zalogowany aby się zarejestrować');
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      };

      if (register) {
        // Rejestracja
        await axios.post(`${API_BASE_URL}/api/event-registrations/register`, {
          event: { id: eventId },
          participant: { id: user.id }
        }, { headers });
      } else {
        // Wypisanie się - trzeba znaleźć ID rejestracji
        const registrations = await axios.get(
          `${API_BASE_URL}/api/event-registrations/registrations-by-participant/${user.id}`,
          { headers }
        );
        
        const registration = registrations.data.find((reg: ApiEventRegistration) => 
          reg.event.id === eventId && reg.status === 'REGISTERED'
        );

        if (registration) {
          await axios.delete(
            `${API_BASE_URL}/api/event-registrations/delete?id=${registration.id}`,
            { headers }
          );
        }
      }

      // Odśwież listę eventów
      await loadEventsFromAPI();
      
      alert(register ? 'Zarejestrowano pomyślnie!' : 'Wypisano z eventu!');
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      alert('Wystąpił błąd podczas rejestracji');
    }
  };

  const categories = [
    { id: 'all', name: 'Wszystkie', count: events.length },
    { id: 'presentation', name: 'Prezentacje', count: events.filter(e => e.category === 'presentation').length },
    { id: 'workshop', name: 'Warsztaty', count: events.filter(e => e.category === 'workshop').length },
    { id: 'social', name: 'Integracja', count: events.filter(e => e.category === 'social').length },
    { id: 'competition', name: 'Konkursy', count: events.filter(e => e.category === 'competition').length }
  ];

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (eventId: number) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, isFavorite: !event.isFavorite }
          : event
      )
    );
  };

  const toggleRegistration = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    registerForEvent(eventId, !event.isRegistered);
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = parseISO(event.startTime);
    const endTime = parseISO(event.endTime);

    if (isBefore(now, startTime)) {
      return { status: 'upcoming', label: 'Nadchodzi', color: 'bg-blue-100 text-blue-700' };
    } else if (isAfter(now, startTime) && isBefore(now, endTime)) {
      return { status: 'live', label: 'Na żywo', color: 'bg-red-100 text-red-700' };
    } else {
      return { status: 'ended', label: 'Zakończone', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getCategoryColor = (category: Event['category']) => {
    switch (category) {
      case 'presentation': return 'bg-blue-500';
      case 'workshop': return 'bg-green-500';
      case 'social': return 'bg-purple-500';
      case 'competition': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: Event['category']) => {
    switch (category) {
      case 'presentation': return CalendarIcon;
      case 'workshop': return UserGroupIcon;
      case 'social': return StarIcon;
      case 'competition': return CheckCircleIcon;
      default: return CalendarIcon;
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Nagłówek z przyciskiem odświeżania */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Program wydarzeń</h2>
        <button
          onClick={() => {
            setError(null);
            loadEventsFromAPI();
          }}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Ładowanie...' : 'Odśwież'}
        </button>
      </div>

      {/* Wyświetlanie błędu */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Błąd ładowania</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Szukaj wydarzeń..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Ładowanie wydarzeń...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Brak wydarzeń pasujących do kryteriów</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const status = getEventStatus(event);
            const CategoryIcon = getCategoryIcon(event.category);
            
            return (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${getCategoryColor(event.category)}`}>
                          <CategoryIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {event.isRegistered && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Zarejestrowany
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{event.organizer?.firstName} {event.organizer?.surname}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(event.id)}
                      className={`p-2 rounded-full transition-colors ${
                        event.isFavorite 
                          ? 'text-yellow-500 bg-yellow-50' 
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <StarIcon className={`h-5 w-5 ${event.isFavorite ? 'fill-current' : ''}`} />
                    </button>
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
                      {event.latitude && event.longitude && (
                        <span className="ml-1 text-gray-500">
                          (lat: {event.latitude.toFixed(4)}, lon: {event.longitude.toFixed(4)})
                        </span>
                      )}
                    </div>
                    {event.maxParticipants && (
                      <div className="flex items-center text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        <span>{event.currentParticipants}/{event.maxParticipants} uczestników</span>
                        {event.maxParticipants - event.currentParticipants <= 5 && (
                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                            Mało miejsc!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{event.description}</p>

                  {/* Tags */}
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

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleRegistration(event.id)}
                      disabled={
                        event.maxParticipants !== undefined && 
                        event.currentParticipants >= event.maxParticipants && 
                        !event.isRegistered
                      }
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        event.isRegistered
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                      }`}
                    >
                      {event.isRegistered ? 'Wypisz się' : 'Zapisz się'}
                    </button>
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Szczegóły
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">{selectedEvent.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {format(parseISO(selectedEvent.startTime), 'PPp', { locale: pl })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <UserGroupIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.organizer?.firstName} {selectedEvent.organizer?.surname}</span>
                  </div>
                </div>

                {selectedEvent.links && selectedEvent.links.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Przydatne linki:</h3>
                    <div className="space-y-2">
                      {selectedEvent.links.map((link, index) => (
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
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => toggleRegistration(selectedEvent.id)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedEvent.isRegistered
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {selectedEvent.isRegistered ? 'Wypisz się' : 'Zapisz się'}
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}