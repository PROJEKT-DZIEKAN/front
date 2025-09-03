'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import axios from 'axios';
import { AuthContextType, User, AuthTokens } from '@/types/auth';
import { 
  extractUserFromToken, 
  getTokens, 
  saveTokens, 
  clearTokens, 
  API_BASE_URL 
} from '@/utils/authUtils';
import { handleAxiosError } from '@/utils/apiClient';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Sprawdzanie uprawnień admina - na podstawie ról z JWT tokenu
  const isAdmin = useMemo(() => {
    const hasAdminRole = isAuthenticated && (
      user?.roles?.includes('admin') || 
      user?.roles?.includes('ADMIN') ||
      user?.roles?.some((role: string | { roleName?: string }) => 
        typeof role === 'object' && (role?.roleName === 'admin' || role?.roleName === 'ADMIN')
      )
    );
    console.log('🔍 isAdmin check:', { isAuthenticated, userRoles: user?.roles, hasAdminRole });
    return hasAdminRole || false;
  }, [isAuthenticated, user]);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    clearTokens();
    setToken(null);
  }, []);

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
      setToken(newTokens.accessToken);
      return true;
      
    } catch (error) {
      console.error('Błąd odświeżania tokenu:', error);
      logout();
      return false;
    }
  }, [logout]);

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
      setToken(tokens.accessToken);
      return true;
      
    } catch (error) {
      handleAxiosError(error, 'logowania');
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
              setToken(newTokens.accessToken);
            }
          }
        } else {
          clearTokens();
        }
        return;
      }

      setUser(userData);
      setIsAuthenticated(true);
      setToken(tokens.accessToken);
      
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
            setToken(newTokens.accessToken);
          }
        }
      } else {
        clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Dodaję funkcję login dla kompatybilności
  const login = useCallback(async (authToken: string) => {
    setToken(authToken);
    localStorage.setItem('accessToken', authToken);
    
    const userData = extractUserFromToken(authToken);
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    loginWithUserId,
    login,
    logout,
    refreshAccessToken,
    loading: isLoading, // alias
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  return context;
}
