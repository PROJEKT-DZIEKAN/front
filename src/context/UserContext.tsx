'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import axios from 'axios';

interface User {
  id: number;
  firstName: string;
  surname: string;
  registrationStatus?: string;
  roles?: string[]; // Dodaję role z JWT tokenu
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Dodaję interface dla Event zgodnie z backendem
interface Event {
  id?: number;
  title: string;
  description: string;
  startTime: string; // ISO string format
  endTime: string;   // ISO string format
  location: string;
  latitude?: number;
  longitude?: number;
  qrcodeUrl?: string;
  maxParticipants?: number;
  organizer?: User;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean; // Sprawdzanie na podstawie ról z JWT
  loginWithUserId: (userId: number) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  // Dodaję funkcje do zarządzania eventami
  createEvent: (event: Event) => Promise<Event | null>;
  updateEvent: (id: number, event: Event) => Promise<Event | null>;
  deleteEvent: (id: number) => Promise<boolean>;
  getAllEvents: () => Promise<Event[]>;
}

const UserContext = createContext<UserContextType | null>(null);


const API_BASE_URL = 'https://dziekan-backend-ywfy.onrender.com';

// Funkcja do dekodowania JWT tokenu (bez weryfikacji - tylko odczyt)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Błąd dekodowania JWT:', error);
    return null;
  }
};

// Prosty event bus do informowania o zmianach w eventach
class EventBus {
  private listeners: Array<() => void> = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

const eventBus = new EventBus();

export { eventBus };

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sprawdzanie uprawnień admina - na podstawie ról z JWT tokenu
  const isAdmin = useMemo(() => {
    const hasAdminRole = isAuthenticated && user?.roles?.includes('admin');
    return hasAdminRole || false;
  }, [isAuthenticated, user]);

  // Funkcja do pobrania tokenów z nagłówkami autoryzacji
  const getAuthHeaders = () => {
    const tokens = getTokens();
    if (!tokens) return null;
    
    return {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json'
    };
  };

  
  const saveTokens = (tokens: AuthTokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  };

  const getTokens = (): AuthTokens | null => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    clearTokens();
  }, []);

  // Funkcja do wyciągania danych użytkownika z JWT tokenu
  const extractUserFromToken = useCallback((accessToken: string): User | null => {
    const tokenData = decodeJWT(accessToken);
    if (!tokenData) return null;

    const roles = Array.isArray(tokenData.role) ? tokenData.role : (tokenData.role ? [tokenData.role] : []);
    
    return {
      id: parseInt(tokenData.sub),
      firstName: tokenData.firstName,
      surname: tokenData.surname,
      registrationStatus: tokenData.status,
      roles: roles
    };
  }, []); // Brak zależności, bo nie używa żadnych zmiennych z zewnątrz

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const tokens = getTokens();
      if (!tokens) return false;

      const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {
        refreshToken: tokens.refreshToken
      });

      const newTokens: AuthTokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      };

      saveTokens(newTokens);
      return true;
      
    } catch (error) {
      console.error('Błąd odświeżania tokenu:', error);
      logout();
      return false;
    }
  }, [logout]); // Dodaję logout jako zależność


  const loginWithUserId = async (userId: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login-by-id`, {
        userId: userId
      });

      const tokens: AuthTokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      };

      saveTokens(tokens);

      // Wyciągnij dane usera z JWT tokenu zamiast robić dodatkowe zapytanie
      const userData = extractUserFromToken(tokens.accessToken);
      if (!userData) {
        throw new Error('Nie można wyciągnąć danych z tokenu');
      }

      setUser(userData);
      setIsAuthenticated(true);
      return true;
      
    } catch (error) {
      console.error('Błąd logowania:', error);
    
      if (error instanceof Error) {
        console.error('Szczegóły błędu:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
     
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: unknown;
          };
          config?: {
            url?: string;
          };
        };
        console.error('Błąd HTTP:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          url: axiosError.config?.url
        });
        
       
        alert(`❌ Backend Error: ${axiosError.response?.status} - ${JSON.stringify(axiosError.response?.data)}`);
      }
      
      clearTokens();
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const loadUserFromStorage = useCallback(async () => {
    try {
      const tokens = getTokens();
      if (!tokens) {
        setIsLoading(false);
        return;
      }

      // Wyciągnij dane usera z JWT tokenu zamiast robić dodatkowe zapytanie
      const userData = extractUserFromToken(tokens.accessToken);
      if (!userData) {
        // Jeśli token jest nieprawidłowy, spróbuj odświeżyć
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          const newTokens = getTokens();
          if (newTokens) {
            const newUserData = extractUserFromToken(newTokens.accessToken);
            if (newUserData) {
              setUser(newUserData);
              setIsAuthenticated(true);
            }
          }
        } else {
          clearTokens();
        }
        return;
      }

      setUser(userData);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Błąd ładowania użytkownika:', error);
      
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        const newTokens = getTokens();
        if (newTokens) {
          const newUserData = extractUserFromToken(newTokens.accessToken);
          if (newUserData) {
            setUser(newUserData);
            setIsAuthenticated(true);
          }
        }
      } else {
        clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, [extractUserFromToken, refreshAccessToken]); // Dodaję zależności

  // Dodaję interface dla błędu axios
  interface AxiosErrorResponse {
    response?: {
      status?: number;
      data?: unknown;
    };
  }

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]); // Dodaję zależność

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
        organizerId: user?.id
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
      eventBus.emit();
      
      return response.data;
    } catch (error) {
      console.error('❌ Błąd tworzenia eventu:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosErrorResponse;
        const status = axiosError.response?.status;
        const data = axiosError.response?.data;
        
        console.error('Status:', status, 'Data:', data);
        
        if (status === 403) {
          alert('❌ Błąd 403: Brak uprawnień. Sprawdź czy jesteś zalogowany jako admin.');
        } else if (status === 400) {
          alert(`❌ Błąd 400: Nieprawidłowe dane. ${JSON.stringify(data)}`);
        } else {
          alert(`❌ Błąd ${status}: ${JSON.stringify(data)}`);
        }
      } else {
        alert('❌ Błąd połączenia z serwerem');
      }
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
        organizer: user
      }, { headers });

      return response.data;
    } catch (error) {
      console.error('Błąd aktualizacji eventu:', error);
      return null;
    }
  };

  const deleteEvent = async (id: number): Promise<boolean> => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return false;

      await axios.delete(`${API_BASE_URL}/api/events/delete/${id}`, { headers });
      return true;
    } catch (error) {
      console.error('Błąd usuwania eventu:', error);
      return false;
    }
  };

  const getAllEvents = async (): Promise<Event[]> => {
    try {
      // Eventy są publiczne, nie wymagają autoryzacji
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      return response.data;
    } catch (error) {
      console.error('Błąd pobierania eventów:', error);
      // Nie próbujemy ponownie automatycznie - pozwalamy userowi zdecydować
      throw error; // Rzucamy błąd, żeby EventProgram mógł go obsłużyć
    }
  };

  const value: UserContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    loginWithUserId,
    logout,
    refreshAccessToken,
    // Dodaję funkcje do zarządzania eventami
    createEvent,
    updateEvent,
    deleteEvent,
    getAllEvents
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser musi być używany wewnątrz UserProvider');
  }
  return context;
} 