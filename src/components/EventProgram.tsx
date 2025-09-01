'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowPathIcon
} from '@heroicons/react/24/outline';

import { useUser, eventBus } from '@/context/UserContext';
import { Event } from '@/types/event';
import { User } from '@/types/auth';
import axios from 'axios';
import Button from './ui/Button';
import Alert from './ui/Alert';
import EventFilters from './events/EventFilters';
import EventList from './events/EventList';
import EventDetailsModal from './events/EventDetailsModal';

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

const API_BASE_URL = 'https://dziekan-48de5f4dea14.herokuapp.com';

export default function EventProgram() {
  const { user, isAuthenticated, getAllEvents } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Ref do śledzenia loading state

  const loadEventsFromAPI = useCallback(async () => {
    // Użyj ref zamiast state w dependency
    if (loadingRef.current) {
      console.log('⚠️ Ładowanie już w toku, pomijam');
      return;
    }
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      console.log('🔄 Rozpoczynam ładowanie eventów...');
      const apiEvents = await getAllEvents();
      console.log('📦 Otrzymane eventy z API:', apiEvents);
      
      // Konwersja eventów z API do formatu frontendowego
      const convertedEvents: Event[] = (apiEvents as ApiEvent[] || []).map((event: ApiEvent) => ({
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
      console.log('✅ Załadowano eventy z API:', convertedEvents.length);
    } catch (error) {
      console.error('❌ Błąd ładowania eventów:', error);
      setError('Nie można załadować eventów. Spróbuj ponownie później.');
      console.log('🔄 Fallback do mock data');
      loadMockEvents(); // Fallback do mock data
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [getAllEvents, user?.id]); // Bez isLoading w dependencies

  // Nasłuchiwanie na nowe eventy z event bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(() => {
      console.log('🔔 Otrzymano informację o nowym evencie, odświeżam listę');
      loadEventsFromAPI();
    });

    return unsubscribe;
  }, [loadEventsFromAPI]);

  // Ładowanie przy mount - tylko jeden raz
  useEffect(() => {
    loadEventsFromAPI();
  }, [loadEventsFromAPI]); // Dodaję loadEventsFromAPI jako zależność

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

      // Odśwież listę eventów z serwera po akcji użytkownika
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
                         (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
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





  return (
    <div className="p-4 space-y-6">
      {/* Nagłówek z przyciskiem odświeżania */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Program wydarzeń</h2>
        <Button
          onClick={() => {
            setError(null);
            loadEventsFromAPI();
          }}
          loading={isLoading}
          icon={<ArrowPathIcon className="h-5 w-5" />}
          variant="secondary"
        >
          {isLoading ? 'Ładowanie...' : 'Odśwież'}
        </Button>
      </div>

      {/* Wyświetlanie błędu */}
      {error && (
        <Alert type="error" title="Błąd ładowania">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <EventFilters
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />

      {/* Events List */}
      <EventList
        events={filteredEvents}
        isLoading={isLoading}
        onToggleFavorite={toggleFavorite}
        onToggleRegistration={toggleRegistration}
        onViewDetails={setSelectedEvent}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onToggleRegistration={toggleRegistration}
      />
    </div>
  );
}