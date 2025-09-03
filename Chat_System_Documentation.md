# 💬 Dokumentacja Systemu Chatów - Frontend Integration

## 🌐 Informacje podstawowe

**Base URL:**
- **Development**: `http://localhost:8080`
- **Production**: `https://dziekan-48de5f4dea14.herokuapp.com`

**WebSocket Endpoint:**
- **Chat WebSocket**: `ws://localhost:8080/ws-chat?token={JWT_TOKEN}`
- **SockJS Fallback**: `http://localhost:8080/ws-chat`

**Autoryzacja:**
- **REST API**: JWT token w nagłówku `Authorization: Bearer {token}`
- **WebSocket**: JWT token w query parameter `?token={JWT_TOKEN}`

---

## 🔄 Przepływ Systemu Chatów

### 1. **Autoryzacja WebSocket**
Użytkownik łączy się z WebSocket używając JWT tokenu

### 2. **Pobieranie listy chatów**
Frontend pobiera wszystkie chaty użytkownika

### 3. **Tworzenie/otwieranie chatu**
System automatycznie tworzy chat między dwoma użytkownikami

### 4. **Wysyłanie wiadomości**
Wiadomości wysyłane przez WebSocket w czasie rzeczywistym

### 5. **Odbieranie wiadomości**
Wiadomości dostarczane do obu uczestników chatu

### 6. **Historia wiadomości**
Pobieranie historii wiadomości dla konkretnego chatu

---

## 📱 REST API Endpointy

### 1. 📋 Lista Chatów Użytkownika

#### GET `/api/chats?userId={userId}`

**Opis:** Pobiera wszystkie chaty, w których uczestniczy użytkownik

**Query Parameters:**
- `userId` (required) - ID użytkownika

**Response:**
```json
[
  {
    "id": 1,
    "userAId": 123,
    "userBId": 456
  },
  {
    "id": 2,
    "userAId": 123,
    "userBId": 789
  }
]
```

