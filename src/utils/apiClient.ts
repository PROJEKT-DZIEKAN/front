import axios, { AxiosError } from 'axios';
import { API_BASE_URL, getAuthHeaders } from './authUtils';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest, SurveyAnswer } from '@/types/survey';

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

// === SURVEY API FUNCTIONS ===

// Funkcja do pobierania wszystkich ankiet
export const getAllSurveys = async (): Promise<Survey[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await apiClient.get('/api/surveys', { headers });
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'pobierania ankiet');
    throw error;
  }
};

// Funkcja do pobierania pojedynczej ankiety
export const getSurvey = async (surveyId: number): Promise<Survey> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await apiClient.get(`/api/surveys/${surveyId}`, { headers });
    return response.data;
  } catch (error) {
    handleAxiosError(error, `pobierania ankiety ${surveyId}`);
    throw error;
  }
};

// Funkcja do tworzenia nowej ankiety (tylko admin)
export const createSurvey = async (surveyRequest: CreateSurveyRequest): Promise<Survey> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await apiClient.post('/api/surveys', surveyRequest, { headers });
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'tworzenia ankiety');
    throw error;
  }
};

// Funkcja do aktualizacji ankiety (tylko admin)
export const updateSurvey = async (surveyId: number, surveyRequest: UpdateSurveyRequest): Promise<Survey> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await apiClient.put(`/api/surveys/${surveyId}`, surveyRequest, { headers });
    return response.data;
  } catch (error) {
    handleAxiosError(error, `aktualizacji ankiety ${surveyId}`);
    throw error;
  }
};

// Funkcja do usuwania ankiety (tylko admin)
export const deleteSurvey = async (surveyId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    await apiClient.delete(`/api/surveys/${surveyId}`, { headers });
  } catch (error) {
    handleAxiosError(error, `usuwania ankiety ${surveyId}`);
    throw error;
  }
};

// Funkcja do przesyłania odpowiedzi na ankietę
export const submitSurveyAnswers = async (surveyId: number, answers: SurveyAnswer[], userId: number): Promise<boolean> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    await apiClient.post(`/api/surveys/${surveyId}/answers?userId=${userId}`, answers, { headers });
    return true;
  } catch (error) {
    handleAxiosError(error, `przesyłania odpowiedzi na ankietę ${surveyId}`);
    return false;
  }
};
