# 🏢 Kompletna Dokumentacja Grup - Frontend Integration

## 🌐 Informacje podstawowe

**Base URL:**
- **Development**: `http://localhost:8080`
- **Production**: `https://dziekan-48de5f4dea14.herokuapp.com`

**Autoryzacja:**
Wszystkie endpointy wymagają JWT tokenu:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📋 Model Danych - Grupa

### Struktura obiektu Group
```typescript
interface Group {
  id: number;                    // Auto-generated
  name: string;                  // Required, max 255 chars
  description?: string;          // Optional, max 2000 chars
  createdAt: string;            // ISO DateTime, auto-set to now()
  maxParticipants?: number;     // Optional, min 0
}
```

### Relacje (ukryte w JSON przez @JsonIgnore)
- **participants**: Set<User> - Uczestnicy grupy (Many-to-Many)
- **events**: Set<Event> - Wydarzenia powiązane z grupą (Many-to-Many)

---

## 🔧 API Endpointy

### 1. 📝 Tworzenie Grupy

#### POST `/api/groups/create`

**Request Body:**
```json
{
  "name": "Nazwa grupy",
  "description": "Opis grupy", 
  "maxParticipants": 30
}
```

**Response:** Obiekt Group z przypisanym ID

**JavaScript Example:**
```javascript
const createGroup = async (groupData) => {
  const response = await fetch(`${BASE_URL}/api/groups/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: groupData.name,
      description: groupData.description,
      maxParticipants: groupData.maxParticipants
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

**Status Codes:**
- `200 OK` - Grupa utworzona
- `500 Internal Server Error` - Błąd serwera

---

### 2. 📖 Pobieranie Grup

#### 2.1 Wszystkie grupy - GET `/api/groups/all`

**Response:** Lista wszystkich grup

```javascript
const getAllGroups = async () => {
  const response = await fetch(`${BASE_URL}/api/groups/all`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json(); // Array<Group>
};
```

#### 2.2 Grupa po ID - GET `/api/groups/{id}`

