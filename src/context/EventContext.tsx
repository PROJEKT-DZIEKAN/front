'use client';

import { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { Event, EventContextType, CreateEventRequest } from '@/types/event';
import { getAuthHeaders, API_BASE_URL } from '@/utils/authUtils';
import { handleAxiosError } from '@/utils/apiClient';
import { eventBus } from '@/utils/eventBus';

const EventContext = createContext<EventContextType | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  // Funkcje do zarządzania eventami
  const createEvent = async (event: CreateEventRequest): Promise<Event | null> => {
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        console.error('Brak tokenów autoryzacji');
        alert('❌ Błąd: Brak tokenów autoryzacji. Zaloguj się ponownie.');
        return null;
      }
      const eventData: CreateEventRequest = {
        title: event.title,
        description: event.description,
        startTime: event.startTime.includes('T') ? event.startTime : `${event.startTime}:00`,
        endTime: event.endTime.includes('T') ? event.endTime : `${event.endTime}:00`,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxParticipants: event.maxParticipants
      };

      console.log('📤 Wysyłam dane eventu:', eventData);
      console.log('🔑 Nagłówki:', headers);

      const response = await axios.post(
        `${API_BASE_URL}/api/events/create`, 
        eventData,
        { headers }
      );

      console.log('📥 Odpowiedź z serwera:', response.data);
      
      // Informuj inne komponenty o nowym evencie
      console.log('🔔 Emitowanie eventu przez EventBus...');
      eventBus.emit();
      console.log('✅ EventBus emit wykonany');
      
      return response.data;
    } catch (error) {
      handleAxiosError(error, 'tworzenia eventu');
      return null;
    }
  };

  const updateEvent = async (id: number, event: CreateEventRequest): Promise<Event | null> => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null;

      const response = await axios.put(
        `${API_BASE_URL}/api/events/update/${id}`,
        {
          title: event.title,
          description: event.description,
          startTime: event.startTime.includes('T') ? event.startTime : `${event.startTime}:00`,
          endTime: event.endTime.includes('T') ? event.endTime : `${event.endTime}:00`,
          location: event.location,
          latitude: event.latitude,
          longitude: event.longitude,
          maxParticipants: event.maxParticipants
        },
        { headers }
      );

      // Informuj o zmianie
      eventBus.emit();
      return response.data;
    } catch (error) {
      handleAxiosError(error, 'aktualizacji eventu');
      return null;
    }
  };

  const deleteEvent = async (id: number): Promise<boolean> => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return false;

      await axios.delete(`${API_BASE_URL}/api/events/delete/${id}`, { headers });
      
      // Informuj o usunięciu
      eventBus.emit();
      return true;
    } catch (error) {
      handleAxiosError(error, 'usuwania eventu');
      return false;
    }
  };

  const getAllEvents = async (): Promise<Event[]> => {
    try {
      console.log('🔍 getAllEvents: Sprawdzam autoryzację...');
      
      // Backend wymaga autoryzacji dla eventów
      const headers = getAuthHeaders();
      if (!headers) {
        console.error('❌ Brak tokenów autoryzacji dla getAllEvents');
        console.log('🔍 Tokens:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
        throw new Error('Unauthorized - no tokens');
      }
      
      console.log('✅ Headers gotowe:', headers);

      // Sprawdź czy jest alternatywny token w localStorage (jak w createGroup)
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const token = localStorage.getItem('token');
      
      console.log('🔑 Dostępne tokeny:', {
        accessToken: accessToken ? 'EXISTS' : 'MISSING',
        refreshToken: refreshToken ? 'EXISTS' : 'MISSING',
        token: token ? 'EXISTS' : 'MISSING'
      });

      // Użyj odpowiedniego tokenu (podobnie jak w createGroup)
      const authToken = accessToken || token;
      if (!authToken) {
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }

      const alternativeHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };

      // Próbujemy różne możliwe endpointy zgodnie z dokumentacją API
      const possibleEndpoints = [
        `${API_BASE_URL}/api/events/all`,
        `${API_BASE_URL}/api/events`,
        `${API_BASE_URL}/api/admin/events`,
        `${API_BASE_URL}/api/events/list`
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Próbuję endpoint: ${endpoint}`);
          // Próbuj najpierw z alternativeHeaders, potem z headers
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: alternativeHeaders
          });

          console.log(`📡 Response status dla ${endpoint}:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Otrzymano eventy z ${endpoint}:`, data);
            
            if (!Array.isArray(data)) {
              console.error('❌ API zwróciło nieprawidłowe dane eventów:', data);
              continue;
            }
            
            console.log(`✅ Załadowano ${data.length} eventów`);
            return data;
          } else if (response.status === 403) {
            console.log(`⚠️ 403 Forbidden dla ${endpoint} - brak uprawnień`);
            continue;
          }
        } catch (error) {
          console.log(`❌ Błąd dla endpointu ${endpoint}:`, error);
        }
      }

      // Jeśli żaden endpoint nie działa, zwróć pustą tablicę
      console.warn('⚠️ Nie udało się pobrać eventów z żadnego endpointu, zwracam pustą tablicę');
      return [];
    } catch (error) {
      console.error('❌ Błąd pobierania eventów:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('❌ Status:', axiosError.response?.status);
        console.error('❌ Data:', axiosError.response?.data);
      }
      // Zwracamy pustą tablicę zamiast rzucania błędem
      return [];
    }
  };

  const value: EventContextType = {
    createEvent,
    updateEvent,
    deleteEvent,
    getAllEvents
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents musi być używany wewnątrz EventProvider');
  }
  return context;
}
