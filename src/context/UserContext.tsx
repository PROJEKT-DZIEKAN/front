'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Typy danych
interface User {
  id: number;
  firstName: string;
  surname: string;
  registrationStatus?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithUserId: (userId: number) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | null>(null);

// Konfiguracja API
const API_BASE_URL = 'https://dziekan-backend.onrender.com';

// Provider komponent
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Funkcje do zarządzania tokenami
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

  // Funkcja logowania przez userId
  const loginWithUserId = async (userId: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Wysyłanie żądania logowania
      const response = await axios.post(`${API_BASE_URL}/api/auth/login-by-id`, {
        userId: userId
      });

      const tokens: AuthTokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      };

      saveTokens(tokens);

      // Pobranie danych użytkownika
      const userDataResponse = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });

      setUser(userDataResponse.data);
      setIsAuthenticated(true);
      return true;
      
    } catch (error) {
      console.error('Błąd logowania:', error);
      
      // Bardziej szczegółowe logowanie błędów
      if (error instanceof Error) {
        console.error('Szczegóły błędu:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // Sprawdzanie typu błędu
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
      }
      
      clearTokens();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja odświeżania tokenu
  const refreshAccessToken = async (): Promise<boolean> => {
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
  };

  // Funkcja wylogowania
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearTokens();
  };

  // Funkcja ładowania użytkownika z localStorage przy starcie
  const loadUserFromStorage = async () => {
    try {
      const tokens = getTokens();
      if (!tokens) {
        setIsLoading(false);
        return;
      }

      // Próba pobrania danych użytkownika
      const userDataResponse = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });

      setUser(userDataResponse.data);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Błąd ładowania użytkownika:', error);
      // Próba odświeżenia tokenu
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        await loadUserFromStorage();
      } else {
        clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Efekt ładowania użytkownika przy starcie
  useEffect(() => {
    loadUserFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: UserContextType = {
    user,
    isAuthenticated,
    isLoading,
    loginWithUserId,
    logout,
    refreshAccessToken
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook do używania kontekstu
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser musi być używany wewnątrz UserProvider');
  }
  return context;
} 