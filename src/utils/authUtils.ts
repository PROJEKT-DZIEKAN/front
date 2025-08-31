import { User, AuthTokens } from '@/types/auth';

const API_BASE_URL = 'https://dziekan-backend-ywfy.onrender.com';

// Funkcja do dekodowania JWT tokenu (bez weryfikacji - tylko odczyt)
export const decodeJWT = (token: string) => {
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

// Funkcja do wyciągania danych użytkownika z JWT tokenu
export const extractUserFromToken = (accessToken: string): User | null => {
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
};

// Funkcja do pobrania tokenów z localStorage
export const getTokens = (): AuthTokens | null => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (accessToken && refreshToken) {
    return { accessToken, refreshToken };
  }
  return null;
};

// Funkcja do zapisania tokenów w localStorage
export const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

// Funkcja do usunięcia tokenów z localStorage
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Funkcja do pobrania nagłówków autoryzacji
export const getAuthHeaders = () => {
  const tokens = getTokens();
  if (!tokens) return null;
  
  return {
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Content-Type': 'application/json'
  };
};

export { API_BASE_URL };
