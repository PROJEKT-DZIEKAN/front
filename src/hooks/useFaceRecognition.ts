'use client';

import { useState, useCallback } from 'react';

interface RecognitionResult {
  success: boolean;
  identity: string;
  confidence?: number;
  distance?: number;
  processing_time_seconds: number;
  timestamp: string;
  status: 'recognized' | 'unknown' | 'no_face' | 'error' | 'server_error';
  message: string;
  person?: {
    full_name: string;
    first_name: string;
    last_name: string;
  };
}

interface ApiError {
  success: boolean;
  error: string;
  message: string;
  status: string;
}

interface HealthStatus {
  status: string;
  database_loaded: boolean;
  database_size: number;
  device: string;
  timestamp: string;
}

const API_BASE_URL = 'https://duck-duck-production.up.railway.app';

export const useFaceRecognition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);

  // Sprawdzenie zdrowia API
  const checkHealth = useCallback(async (): Promise<HealthStatus | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Błąd sprawdzania zdrowia API:', err);
      return null;
    }
  }, []);

  // Rozpoznawanie twarzy
  const recognizeFace = useCallback(async (file: File): Promise<RecognitionResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Sprawdź połączenie z API
      const health = await checkHealth();
      if (!health) {
        throw new Error('Serwer rozpoznawania twarzy jest niedostępny. Spróbuj ponownie później.');
      }

      if (!health.database_loaded) {
        throw new Error('Baza danych twarzy nie jest załadowana na serwerze.');
      }

      // Wyślij plik do rozpoznania
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/camera/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status >= 500) {
          const errorData: ApiError = await response.json();
          throw new Error(errorData.message || 'Błąd serwera podczas przetwarzania zdjęcia');
        } else {
          throw new Error(`HTTP Error: ${response.status}`);
        }
      }

      const recognition: RecognitionResult = await response.json();
      setResult(recognition);
      return recognition;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      setError(errorMessage);
      console.error('Błąd rozpoznawania twarzy:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkHealth]);

  // Alternatywny endpoint dla zwykłego rozpoznawania (bez dodatkowych danych)
  const recognizeFaceSimple = useCallback(async (file: File): Promise<RecognitionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/recognize/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      setError(errorMessage);
      console.error('Błąd rozpoznawania (simple):', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Przeładowanie bazy danych
  const reloadDatabase = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/database/reload`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      return result.success || false;
    } catch (err) {
      console.error('Błąd przeładowania bazy:', err);
      return false;
    }
  }, []);

  // Czyszczenie stanów
  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // Sprawdź czy API jest dostępne
  const isApiAvailable = useCallback(async (): Promise<boolean> => {
    const health = await checkHealth();
    return health !== null && health.status === 'healthy';
  }, [checkHealth]);

  return {
    // Stan
    isLoading,
    error,
    result,
    
    // Funkcje
    recognizeFace,
    recognizeFaceSimple,
    checkHealth,
    reloadDatabase,
    clearResults,
    isApiAvailable,
    
    // Stałe
    API_BASE_URL,
  };
};

export default useFaceRecognition;