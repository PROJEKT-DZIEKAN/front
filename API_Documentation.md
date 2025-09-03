# 📚 Dokumentacja API - Dziekan Backend

## 🌐 Informacje podstawowe

**URL bazowy:**
- **Lokalne środowisko**: `http://localhost:8080`
- **Produkcja**: `https://dziekan-48de5f4dea14.herokuapp.com`

**Autoryzacja:**
Większość endpointów wymaga JWT tokenu w nagłówku:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🏢 Zarządzanie Grupami

### Tworzenie Grup

#### POST `/api/groups/create`

**Request Body:**
```json
{
  "name": "Nazwa grupy",
  "description": "Opis grupy",
  "maxParticipants": 50,
  "createdAt": "2024-01-15T10:30:00"
}
```

**Przykład zapytania:**
```bash
curl -X POST http://localhost:8080/api/groups/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Grupa Projektowa AI",
    "description": "Grupa zajmująca się projektami sztucznej inteligencji",
    "maxParticipants": 30,
    "createdAt": "2024-01-15T10:30:00"
  }'
```

**Response:** Obiekt `Group` z przypisanym ID

---

### Pobieranie Grup

#### 1. Wszystkie grupy
```bash
GET /api/groups/all
```

**Przykład:**
```bash
curl -X GET http://localhost:8080/api/groups/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Grupa po ID
```bash
GET /api/groups/{id}
```

**Przykład:**
```bash
curl -X GET http://localhost:8080/api/groups/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Wyszukiwanie grup po nazwie
```bash
GET /api/groups/by-title?title={searchTerm}
```

**Przykład:**
```bash
curl -X GET "http://localhost:8080/api/groups/by-title?title=AI" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Wyszukiwanie grup po opisie
```bash
GET /api/groups/by-description?description={searchTerm}
```

**Przykład:**
```bash
curl -X GET "http://localhost:8080/api/groups/by-description?description=projekt" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Grupy z dostępnymi miejscami
```bash
GET /api/groups/with-available-spots
```

#### 6. Grupy utworzone w określonym czasie
```bash
GET /api/groups/created-at?dateTime={ISO_DATETIME}
```

**Przykład:**
```bash
curl -X GET "http://localhost:8080/api/groups/created-at?dateTime=2024-01-15T10:30:00" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Zarządzanie uczestnikami grup

#### Dodaj użytkownika do grupy
```bash
POST /api/groups/add-participant/{groupId}/{userId}
```

**Przykład:**
```bash
curl -X POST http://localhost:8080/api/groups/add-participant/1/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Usuń użytkownika z grupy
```bash
DELETE /api/groups/remove-participant/{groupId}/{userId}
```

**Przykład:**
```bash
curl -X DELETE http://localhost:8080/api/groups/remove-participant/1/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Aktualizacja i usuwanie grup

#### Aktualizuj grupę
```bash
PUT /api/groups/update/{id}
```

**Request Body:** Obiekt `Group` z nowymi danymi

#### Usuń grupę
```bash
DELETE /api/groups/delete/{id}
```

---

## 🎯 Zarządzanie Wydarzeniami

### Tworzenie Wydarzeń

#### POST `/api/events/create`

**Request Body:**
```json
{
  "title": "Nazwa wydarzenia",
  "description": "Opis wydarzenia",
  "startTime": "2024-02-15T18:00:00",
  "endTime": "2024-02-15T20:00:00",
  "location": "Sala 101",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "maxParticipants": 100
}
```

**Przykład zapytania:**
```bash
curl -X POST http://localhost:8080/api/events/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Konferencja AI 2024",
    "description": "Coroczna konferencja o sztucznej inteligencji",
    "startTime": "2024-02-15T18:00:00",
    "endTime": "2024-02-15T20:00:00",
    "location": "Aula Główna",
    "latitude": 52.2297,
    "longitude": 21.0122,
    "maxParticipants": 150
  }'
```

**Response:** Obiekt `Event` z przypisanym ID (Status: 201 Created)

---

### Pobieranie Wydarzeń

#### 1. Wszystkie wydarzenia
```bash
GET /api/events/all
```

**Przykład:**
```bash
curl -X GET http://localhost:8080/api/events/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:** Lista wszystkich wydarzeń

---

### Aktualizacja i usuwanie wydarzeń

#### Aktualizuj wydarzenie
```bash
PUT /api/events/update/{eventId}
```