**JavaScript Example:**
```javascript
const getUserChats = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/chats?userId=${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

**Status Codes:**
- `200 OK` - Lista chatów
- `400 Bad Request` - Brak lub nieprawidłowy userId

---

### 2. 🔧 Tworzenie/Otwieranie Chatu

#### POST `/api/chats/get-or-create`

**Opis:** Tworzy nowy chat lub zwraca istniejący między dwoma użytkownikami

**Request Body:**
```json
{
  "userAId": 123,
  "userBId": 456
}
```

**Response:**
```json
{
  "id": 1,
  "userAId": 123,
  "userBId": 456
}
```

**JavaScript Example:**
```javascript
const getOrCreateChat = async (userAId, userBId) => {
  const response = await fetch(`${BASE_URL}/api/chats/get-or-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userAId: userAId,
      userBId: userBId
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

**Logika biznesowa:**
- ✅ Sprawdza czy chat już istnieje (w obu kierunkach A-B i B-A)
- ✅ Tworzy nowy chat jeśli nie istnieje
- ✅ Zwraca istniejący chat jeśli już istnieje
- ❌ Rzuca błąd jeśli któryś z użytkowników nie istnieje

**Status Codes:**
- `200 OK` - Chat utworzony/znaleziony
- `400 Bad Request` - Nieprawidłowe dane lub użytkownik nie istnieje

---

## 🔌 WebSocket API

### 1. 🔗 Połączenie WebSocket

**Endpoint:** `ws://localhost:8080/ws-chat?token={JWT_TOKEN}`

**JavaScript Example:**
```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class ChatWebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
  }

  connect(token, onConnect, onError) {
    const socket = new SockJS(`${BASE_URL}/ws-chat?token=${token}`);
    this.stompClient = new Stomp.Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.isConnected = true;
      onConnect && onConnect(frame);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.isConnected = false;
      onError && onError(frame);
    };

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient && this.isConnected) {
      this.stompClient.deactivate();
      this.isConnected = false;
    }
  }

  sendMessage(chatId, senderId, content) {
    if (this.stompClient && this.isConnected) {
      const message = {
        chatId: chatId,
        senderId: senderId,
        content: content
      };
      
      this.stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(message)
      });
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  requestHistory(chatId) {
    if (this.stompClient && this.isConnected) {
      const chatRequest = {
        id: chatId
      };
      
      this.stompClient.publish({
        destination: '/app/chat.history',
        body: JSON.stringify(chatRequest)
      });
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  subscribeToMessages(callback) {
    if (this.stompClient && this.isConnected) {
      return this.stompClient.subscribe('/user/queue/messages', (message) => {
        const messageData = JSON.parse(message.body);
        callback(messageData);
      });
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  subscribeToHistory(callback) {
    if (this.stompClient && this.isConnected) {
      return this.stompClient.subscribe('/user/queue/history', (message) => {
        const historyData = JSON.parse(message.body);
        callback(historyData);
      });
    } else {
      throw new Error('WebSocket not connected');
    }
  }
}

export default new ChatWebSocketService();
```

---

### 2. 📤 Wysyłanie Wiadomości

#### Destination: `/app/chat.send`

**Payload:**
```json
{
  "chatId": 1,
  "senderId": 123,
  "content": "Treść wiadomości"
}
```

**Response:** Wiadomość zostanie dostarczona do obu uczestników chatu na `/user/queue/messages`

---

### 3. 📥 Odbieranie Wiadomości

#### Destination: `/user/queue/messages`

**Payload:**
```json
{
  "chatId": 1,
  "senderId": 123,
  "content": "Treść wiadomości",
  "sentAt": "2024-01-15T10:30:00Z"
}
```

---

### 4. 📜 Historia Wiadomości

#### Request: `/app/chat.history`
#### Response: `/user/queue/history`

**Request Payload:**
```json
{
  "id": 1
}
```

**Response Payload:**
```json
[
  {
    "chatId": 1,
    "senderId": 123,
    "content": "Pierwsza wiadomość",
    "sentAt": "2024-01-15T10:25:00Z"
  },
  {
    "chatId": 1,
    "senderId": 456,
    "content": "Druga wiadomość",
    "sentAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 🎯 React Hook do Zarządzania Chatami

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import ChatWebSocketService from './ChatWebSocketService';

interface Chat {
  id: number;
  userAId: number;
  userBId: number;
}

interface Message {
  chatId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

interface User {
  id: number;
  firstName: string;
  surname: string;
}

export const useChat = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Map<number, User>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messageSubscriptions = useRef<Map<number, any>>(new Map());
  const historySubscriptions = useRef<Map<number, any>>(new Map());

  // Połączenie z WebSocket
  const connectWebSocket = useCallback((token: string) => {
    ChatWebSocketService.connect(
      token,
      () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      },
      (error) => {
        setIsConnected(false);
        setError('Błąd połączenia WebSocket');
        console.error('WebSocket error:', error);
      }
    );
  }, []);

  // Rozłączenie WebSocket
  const disconnectWebSocket = useCallback(() => {
    ChatWebSocketService.disconnect();
    setIsConnected(false);
    messageSubscriptions.current.clear();
    historySubscriptions.current.clear();
  }, []);

  // Pobieranie chatów użytkownika
  const fetchUserChats = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/chats?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const chatsData = await response.json();
      setChats(chatsData);
      
      // Pobierz dane użytkowników dla wszystkich chatów
      const userIds = new Set<number>();
      chatsData.forEach((chat: Chat) => {
        userIds.add(chat.userAId);
        userIds.add(chat.userBId);
      });
      
      await fetchUsersData(Array.from(userIds));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania chatów');
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobieranie danych użytkowników
  const fetchUsersData = useCallback(async (userIds: number[]) => {
    try {
      const userPromises = userIds.map(async (userId) => {
        const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          return { id: userId, data: userData };
        }
        return null;
      });
      
      const userResults = await Promise.all(userPromises);
      const newUsers = new Map(users);
      
      userResults.forEach((result) => {
        if (result) {
          newUsers.set(result.id, result.data);
        }
      });
      
      setUsers(newUsers);
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  }, [users]);

  // Tworzenie/otwieranie chatu
  const openChat = useCallback(async (userAId: number, userBId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/chats/get-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          userAId: userAId,
          userBId: userBId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const chatData = await response.json();
      setCurrentChat(chatData);
      
      // Dodaj chat do listy jeśli nie istnieje
      setChats(prev => {
        const exists = prev.some(chat => chat.id === chatData.id);
        return exists ? prev : [...prev, chatData];
      });
      
      // Pobierz historię wiadomości
      loadChatHistory(chatData.id);
      
      return chatData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd otwierania chatu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Wysyłanie wiadomości
  const sendMessage = useCallback((content: string) => {
    if (!currentChat || !isConnected) {
      throw new Error('Brak aktywnego chatu lub połączenia WebSocket');
    }
    
    const currentUserId = parseInt(localStorage.getItem('userId') || '0');
    
    try {
      ChatWebSocketService.sendMessage(currentChat.id, currentUserId, content);
    } catch (error) {
      setError('Błąd wysyłania wiadomości');
      throw error;
    }
  }, [currentChat, isConnected]);

  // Ładowanie historii wiadomości
  const loadChatHistory = useCallback((chatId: number) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, cannot load history');
      return;
    }
    
    try {
      ChatWebSocketService.requestHistory(chatId);
    } catch (error) {
      console.error('Error requesting chat history:', error);
    }
  }, [isConnected]);

  // Subskrypcja na wiadomości
  const subscribeToMessages = useCallback(() => {
    if (!isConnected) return;
    
    const subscription = ChatWebSocketService.subscribeToMessages((message: Message) => {
      setMessages(prev => {
        // Sprawdź czy wiadomość już istnieje (zapobieganie duplikatom)
        const exists = prev.some(msg => 
          msg.chatId === message.chatId && 
          msg.senderId === message.senderId && 
          msg.content === message.content &&
          msg.sentAt === message.sentAt
        );
        
        if (exists) return prev;
        
        // Dodaj nową wiadomość i posortuj po czasie
        const newMessages = [...prev, message];
        return newMessages.sort((a, b) => 
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });
    });
    
    return subscription;
  }, [isConnected]);

  // Subskrypcja na historię
  const subscribeToHistory = useCallback(() => {
    if (!isConnected) return;
    
    const subscription = ChatWebSocketService.subscribeToHistory((history: Message[]) => {
      setMessages(history);
    });
    
    return subscription;
  }, [isConnected]);

  // Czyszczenie subskrypcji
  const cleanup = useCallback(() => {
    messageSubscriptions.current.forEach(sub => sub.unsubscribe());
    historySubscriptions.current.forEach(sub => sub.unsubscribe());
    messageSubscriptions.current.clear();
    historySubscriptions.current.clear();
  }, []);

  // Effect dla zarządzania subskrypcjami
  useEffect(() => {
    if (isConnected) {
      const messageSub = subscribeToMessages();
      const historySub = subscribeToHistory();
      
      if (messageSub) messageSubscriptions.current.set('messages', messageSub);
      if (historySub) historySubscriptions.current.set('history', historySub);
    }
    
    return cleanup;
  }, [isConnected, subscribeToMessages, subscribeToHistory, cleanup]);

  // Pobieranie nazwy użytkownika
  const getUserName = useCallback((userId: number) => {
    const user = users.get(userId);
    return user ? `${user.firstName} ${user.surname}` : `User ${userId}`;
  }, [users]);

  // Sprawdzanie czy wiadomość jest od aktualnego użytkownika
  const isOwnMessage = useCallback((senderId: number) => {
    const currentUserId = parseInt(localStorage.getItem('userId') || '0');
    return senderId === currentUserId;
  }, []);

  return {
    // State
    chats,
    currentChat,
    messages,
    users,
    loading,
    error,
    isConnected,
    
    // Actions
    connectWebSocket,
    disconnectWebSocket,
    fetchUserChats,
    openChat,
    sendMessage,
    loadChatHistory,
    
    // Utilities
    getUserName,
    isOwnMessage
  };
};
```

---

## 🎨 React Komponenty

### 1. Komponent Listy Chatów

```typescript
import React, { useEffect } from 'react';
import { useChat } from './useChat';

interface ChatListProps {
  currentUserId: number;
}

export const ChatList: React.FC<ChatListProps> = ({ currentUserId }) => {
  const { 
    chats, 
    currentChat, 
    loading, 
    error, 
    fetchUserChats, 
    openChat, 
    getUserName 
  } = useChat();

  useEffect(() => {
    fetchUserChats(currentUserId);
  }, [currentUserId, fetchUserChats]);

  const handleChatClick = (chat: Chat) => {
    setCurrentChat(chat);
  };

  if (loading) {
    return <div className="p-4">Ładowanie chatów...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Błąd: {error}</div>;
  }

  return (
    <div className="w-1/3 border-r border-gray-300 bg-gray-50">
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-xl font-semibold">Czaty</h2>
      </div>
      
      <div className="overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            Brak chatów
          </div>
        ) : (
          chats.map((chat) => {
            const otherUserId = chat.userAId === currentUserId ? chat.userBId : chat.userAId;
            const otherUserName = getUserName(otherUserId);
            const isActive = currentChat?.id === chat.id;
            
            return (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                  isActive ? 'bg-blue-100 border-blue-300' : ''
                }`}
              >
                <div className="font-medium">{otherUserName}</div>
                <div className="text-sm text-gray-500">
                  Chat ID: {chat.id}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
```

### 2. Komponent Czatu

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from './useChat';

interface ChatWindowProps {
  currentUserId: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUserId }) => {
  const { 
    currentChat, 
    messages, 
    loading, 
    error, 
    sendMessage, 
    getUserName, 
    isOwnMessage 
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentChat) return;
    
    try {
      sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">💬</div>
          <div>Wybierz chat aby rozpocząć rozmowę</div>
        </div>
      </div>
    );
  }

  const otherUserId = currentChat.userAId === currentUserId ? currentChat.userBId : currentChat.userAId;
  const otherUserName = getUserName(otherUserId);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <h3 className="text-lg font-semibold">{otherUserName}</h3>
        <div className="text-sm text-gray-500">
          {isOwnMessage ? 'Jesteś online' : 'Ostatnio widziany: teraz'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500">Ładowanie wiadomości...</div>
        ) : error ? (
          <div className="text-center text-red-600">Błąd: {error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            Brak wiadomości. Napisz pierwszą wiadomość!
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message.senderId);
            const senderName = getUserName(message.senderId);
            const messageTime = new Date(message.sentAt).toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {senderName}
                    </div>
                  )}
                  <div className="break-words">{message.content}</div>
                  <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {messageTime}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-300">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Wyślij
          </button>
        </form>
      </div>
    </div>
  );
};
```

### 3. Główny Komponent Chatów

```typescript
import React, { useEffect } from 'react';
import { useChat } from './useChat';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';

export const ChatApp: React.FC = () => {
  const { connectWebSocket, disconnectWebSocket, isConnected } = useChat();
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (token && currentUserId) {
      connectWebSocket(token);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [token, currentUserId, connectWebSocket, disconnectWebSocket]);

  if (!token || !currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4">🔐</div>
          <div className="text-gray-600">Musisz się zalogować aby korzystać z chatów</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Czaty</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Połączony' : 'Rozłączony'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        <ChatList currentUserId={currentUserId} />
        <ChatWindow currentUserId={currentUserId} />
      </div>
    </div>
  );
};
```

---

## ⚠️ Ważne Uwagi dla Frontendu

### 1. **Autoryzacja WebSocket**
- JWT token musi być w query parameter `?token={JWT_TOKEN}`
- Token jest weryfikowany podczas handshake
- Połączenie zostanie odrzucone jeśli token jest nieprawidłowy

### 2. **Zarządzanie połączeniem**
- WebSocket automatycznie próbuje się połączyć ponownie
- Heartbeat: 4 sekundy incoming/outgoing
- Reconnect delay: 5 sekund

### 3. **Format wiadomości**
- `sentAt` w formacie ISO 8601 UTC
- `content` może być pustym stringiem
- Maksymalna długość wiadomości: TEXT (bez limitu w bazie)

### 4. **Unikalność chatów**
- Chat jest unikalny dla pary użytkowników (A-B = B-A)
- System automatycznie znajduje istniejący chat
- Można utworzyć chat z samym sobą (userAId = userBId)

### 5. **Dostarczanie wiadomości**
- Wiadomości są dostarczane do obu uczestników chatu
- Wiadomości są zapisywane w bazie danych
- Historia jest sortowana rosnąco po `sentAt`

### 6. **Obsługa błędów**
- WebSocket może się rozłączyć - implementuj retry logic
- Sprawdzaj `isConnected` przed wysyłaniem wiadomości
- Obsługuj błędy autoryzacji (401/403)

### 7. **Performance**
- Używaj debouncing dla wysyłania wiadomości
- Implementuj virtual scrolling dla długich historii
- Cache'uj dane użytkowników
- Unikaj niepotrzebnych re-renderów

---

## 🎯 Przykłady Użycia

### Automatyczne ponowne łączenie
```typescript
const useAutoReconnect = (token: string) => {
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const handleReconnect = () => {
      if (reconnectAttempts < maxAttempts) {
        setTimeout(() => {
          connectWebSocket(token);
          setReconnectAttempts(prev => prev + 1);
        }, 5000 * (reconnectAttempts + 1)); // Exponential backoff
      }
    };

    if (!isConnected && token) {
      handleReconnect();
    }
  }, [isConnected, token, reconnectAttempts]);
};
```

### Typing indicators
```typescript
const useTypingIndicator = (chatId: number) => {
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const startTyping = useCallback(() => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ chatId, isTyping: true })
      });
    }
  }, [chatId]);

  const stopTyping = useCallback(() => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ chatId, isTyping: false })
      });
    }
  }, [chatId]);

  return { typingUsers, startTyping, stopTyping };
};
```

### Message status (sent/delivered/read)
```typescript
interface MessageWithStatus extends Message {
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

const useMessageStatus = () => {
  const [messageStatuses, setMessageStatuses] = useState<Map<string, string>>(new Map());

  const updateMessageStatus = useCallback((messageId: string, status: string) => {
    setMessageStatuses(prev => new Map(prev).set(messageId, status));
  }, []);

  return { messageStatuses, updateMessageStatus };
};
```

---

*Dokumentacja wygenerowana dla Dziekan Backend - Chat System*
