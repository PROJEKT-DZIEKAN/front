# 🧪 Instrukcje testowania systemu chat

## Przygotowanie
1. Otwórz 2 okna/karty przeglądarki z aplikacją
2. W każdym oknie: F12 → Console

## Test 1: Logowanie
**Okno A (Admin):**
- Zaloguj jako User ID 1 lub 2
- Sprawdź console: `isAdmin: true`

**Okno B (User):**  
- Zaloguj jako User ID 3 lub 4
- Sprawdź console: `isAdmin: false`

## Test 2: Połączenie WebSocket
W obu oknach sprawdź:
```
✅ Connected to WebSocket successfully!
STOMP: <<< CONNECTED
```

## Test 3: Tworzenie chatu (User)
**W oknie User:**
1. Przejdź do zakładki "Chat"
2. Kliknij "Nowy Chat"
3. Sprawdź console:
```
🆘 handleStartSupport clicked!
🆘 Starting support chat...
👑 Found admin: {...}
✅ Chat started successfully
```

## Test 4: Panel Admin
**W oknie Admin:**
1. Przejdź do zakładki "Chat"  
2. Powinieneś zobaczyć:
   - "Panel Administratora"
   - "Wszystkie chaty (1)"
   - Nowy chat na liście

## Test 5: Komunikacja
**User → Admin:**
1. User pisze: "Cześć, potrzebuję pomocy!"
2. Admin powinien zobaczyć wiadomość natychmiast

**Admin → User:**
1. Admin odpowiada: "Cześć! Jak mogę pomóc?"
2. User powinien zobaczyć odpowiedź

## Oczekiwane rezultaty
✅ WebSocket łączy się
✅ User może utworzyć chat z adminem  
✅ Admin widzi wszystkie chaty
✅ Wiadomości są synchronizowane real-time
✅ Fallback na mock users jeśli API nie działa

## Troubleshooting
- Jeśli "Rozłączony" → sprawdź logi WebSocket
- Jeśli brak adminów → sprawdź `🔄 Using mock users`
- Jeśli przycisk nieaktywny → sprawdź `connected: false`