# Integracja Rozpoznawania Twarzy

## Przegląd
System rozpoznawania twarzy został zintegrowany z aplikacją React Next.js. Backend Python FastAPI hostowany jest na Railway pod adresem `https://duck-duck-production.up.railway.app`.

## Dostępne Komponenty

### 1. PersonRecognition.tsx
Główny komponent UI do rozpoznawania twarzy ze śdzeniami:

**Funkcjonalności:**
- 📷 Dostęp do kamery urządzenia
- 📁 Upload plików obrazów
- 🔍 Rozpoznawanie twarzy w czasie rzeczywistym
- 📊 Wyświetlanie wyników z pewnością i czasem przetwarzania
- ⚡ Obsługa błędów i stanów ładowania
- 🎯 Integracja z backendem Python

**Lokalizacja:** `src/components/PersonRecognition.tsx`

### 2. useFaceRecognition Hook
Hook React do zarządzania API rozpoznawania twarzy:

**Funkcjonalności:**
- `recognizeFace(file)` - główna funkcja rozpoznawania
- `checkHealth()` - sprawdzenie statusu API
- `reloadDatabase()` - przeładowanie bazy twarzy
- `clearResults()` - czyszczenie wyników
- `isApiAvailable()` - sprawdzenie dostępności API

**Lokalizacja:** `src/hooks/useFaceRecognition.ts`

## API Endpoints

### Backend Python (FastAPI)
**Base URL:** `https://duck-duck-production.up.railway.app`

#### 1. Health Check
```
GET /health
```
Sprawdza status API i bazy danych.

**Odpowiedź:**
```json
{
  "status": "healthy",
  "database_loaded": true,
  "database_size": 5,
  "device": "cpu",
  "timestamp": "2025-01-XX"
}
```

#### 2. Rozpoznawanie z Kamery (Zalecane)
```
POST /camera/
Content-Type: multipart/form-data
Body: file=<image_file>
```

**Odpowiedź:**
```json
{
  "success": true,
  "identity": "Jan_Kowalski",
  "confidence": 85.2,
  "distance": 0.148,
  "processing_time_seconds": 1.234,
  "status": "recognized",
  "message": "Rozpoznano: Jan Kowalski",
  "person": {
    "full_name": "Jan Kowalski",
    "first_name": "Jan",
    "last_name": "Kowalski"
  }
}
```

#### 3. Proste Rozpoznawanie
```
POST /recognize/
Content-Type: multipart/form-data
Body: file=<image_file>
```

#### 4. Przeładowanie Bazy
```
POST /database/reload
```

## Statusy Rozpoznawania

| Status | Opis | Ikona |
|--------|------|-------|
| `recognized` | Osoba rozpoznana | ✅ Zielona |
| `unknown` | Twarz wykryta, ale nierozpoznana | ⚠️ Żółta |
| `no_face` | Nie wykryto twarzy | ❌ Czerwona |
| `error` | Błąd przetwarzania | ❌ Czerwona |

## Jak Używać

### 1. Podstawowe Użycie w Komponencie
```tsx
import PersonRecognition from '@/components/PersonRecognition';

function MyApp() {
  return (
    <div>
      <PersonRecognition />
    </div>
  );
}
```

### 2. Użycie Hook'a
```tsx
import { useFaceRecognition } from '@/hooks/useFaceRecognition';

function MyComponent() {
  const { 
    recognizeFace, 
    isLoading, 
    result, 
    error, 
    checkHealth 
  } = useFaceRecognition();

  const handleFileUpload = async (file: File) => {
    const recognition = await recognizeFace(file);
    if (recognition?.success) {
      console.log('Rozpoznano:', recognition.identity);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        accept="image/*"
      />
      {isLoading && <p>Rozpoznaję...</p>}
      {result && <p>Wynik: {result.message}</p>}
      {error && <p>Błąd: {error}</p>}
    </div>
  );
}
```

### 3. Sprawdzenie Statusu API
```tsx
const { checkHealth, isApiAvailable } = useFaceRecognition();

// Sprawdź szczegółowy status
const health = await checkHealth();
console.log('Baza załadowana:', health?.database_loaded);
console.log('Rozmiar bazy:', health?.database_size);

// Szybkie sprawdzenie dostępności
const available = await isApiAvailable();
console.log('API dostępne:', available);
```

## Obsługa Błędów

### Typowe Błędy:
1. **"Serwer rozpoznawania twarzy jest niedostępny"** - Problem z połączeniem
2. **"Baza danych twarzy nie jest załadowana"** - Baza nie została załadowana na serwerze
3. **"Nie można uzyskać dostępu do kamery"** - Brak uprawnień do kamery
4. **"Można przesłać tylko pliki obrazów"** - Nieprawidłowy format pliku

### Obsługa w Kodzie:
```tsx
const { recognizeFace, error } = useFaceRecognition();

try {
  const result = await recognizeFace(file);
  if (!result) {
    // Sprawdź error state
    console.error('Błąd:', error);
  }
} catch (err) {
  console.error('Nieoczekiwany błąd:', err);
}
```

## Konfiguracja

### Zmiana URL API
W `src/hooks/useFaceRecognition.ts` lub `src/components/PersonRecognition.tsx`:
```tsx
const API_BASE_URL = 'https://your-api-url.com';
```

### Dostosowanie UI
Komponent używa Tailwind CSS - można łatwo dostosować style w `PersonRecognition.tsx`.

## Wymagania

### Frontend:
- React 19+
- Next.js 15+
- TypeScript
- Tailwind CSS
- @heroicons/react

### Uprawnienia Przeglądarki:
- Dostęp do kamery (dla funkcji robienia zdjęć)
- Dostęp do plików (dla uploadu)

### Kompatybilność:
- ✅ Chrome/Edge (zalecane)
- ✅ Firefox  
- ✅ Safari
- ⚠️ Starsze przeglądarki mogą mieć problemy z kamerą

## Testowanie

### 1. Test Połączenia
```bash
curl "https://duck-duck-production.up.railway.app/health"
```

### 2. Test Rozpoznawania
```bash
curl -X POST "https://duck-duck-production.up.railway.app/camera/" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/image.jpg"
```

## Rozwiązywanie Problemów

### Kamera nie działa:
1. Sprawdź uprawnienia przeglądarki
2. Upewnij się, że strona jest serwowana przez HTTPS
3. Sprawdź czy żadna inna aplikacja nie używa kamery

### API nie odpowiada:
1. Sprawdź połączenie internetowe
2. Sprawdź status serwera Railway
3. Sprawdź logi przeglądarki dla błędów CORS

### Rozpoznawanie nie działa:
1. Sprawdź czy baza danych jest załadowana (`/health`)
2. Sprawdź jakość zdjęcia (wyraźna twarz, dobre oświetlenie)
3. Sprawdź format pliku (JPG, PNG obsługiwane)

## Przyszłe Rozszerzenia

Możliwe ulepszenia:
- 🔄 Cache wyników rozpoznawania
- 📱 Optymalizacja mobile
- 🎯 Batch processing wielu twarzy
- 📊 Statystyki użycia
- 🔐 Autoryzacja API
- 🖼️ Podgląd na żywo z kamery
- 📋 Historia rozpoznawania
