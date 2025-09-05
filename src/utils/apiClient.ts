import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, getAuthHeaders } from './authUtils';
import { Survey, CreateSurveyRequest, UpdateSurveyRequest, SurveyAnswer } from '@/types/survey';
import { Group, CreateGroupRequest, UpdateGroupRequest } from '@/types/group';
import { User } from '@/types/auth';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
 _retry?: boolean;
}

export interface AxiosErrorResponse extends AxiosError {
 config: CustomAxiosRequestConfig;
}

interface QueueItem {
 resolve: (token: string) => void;
 reject: (error: AxiosError) => void;
}

interface TokenResponse {
 accessToken: string;
 refreshToken: string;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
 failedQueue.forEach(prom => {
   if (error) {
     prom.reject(error);
   } else if (token) {
     prom.resolve(token);
   }
 });

 failedQueue = [];
};

const refreshTokens = async (): Promise<string | null> => {
 try {
   const refreshToken = localStorage.getItem('refreshToken');
   if (!refreshToken) {
     throw new Error('No refresh token');
   }

   const response = await axios.post<TokenResponse>(`${API_BASE_URL}/api/auth/refresh`, {
     refreshToken
   });

   const { accessToken, refreshToken: newRefreshToken } = response.data;

   localStorage.setItem('accessToken', accessToken);
   localStorage.setItem('refreshToken', newRefreshToken);

   return accessToken;
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
 } catch (error) {
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   window.location.href = '/login';
   return null;
 }
};

export const handleAxiosError = (error: unknown, context: string) => {
 console.error(`Error during ${context}:`, error);

 if (axios.isAxiosError(error)) {
   const status = error.response?.status;
   const data = error.response?.data;

   console.error('Status:', status, 'Data:', data);

   if (status === 403 || status === 401) {
     return;
   } else if (status === 400) {
     alert(`Error 400: Invalid data. ${JSON.stringify(data)}`);
   } else {
     alert(`Error ${status}: ${JSON.stringify(data)}`);
   }
 } else {
   alert(`Server connection error during ${context}`);
 }
};

export const apiClient = axios.create({
 baseURL: API_BASE_URL,
 timeout: 10000,
});

apiClient.interceptors.request.use(
 (config) => {
   const token = localStorage.getItem('accessToken');
   if (token) {
     config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
 },
 (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
 (response) => response,
 async (error: AxiosError) => {
   const originalRequest = error.config as CustomAxiosRequestConfig;

   if (!originalRequest) {
     return Promise.reject(error);
   }

   if ((error.response?.status === 401 || error.response?.status === 403)
       && !originalRequest._retry) {

     if (isRefreshing) {
       return new Promise<string>((resolve, reject) => {
         failedQueue.push({ resolve, reject });
       }).then(token => {
         originalRequest.headers.Authorization = `Bearer ${token}`;
         return apiClient(originalRequest);
       }).catch(err => {
         return Promise.reject(err);
       });
     }

     originalRequest._retry = true;
     isRefreshing = true;

     try {
       const newToken = await refreshTokens();

       if (newToken) {
         processQueue(null, newToken);
         originalRequest.headers.Authorization = `Bearer ${newToken}`;
         return apiClient(originalRequest);
       } else {
         processQueue(error, null);
         return Promise.reject(error);
       }
     } catch (refreshError) {
       const axiosError = refreshError as AxiosError;
       processQueue(axiosError, null);
       return Promise.reject(refreshError);
     } finally {
       isRefreshing = false;
     }
   }

   return Promise.reject(error);
 }
);

export const isAuthenticated = (): boolean => {
 return !!localStorage.getItem('accessToken');
};

export const logout = () => {
 localStorage.removeItem('accessToken');
 localStorage.removeItem('refreshToken');
 window.location.href = '';
};

// === SURVEY API FUNCTIONS ===

// Funkcja do pobierania wszystkich ankiet
export const getAllSurveys = async (): Promise<Survey[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await apiClient.get('/api/surveys/all', { headers });

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

export const getAllAvailableSurveys = async (userId?: number): Promise<Survey[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    // Buduj URL z opcjonalnym parametrem userId
    const url =`/api/surveys/available?userId=${userId}`

    const response = await apiClient.get(url, { headers });

    if (!Array.isArray(response.data)) {
      console.error('❌ API zwróciło nieprawidłowe dane ankiet:', response.data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy ankiet');
    }
    console.log('response', response);
    console.log('surveysData', response.data);
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'pobierania ankiet');
    throw error;
  }
}



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
// Implementacja zgodna z dokumentacją API

// Pobieranie wszystkich grup - GET /api/groups/all
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/all`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane grup:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy grup');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Błąd pobierania grup:', error);
    handleAxiosError(error, 'pobierania grup');
    throw error;
  }
};

// Pobieranie grupy po ID - GET /api/groups/{id}
export const getGroupById = async (groupId: number): Promise<Group> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Grupa nie została znaleziona');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    handleAxiosError(error, `pobierania grupy ${groupId}`);
    throw error;
  }
};

// Tworzenie grupy - POST /api/groups/create
export const createGroup = async (groupRequest: CreateGroupRequest): Promise<Group> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: groupRequest.name,
        description: groupRequest.description,
        maxParticipants: groupRequest.maxParticipants
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    handleAxiosError(error, 'tworzenia grupy');
    throw error;
  }
};

// Aktualizacja grupy - PUT /api/groups/update/{id}
export const updateGroup = async (groupId: number, groupRequest: UpdateGroupRequest): Promise<Group> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/update/${groupId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(groupRequest)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Grupa nie została znaleziona');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    handleAxiosError(error, `aktualizacji grupy ${groupId}`);
    throw error;
  }
};

// Usuwanie grupy - DELETE /api/groups/delete/{id}
export const deleteGroup = async (groupId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/delete/${groupId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Grupa nie została znaleziona');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return; // Success, no content returned
  } catch (error) {
    handleAxiosError(error, `usuwania grupy ${groupId}`);
    throw error;
  }
};

// Dodawanie uczestnika do grupy - POST /api/groups/add-participant/{groupId}/{userId}
export const addParticipantToGroup = async (groupId: number, userId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/add-participant/${groupId}/${userId}`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Grupa lub użytkownik nie został znaleziony');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return; // Success
  } catch (error) {
    handleAxiosError(error, `dodawania uczestnika ${userId} do grupy ${groupId}`);
    throw error;
  }
};

