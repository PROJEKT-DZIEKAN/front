'use client';

import { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './useAuth';

interface Message {
  chatId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

interface Chat {
  id: number;
  userAId: number;
  userBId: number;
  createdAt: string;
}

interface User {
  id: number;
  firstName: string;
  surname: string;
  roles: string[];
}

// Backend URL - dostosuj do swojego backendu
const API_BASE_URL = 'https://dziekan-backend-ywfy.onrender.com';

export const useChat = () => {
  const { user, isAdmin, token } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<Map<number, User>>(new Map());

  // Prawdziwe połączenie WebSocket
  useEffect(() => {
    if (!user || !token) return;

    console.log('Connecting to WebSocket chat system...');

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-chat?token=${token}`),
      debug: (str) => console.log('STOMP:', str),
      onConnect: () => {
        console.log('Connected to WebSocket');
        setConnected(true);
        
        // Subskrypcja na wiadomości
        stompClient.subscribe('/user/queue/messages', (message) => {
          const newMessage: Message = JSON.parse(message.body);
          console.log('Received message:', newMessage);
          setMessages(prev => [...prev, newMessage]);
        });

        // Subskrypcja na historię
        stompClient.subscribe('/user/queue/history', (message) => {
          const history: Message[] = JSON.parse(message.body);
          console.log('Received history:', history);
          setMessages(history);
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setConnected(false);
      }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      console.log('Deactivating WebSocket connection...');
      stompClient.deactivate();
    };
  }, [user, token]);

  // Pobieranie chatów z backendu
  const fetchChats = useCallback(async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const chatsData = await response.json();
        console.log('Fetched chats:', chatsData);
        setChats(chatsData);
      } else {
        console.error('Failed to fetch chats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [user, token]);

  // Pobieranie wszystkich użytkowników (dla adminów)
  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const usersData: User[] = await response.json();
        console.log('Fetched users:', usersData);
        
        // Konwertuj na Map i mapuj role
        const usersMap = new Map(usersData.map(user => [
          user.id, 
          {
            ...user,
            roles: user.roles || [] // Upewnij się że roles istnieją
          }
        ]));
        setAllUsers(usersMap);
      } else {
        console.error('Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [isAdmin, token]);

  // Filtrowanie chatów na podstawie roli
  const getFilteredChats = useCallback(() => {
    if (!user) return [];

    if (isAdmin) {
      // Admin widzi wszystkie chaty
      return chats;
    } else {
      // Zwykły użytkownik widzi tylko chaty z adminami
      return chats.filter(chat => {
        const otherUserId = chat.userAId === user.id ? chat.userBId : chat.userAId;
        const otherUser = allUsers.get(otherUserId);
        return otherUser?.roles?.includes('admin');
      });
    }
  }, [chats, user, isAdmin, allUsers]);

  // Sprawdzenie czy użytkownik może tworzyć chat z daną osobą
  const canChatWith = useCallback((otherUserId: number): boolean => {
    if (!user) return false;

    const otherUser = allUsers.get(otherUserId);
    if (!otherUser) return false;

    const otherIsAdmin = otherUser.roles?.includes('admin');

    // Dozwolone tylko admin <-> user
    if (isAdmin && otherIsAdmin) return false; // admin -> admin: NIE
    if (!isAdmin && !otherIsAdmin) return false; // user -> user: NIE
    
    return true; // admin -> user lub user -> admin: TAK
  }, [user, isAdmin, allUsers]);

  // Tworzenie lub pobieranie chatu
  const getOrCreateChat = useCallback(async (otherUserId: number): Promise<Chat | null> => {
    if (!user || !token || !canChatWith(otherUserId)) {
      console.error('Nie można utworzyć chatu z tym użytkownikiem');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/get-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userAId: user.id,
          userBId: otherUserId
        })
      });
      
      if (response.ok) {
        const chat = await response.json();
        console.log('Created/got chat:', chat);
        await fetchChats(); // Odśwież listę chatów
        return chat;
      } else {
        console.error('Failed to create chat:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [user, token, canChatWith, fetchChats]);

  // Znajdź pierwszego dostępnego admina (dla użytkowników)
  const findAvailableAdmin = useCallback((): User | null => {
    if (isAdmin) return null;

    const admins = Array.from(allUsers.values()).filter(u => 
      u.roles?.includes('admin')
    );
    
    return admins.length > 0 ? admins[0] : null;
  }, [isAdmin, allUsers]);

  // Rozpocznij chat z supportem (dla użytkowników)
  const startSupportChat = useCallback(async (): Promise<Chat | null> => {
    const admin = findAvailableAdmin();
    if (!admin) {
      console.error('Brak dostępnych administratorów');
      return null;
    }

    return await getOrCreateChat(admin.id);
  }, [findAvailableAdmin, getOrCreateChat]);

  // Wysyłanie wiadomości przez WebSocket
  const sendMessage = useCallback((chatId: number, content: string) => {
    if (!client || !connected || !user) {
      console.error('WebSocket not connected or no user');
      return;
    }

    console.log('Sending message:', { chatId, senderId: user.id, content });

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        chatId,
        senderId: user.id,
        content
      })
    });
  }, [client, connected, user]);

  // Pobieranie historii wiadomości przez WebSocket
  const loadHistory = useCallback((chatId: number) => {
    if (!client || !connected) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Loading history for chat:', chatId);

    client.publish({
      destination: '/app/chat.history',
      body: JSON.stringify({ id: chatId })
    });
  }, [client, connected]);

  // Sprawdzenie czy użytkownik ma dostęp do chatu
  const hasAccessToChat = useCallback((chatId: number): boolean => {
    if (!user) return false;

    const chat = chats.find(c => c.id === chatId);
    if (!chat) return false;

    if (isAdmin) {
      // Admin ma dostęp do wszystkich chatów
      return true;
    } else {
      // Zwykły użytkownik ma dostęp tylko do swoich chatów
      return chat.userAId === user.id || chat.userBId === user.id;
    }
  }, [user, chats, isAdmin]);

  return {
    connected,
    messages,
    chats: getFilteredChats(),
    allUsers,
    sendMessage,
    loadHistory,
    fetchChats,
    fetchAllUsers,
    getOrCreateChat,
    startSupportChat,
    canChatWith,
    hasAccessToChat,
    findAvailableAdmin
  };
};