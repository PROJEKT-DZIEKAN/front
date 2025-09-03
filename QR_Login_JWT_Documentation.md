# 🔐 Dokumentacja Logowania QR + JWT - Frontend Integration

## 🌐 Informacje podstawowe

**Base URL:**
- **Development**: `http://localhost:8080`
- **Production**: `https://dziekan-48de5f4dea14.herokuapp.com`

**QR Service URL:**
- **External Service**: `https://qr-codes-dziekan.onrender.com`

---

## 🔄 Przepływ Logowania QR + JWT

### 1. **Generowanie QR Kodu**
Użytkownik otrzymuje QR kod zawierający jego `userId`

### 2. **Skanowanie QR Kodu**
Aplikacja mobilna/web skanuje QR kod i wyciąga `userId`

### 3. **Logowanie przez userId**
Frontend wysyła `userId` do endpointu logowania

### 4. **Otrzymanie Tokenów JWT**
Backend zwraca `accessToken` i `refreshToken`

### 5. **Autoryzacja Requestów**
Frontend używa `accessToken` w nagłówku `Authorization: Bearer {token}`

---

## 📱 API Endpointy

### 1. 🎯 Generowanie QR Kodu

#### GET `/api/qr/{userId}`

**Opis:** Generuje QR kod PNG dla konkretnego użytkownika

**Response:** Obraz PNG (binary data)

**JavaScript Example:**
```javascript
const getQrCodeForUser = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/qr/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // Opcjonalne, jeśli wymagane
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Zwraca blob z obrazem PNG
  return await response.blob();
};

// Użycie w React
const displayQrCode = async (userId) => {
  try {
    const qrBlob = await getQrCodeForUser(userId);
    const qrUrl = URL.createObjectURL(qrBlob);
    
    // Wyświetl obraz w komponencie
    setQrCodeUrl(qrUrl);
  } catch (error) {
    console.error('Error loading QR code:', error);
  }
};
```

**Status Codes:**
- `200 OK` - QR kod wygenerowany (image/png)
- `404 Not Found` - Użytkownik nie istnieje
- `500 Internal Server Error` - Błąd generowania QR

---

### 2. 📄 Generowanie PDF z wszystkimi QR kodami

#### GET `/api/qr/allusers`

**Opis:** Generuje PDF z QR kodami wszystkich użytkowników

**Response:** Plik PDF (binary data)

**JavaScript Example:**
```javascript
const downloadAllQrCodesPdf = async () => {
  const response = await fetch(`${BASE_URL}/api/qr/allusers`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Pobierz PDF
  const pdfBlob = await response.blob();
  
  // Automatyczne pobranie
  const url = window.URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'all_qr_codes.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

---

### 3. 🔑 Logowanie przez User ID

#### POST `/api/auth/login-by-user-id/{userId}`

**Opis:** Loguje użytkownika używając jego ID (z QR kodu)

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JavaScript Example:**
```javascript
const loginByUserId = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/auth/login-by-user-id/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Nieprawidłowy ID użytkownika');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const tokens = await response.json();
  
  // Zapisz tokeny w localStorage
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  return tokens;
};
```

**Status Codes:**
- `200 OK` - Logowanie udane
- `401 Unauthorized` - Nieprawidłowy user ID

---

### 4. 🔄 Odświeżanie Tokenu

#### POST `/api/refresh-token`

**Opis:** Odświeża access token używając refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JavaScript Example:**
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Brak refresh token');
  }
  
  const response = await fetch(`${BASE_URL}/api/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: refreshToken
    })
  });
  
  if (!response.ok) {
    // Refresh token wygasł - wymagane ponowne logowanie
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw new Error('Sesja wygasła - wymagane ponowne logowanie');
  }
  
  const tokens = await response.json();
  
  // Zaktualizuj tokeny
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  return tokens;
};
```

---

### 5. 👤 Pobieranie danych użytkownika

#### GET `/api/users/me`

**Opis:** Pobiera dane aktualnie zalogowanego użytkownika

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "Jan",
  "surname": "Kowalski",
  "position": "Student",
  "university": "Politechnika Warszawska",
  "department": "Informatyka",
  "email": "jan.kowalski@student.pw.edu.pl",
  "userID": "12345",
  "photoPath": "/photos/user1.jpg",
  "registrationStatus": "REGISTERED"
}
```

