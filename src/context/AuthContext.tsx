'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const loginWithUserId = async (userId: number): Promise<boolean> => {
    try {
      const mockUsers: User[] = [
        { id: 1, firstName: 'Jan', surname: 'Kowalski', roles: ['ADMIN'] },
        { id: 2, firstName: 'Anna', surname: 'Nowak', roles: ['ADMIN'] },
        { id: 3, firstName: 'Piotr', surname: 'Wiśniewski', roles: ['USER'] },
        { id: 4, firstName: 'Maria', surname: 'Wójcik', roles: ['USER'] },
      ];

      const mockUser = mockUsers.find(u => u.id === userId);
      if (!mockUser) return false;

      const mockToken = `mock_token_${userId}_${Date.now()}`;
      
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', mockToken);
      
      return true;
    } catch {
      return false;
    }
  };

  const login = async (authToken: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', authToken);
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
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const { accessToken } = await response.json();
        setToken(accessToken);
        localStorage.setItem('authToken', accessToken);
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
