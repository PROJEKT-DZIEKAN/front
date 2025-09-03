'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '@/types/auth';
import { extractUserFromToken } from '@/utils/authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const loginWithUserId = async (userId: number): Promise<boolean> => {
    try {
      console.log(`🔐 Logowanie użytkownika ID: ${userId}`);
      
      // Wywołaj prawdziwy endpoint logowania
      const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/auth/login-by-user-id/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Nieprawidłowy ID użytkownika');
          return false;
        }
        console.error(`❌ Błąd logowania: ${response.status}`);
        return false;
      }
      
      const tokens = await response.json();
      console.log('✅ Otrzymano tokeny:', { accessToken: tokens.accessToken ? 'EXISTS' : 'MISSING' });
      
      // Zapisz tokeny
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('authToken', tokens.accessToken); // dla kompatybilności
      
      // Wyciągnij dane użytkownika z JWT tokena
      const userData = extractUserFromToken(tokens.accessToken);
      if (!userData) {
        console.error('❌ Błąd dekodowania JWT tokena');
        return false;
      }
      
      console.log('✅ Otrzymano dane użytkownika z JWT:', userData);
      console.log('🔑 Role użytkownika:', userData.roles);
      
      // Zapisz dane użytkownika
      setUser(userData);
      setToken(tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('❌ Błąd logowania:', error);
      return false;
    }
  };

  const login = async (authToken: string): Promise<void> => {
    try {
      // Wyciągnij dane użytkownika z JWT tokena
      const userData = extractUserFromToken(authToken);
      if (userData) {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('refreshToken', `refresh_${authToken}`);
        console.log('✅ Zalogowano użytkownika z JWT:', userData);
        console.log('🔑 Role użytkownika:', userData.roles);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch('https://dziekan-48de5f4dea14.herokuapp.com/api/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const tokens = await response.json();
        setToken(tokens.accessToken);
        localStorage.setItem('authToken', tokens.accessToken);
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const isAdmin = user?.roles?.includes('ADMIN') || false;
  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    loginWithUserId,
    login,
    logout,
    refreshAccessToken,
    loading: isLoading,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthContext = useAuth;