**JavaScript Example:**
```javascript
const getCurrentUser = async () => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('Brak tokenu dostępu');
  }
  
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token wygasł - spróbuj odświeżyć
      try {
        await refreshAccessToken();
        // Retry request
        return await getCurrentUser();
      } catch (error) {
        throw new Error('Sesja wygasła - wymagane ponowne logowanie');
      }
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

---

## 🎯 React Hook do Zarządzania Autoryzacją

```typescript
import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  firstName: string;
  surname: string;
  position?: string;
  university?: string;
  department?: string;
  email?: string;
  userID?: string;
  photoPath?: string;
  registrationStatus: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sprawdź czy użytkownik jest zalogowany przy inicjalizacji
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token nieprawidłowy - wyczyść storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };
    
    initAuth();
  }, []);

  const loginByUserId = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login-by-user-id/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Nieprawidłowy ID użytkownika');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tokens: AuthTokens = await response.json();
      
      // Zapisz tokeny
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      // Pobierz dane użytkownika
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      return tokens;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      throw new Error('Brak refresh token');
    }
    
    const response = await fetch(`${BASE_URL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: refreshTokenValue
      })
    });
    
    if (!response.ok) {
      logout();
      throw new Error('Sesja wygasła');
    }
    
    const tokens: AuthTokens = await response.json();
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    return tokens;
  }, [logout]);

  const getCurrentUser = useCallback(async (): Promise<User> => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('Brak tokenu dostępu');
    }
    
    const response = await fetch(`${BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token wygasł - spróbuj odświeżyć
        await refreshToken();
        // Retry request
        return await getCurrentUser();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }, [refreshToken]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    loginByUserId,
    logout,
    refreshToken,
    getCurrentUser
  };
};
```

---

## 📱 Komponent Logowania QR

```typescript
import React, { useState, useRef } from 'react';
import { useAuth } from './useAuth';

