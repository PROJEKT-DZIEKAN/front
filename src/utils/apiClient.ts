import axios, { AxiosError } from 'axios';
import { API_BASE_URL, getAuthHeaders } from './authUtils';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest, SurveyAnswer } from '@/types/survey';
import { Group, CreateGroupRequest, UpdateGroupRequest } from '@/types/group';
import { User } from '@/types/auth';

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
    
    // Sprawdzenie czy response.data jest tablicą
    if (!Array.isArray(response.data)) {
      console.error('❌ API zwróciło nieprawidłowe dane ankiet:', response.data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy ankiet');
    }
    
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

// === GROUP API FUNCTIONS ===

// Funkcja do pobierania wszystkich grup
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    console.log('🔍 Pobieranie wszystkich grup...');

    // Próbujemy różne możliwe endpointy
    const possibleEndpoints = [
      'https://dziekan-48de5f4dea14.herokuapp.com/api/groups/all',
      'https://dziekan-48de5f4dea14.herokuapp.com/api/groups',
      'https://dziekan-48de5f4dea14.herokuapp.com/api/admin/groups'
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔍 Próbuję endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers
        });

        console.log(`📡 Response status dla ${endpoint}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Otrzymano grupy z ${endpoint}:`, data);
          
          if (!Array.isArray(data)) {
            console.error('❌ API zwróciło nieprawidłowe dane grup:', data);
            continue;
          }
          
          console.log(`✅ Załadowano ${data.length} grup`);
          return data;
        }
      } catch (error) {
        console.log(`❌ Błąd dla endpointu ${endpoint}:`, error);
      }
    }

    // Jeśli żaden endpoint nie działa, zwróć pustą tablicę
    console.warn('⚠️ Nie udało się pobrać grup z żadnego endpointu, zwracam pustą tablicę');
    return [];
  } catch (error) {
    console.error('❌ Błąd pobierania grup:', error);
    handleAxiosError(error, 'pobierania grup');
    return []; // Zwracamy pustą tablicę zamiast rzucania błędem
  }
};

// Funkcja do pobierania pojedynczej grupy
export const getGroupById = async (groupId: number): Promise<Group> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/${groupId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    handleAxiosError(error, `pobierania grupy ${groupId}`);
    throw error;
  }
};

// Funkcja do tworzenia nowej grupy (tylko admin/organizator)
export const createGroup = async (groupRequest: CreateGroupRequest): Promise<Group> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    console.log('🔍 Tworzenie grupy z danymi:', groupRequest);

    // Próbujemy różne struktury danych
    const possiblePayloads = [
      // Struktura 1: Pełny obiekt jak w oryginalnym skrypcie
      {
        name: groupRequest.name,
        description: groupRequest.description || '',
        maxParticipants: groupRequest.maxParticipants || null,
        createdAt: new Date().toISOString(),
        organizer: { id: groupRequest.organizerId }
      },
      // Struktura 2: Uproszczona
      {
        name: groupRequest.name,
        description: groupRequest.description || '',
        maxParticipants: groupRequest.maxParticipants,
        organizerId: groupRequest.organizerId
      },
      // Struktura 3: Jeszcze prostsza
      {
        name: groupRequest.name,
        description: groupRequest.description,
        maxParticipants: groupRequest.maxParticipants,
        organizer: groupRequest.organizerId
      }
    ];

    const possibleEndpoints = [
      'https://dziekan-48de5f4dea14.herokuapp.com/api/groups/create',
      'https://dziekan-48de5f4dea14.herokuapp.com/api/groups',
      'https://dziekan-48de5f4dea14.herokuapp.com/api/admin/groups/create'
    ];

    for (const endpoint of possibleEndpoints) {
      for (const payload of possiblePayloads) {
        try {
          console.log(`🔍 Próbuję endpoint: ${endpoint} z payload:`, payload);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });

          console.log(`📡 Response status dla ${endpoint}:`, response.status);

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Grupa utworzona pomyślnie:', result);
            return result;
          } else {
            const errorText = await response.text();
            console.log(`❌ Błąd ${response.status} dla ${endpoint}:`, errorText);
          }
        } catch (error) {
          console.log(`❌ Błąd dla ${endpoint}:`, error);
        }
      }
    }

    throw new Error('Nie udało się utworzyć grupy z żadnym endpointem/payloadem');
  } catch (error) {
    console.error('❌ Błąd tworzenia grupy:', error);
    handleAxiosError(error, 'tworzenia grupy');
    throw error;
  }
};

// Funkcja do aktualizacji grupy (tylko admin/organizator)
export const updateGroup = async (groupId: number, groupRequest: UpdateGroupRequest): Promise<Group> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/update/${groupId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(groupRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    handleAxiosError(error, `aktualizacji grupy ${groupId}`);
    throw error;
  }
};

// Funkcja do usuwania grupy (tylko admin/organizator)
export const deleteGroup = async (groupId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/delete/${groupId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    handleAxiosError(error, `usuwania grupy ${groupId}`);
    throw error;
  }
};