**Request Body:** Obiekt `Event` z nowymi danymi

#### Usuń wydarzenie
```bash
DELETE /api/events/delete/{eventId}
```

---

## 📝 Rejestracja na Wydarzenia

### Rejestracja pojedynczego użytkownika
```bash
POST /api/events/{eventId}/register/{userId}
```

**Przykład:**
```bash
curl -X POST http://localhost:8080/api/events/1/register/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Rejestracja wielu użytkowników
```bash
POST /api/events/{eventId}/register-multiple
```

**Request Body:**
```json
{
  "userIds": [123, 456, 789]
}
```

### Rejestracja całej grupy
```bash
POST /api/events/{eventId}/register-group/{groupId}
```

**Przykład:**
```bash
curl -X POST http://localhost:8080/api/events/1/register-group/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Anulowanie rejestracji
```bash
DELETE /api/events/{eventId}/unregister/{userId}
```

### Anulowanie wielu rejestracji
```bash
POST /api/events/{eventId}/unregister-multiple
```

**Request Body:**
```json
{
  "userIds": [123, 456, 789]
}
```

---

## 📊 Informacje o Wydarzeniach

### Sprawdź czy użytkownik jest zarejestrowany
```bash
GET /api/events/{eventId}/is-registered/{userId}
```

**Response:** `true` lub `false`

### Pobierz liczbę uczestników
```bash
GET /api/events/{eventId}/participants-count
```

**Response:** Liczba zarejestrowanych uczestników

### Pobierz dostępne miejsca
```bash
GET /api/events/{eventId}/available-spots
```

**Response:** Liczba dostępnych miejsc

### Pobierz wszystkie rejestracje na wydarzenie
```bash
GET /api/events/{eventId}/registrations
```

**Response:** Lista obiektów `EventRegistrationDTO`

### Pobierz zarejestrowanych użytkowników
```bash
GET /api/events/{eventId}/registered-users
```

**Response:** Lista zarejestrowanych użytkowników

---

## 📋 Struktury Danych

### Obiekt Group
```json
{
  "id": 1,
  "name": "Nazwa grupy",
  "description": "Opis grupy",
  "createdAt": "2024-01-15T10:30:00",
  "maxParticipants": 50
}
```

### Obiekt Event
```json
{
  "id": 1,
  "title": "Nazwa wydarzenia",
  "description": "Opis wydarzenia",
  "startTime": "2024-02-15T18:00:00",
  "endTime": "2024-02-15T20:00:00",
  "location": "Sala 101",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "qrcodeUrl": "https://example.com/qr/123",
  "maxParticipants": 100
}
```

### Obiekt EventRegistrationDTO
```json
{
  "id": 1,
  "eventId": 1,
  "userId": 123,
  "registrationTime": "2024-01-15T10:30:00",
  "status": "CONFIRMED"
}
```

---

## ⚠️ Kody Błędów

- **200 OK** - Operacja zakończona sukcesem
- **201 Created** - Zasób został utworzony
- **204 No Content** - Operacja zakończona sukcesem (brak treści)
- **400 Bad Request** - Nieprawidłowe dane wejściowe
- **404 Not Found** - Zasób nie został znaleziony
- **500 Internal Server Error** - Błąd serwera

---

## 🔧 Przykłady użycia w JavaScript

### Tworzenie grupy
```javascript
const createGroup = async (groupData) => {
  const response = await fetch('http://localhost:8080/api/groups/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(groupData)
  });
  
  return await response.json();
};
```

### Pobieranie wszystkich wydarzeń
```javascript
const getAllEvents = async () => {
  const response = await fetch('http://localhost:8080/api/events/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Rejestracja na wydarzenie
```javascript
const registerForEvent = async (eventId, userId) => {
  const response = await fetch(`http://localhost:8080/api/events/${eventId}/register/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

---

## 📝 Notatki

1. **Format daty**: Wszystkie daty używają formatu ISO 8601: `YYYY-MM-DDTHH:mm:ss`
2. **Autoryzacja**: JWT token jest wymagany dla większości operacji
3. **Content-Type**: Dla requestów POST/PUT używaj `application/json`
4. **CORS**: Backend obsługuje określone domeny frontendowe (sprawdź `application.properties`)
5. **Swagger**: Dokumentacja dostępna pod `/swagger-ui.html`

---

*Dokumentacja wygenerowana dla Dziekan Backend API*