export const QrLoginComponent: React.FC = () => {
  const { loginByUserId, loading, error } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generuj QR kod dla użytkownika
  const generateQrCode = async (userId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/api/qr/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Błąd generowania QR kodu');
      }
      
      const qrBlob = await response.blob();
      const url = URL.createObjectURL(qrBlob);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Logowanie przez User ID
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Wprowadź ID użytkownika');
      return;
    }
    
    try {
      await loginByUserId(parseInt(userId));
      alert('Logowanie udane!');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Skanowanie QR kodu z pliku
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tutaj możesz użyć biblioteki do skanowania QR kodów
    // np. qr-scanner, jsQR, lub react-qr-reader
    console.log('File uploaded for QR scanning:', file.name);
    
    // Przykład z react-qr-reader:
    // const reader = new FileReader();
    // reader.onload = (event) => {
    //   const result = event.target?.result;
    //   // Przetwórz obraz i wyciągnij userId
    // };
    // reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Logowanie QR</h2>
      
      {/* Generowanie QR kodu */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Generuj QR kod</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="ID użytkownika"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => generateQrCode(parseInt(userId))}
            disabled={!userId || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Generuj QR
          </button>
        </div>
        
        {qrCodeUrl && (
          <div className="mt-3 text-center">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="mx-auto border border-gray-300 rounded"
            />
            <p className="text-sm text-gray-600 mt-2">
              Zeskanuj ten kod aby się zalogować
            </p>
          </div>
        )}
      </div>

      {/* Logowanie przez ID */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Logowanie przez ID</h3>
        <form onSubmit={handleLogin} className="flex gap-2">
          <input
            type="number"
            placeholder="Wprowadź ID użytkownika"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
      </div>

      {/* Skanowanie QR z pliku */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Skanuj QR z pliku</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          Wybierz zdjęcie QR
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};
```

---

## 🔧 HTTP Interceptor dla Automatycznego Odświeżania Tokenów

```typescript
// Interceptor dla axios lub fetch
class AuthInterceptor {
  private baseURL: string;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = localStorage.getItem('accessToken');
    
    // Dodaj token do nagłówków
    const headers = {
      ...options.headers,
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
    };

    let response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers
    });

    // Jeśli token wygasł, spróbuj odświeżyć
    if (response.status === 401 && accessToken) {
      try {
        const newToken = await this.refreshToken();
        
        // Retry request z nowym tokenem
        response = await fetch(`${this.baseURL}${url}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
      } catch (error) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw error;
      }
    }

    return response;
  }

  private async refreshToken(): Promise<string> {
    // Zapobiegaj wielokrotnym requestom refresh
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('Brak refresh token');
    }

    const response = await fetch(`${this.baseURL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Refresh token wygasł');
    }

    const tokens = await response.json();
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    return tokens.accessToken;
  }
}

// Użycie
const authInterceptor = new AuthInterceptor('http://localhost:8080');

// Wszystkie requesty przez interceptor
const apiCall = async () => {
  const response = await authInterceptor.makeRequest('/api/groups/all');
  return await response.json();
};
```

---

## ⚠️ Ważne Uwagi dla Frontendu

### 1. **Czas życia tokenów**
- **Access Token**: 30 minut
- **Refresh Token**: 4 dni
- **Clock Skew**: 30 sekund tolerancji

### 2. **Bezpieczeństwo**
- Zawsze używaj HTTPS w produkcji
- Nie przechowuj tokenów w sessionStorage (może być niebezpieczne)
- Używaj localStorage lub httpOnly cookies
- Implementuj automatyczne wylogowanie po wygaśnięciu refresh token

### 3. **Obsługa błędów**
- `401 Unauthorized` - Token wygasł lub nieprawidłowy
- `403 Forbidden` - Brak uprawnień
- `404 Not Found` - Użytkownik nie istnieje

### 4. **QR Code Scanning**
- Użyj bibliotek takich jak:
  - `react-qr-reader`
  - `qr-scanner`
  - `jsQR`
- Obsługuj różne formaty obrazów (PNG, JPG, WebP)

### 5. **Offline Support**
- Rozważ cache'owanie danych użytkownika
- Implementuj retry logic dla requestów
- Używaj service workers dla offline functionality

### 6. **Performance**
- Implementuj lazy loading dla komponentów
- Używaj debouncing dla search
- Cache'uj QR kody w localStorage

---

## 🎯 Przykłady Użycia

### Skanowanie QR kodu w aplikacji mobilnej
```typescript
import { QrScanner } from '@yudiel/react-qr-scanner';

const MobileQrScanner: React.FC = () => {
  const { loginByUserId } = useAuth();

  const handleScan = async (result: string) => {
    try {
      // QR kod zawiera userId
      const userId = parseInt(result);
      await loginByUserId(userId);
    } catch (error) {
      console.error('QR scan error:', error);
    }
  };

  return (
    <QrScanner
      onDecode={handleScan}
      onError={(error) => console.error('Scanner error:', error)}
    />
  );
};
```

### Automatyczne odświeżanie tokenów
```typescript
// Uruchom co 25 minut (5 minut przed wygaśnięciem)
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Auto refresh failed:', error);
    }
  }, 25 * 60 * 1000); // 25 minut

  return () => clearInterval(interval);
}, [refreshToken]);
```

---

*Dokumentacja wygenerowana dla Dziekan Backend - QR Login + JWT Authentication*
