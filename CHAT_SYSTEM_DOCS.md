# System Chatów - College App

System chatów inspirowany kodem Java/Spring Boot, zaimplementowany w React/Next.js z TypeScript.

## 🏗️ Architektura

### Komponenty
- **`useAuth`** - Hook do autoryzacji (wrapper dla UserContext)
- **`useChat`** - Hook do obsługi chatów z mock WebSocket
- **`ChatWithOrganizers`** - Komponent dla użytkowników
- **`AdminChatPanel`** - Panel dla administratorów
- **`ChatApp`** - Główny komponent wybierający widok na podstawie roli
- **`ChatDemo`** - Demo z możliwością testowania różnych użytkowników

### Zasady działania
1. **Admin ↔ User** - dozwolone
2. **Admin ↔ Admin** - niedozwolone
3. **User ↔ User** - niedozwolone

## 🚀 Użycie

### Podstawowe komponenty
```tsx
import ChatApp from '@/components/ChatApp';
import ChatDemo from '@/components/ChatDemo';

// Podstawowy chat
<ChatApp />

// Demo z wyborem użytkownika
<ChatDemo />
```

### Hooks
```tsx
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

function MyComponent() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { 
    connected, 
    messages, 
    chats, 
    sendMessage, 
    startSupportChat 
  } = useChat();
}
```

## 🎯 Funkcjonalności

### Dla Użytkowników
- ✅ Tworzenie chatu z supportem
- ✅ Wysyłanie wiadomości do adminów
- ✅ Odbieranie odpowiedzi (mock)
- ✅ Historia konwersacji
- ✅ Kontrola dostępu

### Dla Administratorów
- ✅ Widok wszystkich chatów
- ✅ Odpowiadanie użytkownikom
- ✅ Szczegóły uczestników
- ✅ Monitoring aktywności

## 🔧 Konfiguracja

### Mock WebSocket
System używa mock implementacji WebSocket. Dla prawdziwego backendu:

```typescript
// W useChat.ts zamień mock na rzeczywiste WebSocket:
const stompClient = new Client({
  webSocketFactory: () => new SockJS('ws://localhost:8080/ws-chat'),
  // ... konfiguracja STOMP
});
```

### Backend API Endpoints
Przygotowane dla integracji z Spring Boot:
- `GET /api/chats?userId={id}` - lista chatów
- `POST /api/chats/get-or-create` - tworzenie chatu
- `GET /api/users` - lista użytkowników (admin)
- WebSocket `/ws-chat` - komunikacja real-time

## 🎨 Style
System używa Tailwind CSS z gotowymi komponentami:
- Responsywny design
- Dark/light mode ready
- Animacje i przejścia
- Heroicons dla ikon

## 🧪 Testowanie

### Quick Start
1. Użyj `ChatDemo` komponentu
2. Wybierz użytkownika (admin lub user)
3. Testuj funkcjonalności

### Mock Data
- 4 przykładowych użytkowników
- 2 przykładowe chaty
- Automatyczne odpowiedzi adminów
- Symulacja opóźnień sieciowych

## 🔄 Integracja z istniejącym kodem

### UserContext
System rozszerza istniejący `UserContext` o:
- Token management
- Role compatibility
- Auth hooks

### Kompatybilność
- ✅ Zachowuje istniejące API
- ✅ Dodaje nowe funkcjonalności
- ✅ Nie łamie istniejącego kodu

## 📝 TODO dla produkcji
- [ ] Integracja z prawdziwym WebSocket
- [ ] Obsługa błędów sieciowych
- [ ] Notyfikacje push
- [ ] Przechowywanie offline
- [ ] Moderacja treści
- [ ] Rate limiting