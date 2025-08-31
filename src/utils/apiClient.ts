import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './authUtils';

// Interface dla błędu axios
export interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
}

// Funkcja do obsługi błędów axios
export const handleAxiosError = (error: unknown, context: string) => {
  console.error(`❌ Błąd ${context}:`, error);
  
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosErrorResponse;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    console.error('Status:', status, 'Data:', data);
    
    if (status === 403) {
      alert('❌ Błąd 403: Brak uprawnień. Sprawdź czy jesteś zalogowany jako admin.');
    } else if (status === 400) {
      alert(`❌ Błąd 400: Nieprawidłowe dane. ${JSON.stringify(data)}`);
    } else if (status === 401) {
      alert('❌ Błąd 401: Nieautoryzowany dostęp. Zaloguj się ponownie.');
    } else {
      alert(`❌ Błąd ${status}: ${JSON.stringify(data)}`);
    }
  } else {
    alert(`❌ Błąd połączenia z serwerem podczas ${context}`);
  }
};

// Konfiguracja axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor dla błędów
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token wygasł - można dodać automatyczne odświeżanie
      console.log('Token wygasł, wymagane ponowne logowanie');
    }
    return Promise.reject(error);
  }
);