// Funkcja do dołączania do grupy
export const joinGroup = async (groupId: number, userId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/add-participant/${groupId}/${userId}`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    handleAxiosError(error, `dołączania do grupy ${groupId}`);
    throw error;
  }
};

// Funkcja do opuszczania grupy
export const leaveGroup = async (groupId: number, userId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/remove-participant/${groupId}/${userId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    handleAxiosError(error, `opuszczania grupy ${groupId}`);
    throw error;
  }
};

// Funkcja do pobierania grup użytkownika
export const getMyGroups = async (userId: number): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    console.log(`🔍 Pobieranie grup dla użytkownika ${userId}`);

    // Próbujemy różne możliwe endpointy
    const possibleEndpoints = [
      `https://dziekan-48de5f4dea14.herokuapp.com/api/groups/by-user/${userId}`,
      `https://dziekan-48de5f4dea14.herokuapp.com/api/groups/user/${userId}`,
      `https://dziekan-48de5f4dea14.herokuapp.com/api/users/${userId}/groups`
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔍 Próbuję endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers
        });

        console.log(`📡 Response status dla ${endpoint}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Otrzymano grupy użytkownika z ${endpoint}:`, data);
          
          if (!Array.isArray(data)) {
            console.error('❌ API zwróciło nieprawidłowe dane grup użytkownika:', data);
            continue;
          }
          
          console.log(`✅ Załadowano ${data.length} grup dla użytkownika ${userId}`);
          return data;
        }
      } catch (error) {
        console.log(`❌ Błąd dla endpointu ${endpoint}:`, error);
      }
    }

    // Jeśli żaden endpoint nie działa, zwróć pustą tablicę zamiast błędu
    console.warn(`⚠️ Nie udało się pobrać grup dla użytkownika ${userId}, zwracam pustą tablicę`);
    return [];
  } catch (error) {
    console.error(`❌ Błąd pobierania grup użytkownika ${userId}:`, error);
    handleAxiosError(error, `pobierania grup użytkownika ${userId}`);
    return []; // Zwracamy pustą tablicę zamiast rzucania błędem
  }
};

// Funkcja do wyszukiwania grup po nazwie
export const searchGroupsByName = async (name: string): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/by-title?title=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane wyszukiwania grup:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy grup');
    }
    
    return data;
  } catch (error) {
    handleAxiosError(error, `wyszukiwania grup po nazwie "${name}"`);
    throw error;
  }
};

// === USER API FUNCTIONS ===

// Funkcja do pobierania wszystkich użytkowników (tylko admin)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    console.log('🔍 Pobieranie użytkowników z endpoint: /api/users');
    console.log('🔑 Headers:', headers);
    
    const response = await fetch('https://dziekan-48de5f4dea14.herokuapp.com/api/users', {
      method: 'GET',
      headers
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Otrzymano dane:', data);
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane użytkowników:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy użytkowników');
    }
    
    console.log(`✅ Załadowano ${data.length} użytkowników`);
    return data;
  } catch (error) {
    console.error('❌ Błąd pobierania użytkowników:', error);
    handleAxiosError(error, 'pobierania użytkowników');
    throw error;
  }
};

// Funkcja do pobierania użytkownika po ID
export const getUserById = async (userId: number): Promise<User> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/users/${userId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    handleAxiosError(error, `pobierania użytkownika ${userId}`);
    throw error;
  }
};

// Funkcja do wyszukiwania użytkowników po nazwie
export const searchUsersByName = async (name: string): Promise<User[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    // Jeśli nie ma wyszukiwanej frazy, zwróć wszystkich użytkowników
    if (!name.trim()) {
      return await getAllUsers();
    }

    const possibleEndpoints = [
      `https://dziekan-48de5f4dea14.herokuapp.com/api/users/search?name=${encodeURIComponent(name)}`,
      `https://dziekan-48de5f4dea14.herokuapp.com/api/users?search=${encodeURIComponent(name)}`,
      `https://dziekan-48de5f4dea14.herokuapp.com/api/user/search?name=${encodeURIComponent(name)}`
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          
          if (!Array.isArray(data)) {
            console.error('❌ API zwróciło nieprawidłowe dane wyszukiwania użytkowników:', data);
            continue;
          }
          
          return data;
        }
      } catch (error) {
        console.log(`Błąd dla endpointu ${endpoint}:`, error);
      }
    }

    // Jeśli wyszukiwanie nie działa, spróbuj pobrać wszystkich i przefiltrować lokalnie
    try {
      const allUsers = await getAllUsers();
      return allUsers.filter(user => 
        user.firstName.toLowerCase().includes(name.toLowerCase()) ||
        user.surname.toLowerCase().includes(name.toLowerCase())
      );
    } catch (error) {
      console.error('Nie udało się wyszukać użytkowników:', error);
      return [];
    }
  } catch (error) {
    handleAxiosError(error, `wyszukiwania użytkowników po nazwie "${name}"`);
    return [];
  }
};