```javascript
const getGroupById = async (groupId) => {
  const response = await fetch(`${BASE_URL}/api/groups/${groupId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Grupa nie została znaleziona');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

#### 2.3 Wyszukiwanie grup po nazwie - GET `/api/groups/by-title?title={searchTerm}`

```javascript
const searchGroupsByTitle = async (searchTerm) => {
  const response = await fetch(`${BASE_URL}/api/groups/by-title?title=${encodeURIComponent(searchTerm)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json(); // Array<Group>
};
```

#### 2.4 Wyszukiwanie grup po opisie - GET `/api/groups/by-description?description={searchTerm}`

```javascript
const searchGroupsByDescription = async (searchTerm) => {
  const response = await fetch(`${BASE_URL}/api/groups/by-description?description=${encodeURIComponent(searchTerm)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json(); // Array<Group>
};
```

#### 2.5 Grupy z dostępnymi miejscami - GET `/api/groups/with-available-spots`

```javascript
const getGroupsWithAvailableSpots = async () => {
  const response = await fetch(`${BASE_URL}/api/groups/with-available-spots`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json(); // Array<Group>
};
```

#### 2.6 Grupy utworzone w określonym czasie - GET `/api/groups/created-at?dateTime={ISO_DATETIME}`

```javascript
const getGroupsCreatedAt = async (dateTime) => {
  // dateTime should be in ISO format: "2024-01-15T10:30:00"
  const response = await fetch(`${BASE_URL}/api/groups/created-at?dateTime=${encodeURIComponent(dateTime)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 404) {
    return []; // No groups found for this date
  }
  
  return await response.json(); // Array<Group>
};
```

---

### 3. ✏️ Aktualizacja Grupy

#### PUT `/api/groups/update/{id}`

**Request Body:** Kompletny obiekt Group z nowymi danymi

```javascript
const updateGroup = async (groupId, updatedGroupData) => {
  const response = await fetch(`${BASE_URL}/api/groups/update/${groupId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updatedGroupData)
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Grupa nie została znaleziona');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

**Status Codes:**
- `200 OK` - Grupa zaktualizowana
- `404 Not Found` - Grupa nie istnieje
- `500 Internal Server Error` - Błąd serwera

---

### 4. 🗑️ Usuwanie Grupy

#### DELETE `/api/groups/delete/{id}`

```javascript
const deleteGroup = async (groupId) => {
  const response = await fetch(`${BASE_URL}/api/groups/delete/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Grupa nie została znaleziona');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return true; // Success, no content returned
};
```

**Status Codes:**
- `204 No Content` - Grupa usunięta
- `404 Not Found` - Grupa nie istnieje
- `500 Internal Server Error` - Błąd serwera

---

### 5. 👥 Zarządzanie Uczestnikami

#### 5.1 Dodaj uczestnika - POST `/api/groups/add-participant/{groupId}/{userId}`

```javascript
const addParticipantToGroup = async (groupId, userId) => {
  const response = await fetch(`${BASE_URL}/api/groups/add-participant/${groupId}/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Grupa lub użytkownik nie został znaleziony');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return true; // Success
};
```

**Logika biznesowa:**
- ✅ Sprawdza czy użytkownik już jest w grupie (jeśli tak, nie robi nic)
- ✅ Sprawdza limit uczestników (`maxParticipants`)
- ❌ Jeśli grupa jest pełna, rzuca `IllegalStateException` (status 404 w kontrolerze)

#### 5.2 Usuń uczestnika - DELETE `/api/groups/remove-participant/{groupId}/{userId}`

```javascript
const removeParticipantFromGroup = async (groupId, userId) => {
  const response = await fetch(`${BASE_URL}/api/groups/remove-participant/${groupId}/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Grupa lub użytkownik nie został znaleziony');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return true; // Success
};
```

**Logika biznesowa:**
- ✅ Sprawdza czy użytkownik jest w grupie (jeśli nie, nie robi nic)
- ✅ Usuwa użytkownika z grupy

---

## 🔍 Przykłady Użycia w React

### Hook do zarządzania grupami
```typescript
import { useState, useEffect } from 'react';

interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  maxParticipants?: number;
}

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/groups/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(groupData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newGroup = await response.json();
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/groups/delete/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchGroups = async (searchTerm: string, searchType: 'title' | 'description' = 'title') => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = searchType === 'title' ? 'by-title' : 'by-description';
      const param = searchType === 'title' ? 'title' : 'description';
      
      const response = await fetch(`${BASE_URL}/api/groups/${endpoint}?${param}=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    groups,
    loading,
    error,
    fetchAllGroups,
    createGroup,
    deleteGroup,
    searchGroups
  };
};
```

### Komponent do tworzenia grupy
```typescript
import React, { useState } from 'react';
import { useGroups } from './useGroups';

export const CreateGroupForm: React.FC = () => {
  const { createGroup, loading, error } = useGroups();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createGroup({
        name: formData.name,
        description: formData.description || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        maxParticipants: ''
      });
      
      alert('Grupa została utworzona!');
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nazwa grupy *
        </label>
        <input
          type="text"
          id="name"
          required
          maxLength={255}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Opis
        </label>
        <textarea
          id="description"
          maxLength={2000}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
          Maksymalna liczba uczestników
        </label>
        <input
          type="number"
          id="maxParticipants"
          min="0"
          value={formData.maxParticipants}
          onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Tworzenie...' : 'Utwórz grupę'}
      </button>
    </form>
  );
};
```

---

## ⚠️ Ważne Uwagi dla Frontendu

### 1. **Obsługa błędów**
- Wszystkie endpointy mogą zwrócić `500 Internal Server Error`
- Endpointy `GET /{id}`, `PUT /{id}`, `DELETE /{id}` mogą zwrócić `404 Not Found`
- Zawsze sprawdzaj `response.ok` przed parsowaniem JSON

### 2. **Walidacja danych**
- `name`: Required, max 255 znaków
- `description`: Optional, max 2000 znaków
- `maxParticipants`: Optional, min 0
- `createdAt`: Auto-generowane, nie wysyłaj w POST

### 3. **Format dat**
- Wszystkie daty w formacie ISO 8601: `"2024-01-15T10:30:00"`
- `createdAt` jest automatycznie ustawiane na `LocalDateTime.now()`

### 4. **Relacje**
- `participants` i `events` są ukryte w JSON (`@JsonIgnore`)
- Zarządzanie uczestnikami tylko przez dedykowane endpointy
- Nie próbuj wysyłać tych pól w JSON

### 5. **Autoryzacja**
- JWT token jest wymagany dla wszystkich operacji
- Token powinien być w nagłówku `Authorization: Bearer {token}`

### 6. **Paginacja**
- Obecnie brak paginacji w API
- Wszystkie listy są zwracane w całości
- Rozważ implementację filtrowania po stronie frontendu dla dużych list

### 7. **Wyszukiwanie**
- Wyszukiwanie jest case-insensitive
- Używa `LIKE %searchTerm%` w bazie danych
- Można wyszukiwać zarówno po nazwie jak i opisie

---

## 🎯 Rekomendacje dla UX

### 1. **Loading States**
```typescript
// Zawsze pokazuj loading podczas operacji
{loading && <div>Ładowanie...</div>}
```

### 2. **Error Handling**
```typescript
// Przyjazne komunikaty błędów
const getErrorMessage = (status: number) => {
  switch (status) {
    case 404: return 'Grupa nie została znaleziona';
    case 500: return 'Wystąpił błąd serwera. Spróbuj ponownie.';
    default: return 'Wystąpił nieoczekiwany błąd';
  }
};
```

### 3. **Optymistic Updates**
```typescript
// Dla lepszego UX, aktualizuj UI od razu, a potem wywołaj API
const handleDeleteGroup = async (groupId: number) => {
  // Optimistic update
  setGroups(prev => prev.filter(g => g.id !== groupId));
  
  try {
    await deleteGroup(groupId);
  } catch (error) {
    // Rollback on error
    fetchAllGroups();
    showError('Nie udało się usunąć grupy');
  }
};
```

### 4. **Debounced Search**
```typescript
// Dla wyszukiwania na żywo
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (searchTerm: string) => {
    if (searchTerm.length > 2) {
      searchGroups(searchTerm);
    }
  },
  500
);
```

---

*Dokumentacja wygenerowana dla Dziekan Backend - Groups API*
