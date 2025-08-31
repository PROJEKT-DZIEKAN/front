'use client';

import { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { Event, EventContextType } from '@/types/event';
import { getAuthHeaders, API_BASE_URL } from '@/utils/authUtils';
import { handleAxiosError } from '@/utils/apiClient';
import { eventBus } from '@/utils/eventBus';

const EventContext = createContext<EventContextType | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  // Funkcje do zarządzania eventami
  const createEvent = async (event: Event): Promise<Event | null> => {
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        console.error('Brak tokenów autoryzacji');
        alert('❌ Błąd: Brak tokenów autoryzacji. Zaloguj się ponownie.');
        return null;
      }

      // Konwersja dat do formatu ISO jeśli potrzeba
      const eventData = {
        title: event.title,
        description: event.description,
        startTime: event.startTime.includes('T') ? event.startTime : `${event.startTime}:00`,
        endTime: event.endTime.includes('T') ? event.endTime : `${event.endTime}:00`,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxParticipants: event.maxParticipants,
        organizerId: event.organizer?.id
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

  const updateEvent = async (id: number, event: Event): Promise<Event | null> => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return null;

      const response = await axios.put(`${API_BASE_URL}/api/events/update/${id}`, {
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxParticipants: event.maxParticipants,
        organizer: event.organizer
      }, { headers });

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
      console.log('🚀 Wysyłam request do:', `${API_BASE_URL}/api/events`);
      
      const response = await axios.get(`${API_BASE_URL}/api/events`, { headers });
      console.log('📥 Odpowiedź:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Błąd pobierania eventów:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('❌ Status:', axiosError.response?.status);
        console.error('❌ Data:', axiosError.response?.data);
      }
      // Nie próbujemy ponownie automatycznie - pozwalamy userowi zdecydować
      throw error; // Rzucamy błąd, żeby EventProgram mógł go obsłużyć
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