// Usuwanie uczestnika z grupy - DELETE /api/groups/remove-participant/{groupId}/{userId}
export const removeParticipantFromGroup = async (groupId: number, userId: number): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/remove-participant/${groupId}/${userId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Grupa lub użytkownik nie został znaleziony');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return; // Success
  } catch (error) {
    handleAxiosError(error, `usuwania uczestnika ${userId} z grupy ${groupId}`);
    throw error;
  }
};

// Alias functions dla kompatybilności wstecznej
export const joinGroup = addParticipantToGroup;
export const leaveGroup = removeParticipantFromGroup;

// Wyszukiwanie grup po nazwie - GET /api/groups/by-title?title={searchTerm}
export const searchGroupsByTitle = async (searchTerm: string): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/by-title?title=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane wyszukiwania grup:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy grup');
    }
    
    return data;
  } catch (error) {
    handleAxiosError(error, `wyszukiwania grup po nazwie "${searchTerm}"`);
    throw error;
  }
};

// Wyszukiwanie grup po opisie - GET /api/groups/by-description?description={searchTerm}
export const searchGroupsByDescription = async (searchTerm: string): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/by-description?description=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane wyszukiwania grup:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy grup');
    }
    
    return data;
  } catch (error) {
    handleAxiosError(error, `wyszukiwania grup po opisie "${searchTerm}"`);
    throw error;
  }
};

// Grupy z dostępnymi miejscami - GET /api/groups/with-available-spots
export const getGroupsWithAvailableSpots = async (): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/with-available-spots`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane grup z miejscami:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy grup');
    }
    
    return data;
  } catch (error) {
    handleAxiosError(error, 'pobierania grup z dostępnymi miejscami');
    throw error;
  }
};

// Grupy utworzone w określonym czasie - GET /api/groups/created-at?dateTime={ISO_DATETIME}
export const getGroupsCreatedAt = async (dateTime: string): Promise<Group[]> => {
  try {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Brak autoryzacji');

    const response = await fetch(`${API_BASE_URL}/api/groups/created-at?dateTime=${encodeURIComponent(dateTime)}`, {
      method: 'GET',
      headers
    });

    if (response.status === 404) {
      return []; // No groups found for this date
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API zwróciło nieprawidłowe dane grup z datą:', data);
      throw new Error('API zwróciło nieprawidłowe dane - oczekiwano tablicy grup');
    }
    
    return data;
  } catch (error) {
    handleAxiosError(error, `pobierania grup utworzonych ${dateTime}`);
    throw error;
  }
};

// Alias dla kompatybilności wstecznej
export const searchGroupsByName = searchGroupsByTitle;

// Funkcja uniwersalna do wyszukiwania grup
export const searchGroups = async (searchTerm: string, searchType: 'title' | 'description' = 'title'): Promise<Group[]> => {
  if (searchType === 'title') {
    return searchGroupsByTitle(searchTerm);
  } else {
    return searchGroupsByDescription(searchTerm);
  }
};

// Funkcja do pobierania grup użytkownika (może nie istnieć w API - należy sprawdzić)
export const getMyGroups = async (userId: number): Promise<Group[]> => {
  try {
    // Ponieważ nie ma dedykowanego endpointu w dokumentacji,
    // pobieramy wszystkie grupy i filtrujemy po uczestnikach
    const allGroups = await getAllGroups();
    return allGroups.filter(group => 
      group.participants?.some(participant => participant.id === userId)
    );
  } catch (error) {
    console.error(`❌ Błąd pobierania grup użytkownika ${userId}:`, error);
    handleAxiosError(error, `pobierania grup użytkownika ${userId}`);
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
