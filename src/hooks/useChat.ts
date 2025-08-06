'use client';

import { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './useAuth';

export interface Message {
  chatId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

export interface Chat {
  id: number;
  userAId: number;
  userBId: number;
  createdAt: string;
}

export interface User {
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
  const [mockMode, setMockMode] = useState(false);

  // Mock data dla fallback
  const mockUsers = new Map<number, User>([
    [1, { id: 1, firstName: 'Admin', surname: 'Główny', roles: ['admin'] }],
    [2, { id: 2, firstName: 'Anna', surname: 'Kowalska', roles: ['admin'] }],
    [3, { id: 3, firstName: 'Jan', surname: 'Nowak', roles: ['user'] }],
    [4, { id: 4, firstName: 'Maria', surname: 'Wiśniewska', roles: ['user'] }],
  ]);

  const mockChatsData: Chat[] = [
    { id: 1, userAId: 1, userBId: 3, createdAt: new Date().toISOString() },
    { id: 2, userAId: 2, userBId: 4, createdAt: new Date().toISOString() },
  ];

  const enableMockMode = () => {
    console.log('📱 Enabling mock mode...');
    setMockMode(true);
    setConnected(true);
    setAllUsers(mockUsers);
    setChats(mockChatsData);
  };

  // Prawdziwe połączenie WebSocket
  useEffect(() => {
    console.log('useChat effect triggered:', { user: !!user, token: !!token, userId: user?.id });
    
    if (!user || !token) {
      console.log('Missing user or token, not connecting to WebSocket');
      return;
    }

    console.log('Connecting to WebSocket chat system...', { 
      url: `${API_BASE_URL}/ws-chat?token=${token}`,
      userId: user.id 
    });

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-chat?token=${token}`),
      debug: (str) => console.log('STOMP:', str),
      onConnect: () => {
        console.log('✅ Connected to WebSocket successfully!');
        setConnected(true);
        
        // Subskrypcja na wiadomości
        stompClient.subscribe('/user/queue/messages', (message) => {
          const newMessage: Message = JSON.parse(message.body);
          console.log('📨 Received message:', newMessage);
          setMessages(prev => [...prev, newMessage]);
        });

        // Subskrypcja na historię
        stompClient.subscribe('/user/queue/history', (message) => {
          const history: Message[] = JSON.parse(message.body);
          console.log('📜 Received history:', history);
          setMessages(history);
        });
      },
      onDisconnect: () => {
        console.log('❌ Disconnected from WebSocket');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('🚨 STOMP connection error:', frame);
        console.error('Error details:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        });
        console.log('🔄 Falling back to mock mode...');
        setConnected(false);
        enableMockMode();
      },
      onWebSocketError: (event) => {
        console.error('🌐 WebSocket error:', event);
        console.log('🔄 Falling back to mock mode...');
        setConnected(false);
        enableMockMode();
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
        const text = await response.text();
        console.log('Raw chats response:', text);
        
        try {
          const chatsData = JSON.parse(text);
          console.log('✅ Fetched chats successfully:', chatsData);
          setChats(chatsData);
        } catch (parseError) {
          console.error('❌ JSON parse error for chats:', parseError);
          console.log('🔄 Using mock chats due to JSON error');
          setChats(mockChatsData);
        }
      } else {
        console.error('Failed to fetch chats:', response.status);
        console.log('🔄 Using mock chats due to HTTP error');
        setChats(mockChatsData);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      console.log('🔄 Using mock chats due to network error');
      setChats(mockChatsData);
    }
  }, [user, token]);

  // Pobieranie wszystkich użytkowników (dla adminów)
  const fetchAllUsers = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        console.log('Raw users response:', text);
        
        try {
          const usersData: User[] = JSON.parse(text);
          console.log('✅ Parsed users successfully:', usersData);
          
          // Konwertuj na Map i mapuj role
          const usersMap = new Map(usersData.map(user => [
            user.id, 
            {
              ...user,
              roles: user.roles || [] // Upewnij się że roles istnieją
            }
          ]));
          setAllUsers(usersMap);
          
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.log('🔄 Using mock users due to JSON error');
          setAllUsers(mockUsers);
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        console.log('🔄 Using mock users due to HTTP error');
        setAllUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.log('🔄 Using mock users due to network error');
      setAllUsers(mockUsers);
    }
  }, [token]);

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
    console.log('🔍 findAvailableAdmin called:', { 
      isAdmin, 
      allUsersSize: allUsers.size,
      allUsersEntries: Array.from(allUsers.entries())
    });
    
    if (isAdmin) {
      console.log('❌ Current user is admin, returning null');
      return null;
    }

    const allUsersArray = Array.from(allUsers.values());
    console.log('👥 All users:', allUsersArray);
    
    const admins = allUsersArray.filter(u => {
      console.log(`👤 User ${u.firstName} ${u.surname}:`, {
        id: u.id,
        roles: u.roles,
        rolesType: typeof u.roles,
        rolesLength: u.roles?.length,
        fullUser: u
      });
      
      // Sprawdź różne formaty ról
      const hasAdminRole = u.roles?.includes('admin') || 
                          u.roles?.includes('ADMIN') ||
                          u.roles?.includes('Admin') ||
                          // Może role są w obiekcie?
                          u.roles?.some((role: any) => 
                            role === 'admin' || 
                            role === 'ADMIN' || 
                            role?.roleName === 'admin' || 
                            role?.roleName === 'ADMIN'
                          );
      
      console.log(`  → hasAdminRole: ${hasAdminRole}`);
      return hasAdminRole;
    });
    
    console.log('👑 Found admins:', admins);
    
    // Jeśli nie znaleziono adminów po rolach, użyj fallback na User ID
    if (admins.length === 0) {
      console.log('🔄 No admins found by roles, trying fallback by User ID...');
      
      // User ID 1 = ADMIN, User ID 2 = USER
      const adminById = allUsersArray.find(u => u.id === 1);
      if (adminById) {
        console.log('✅ Found admin by ID fallback (User ID 1):', adminById);
        return adminById;
      } else {
        console.log('❌ User ID 1 (admin) not found in allUsers');
      }
    }
    
    return admins.length > 0 ? admins[0] : null;
  }, [isAdmin, allUsers]);

  // Rozpocznij chat z supportem (dla użytkowników)
  const startSupportChat = useCallback(async (): Promise<Chat | null> => {
    console.log('🆘 Starting support chat...', { mockMode });
    
    if (mockMode) {
      console.log('📱 Using mock mode for startSupportChat');
      const admin = findAvailableAdmin();
      if (!admin) {
        console.error('❌ Brak dostępnych administratorów');
        console.log('Available users:', Array.from(allUsers.entries()));
        return null;
      }

      console.log('👑 Found admin:', admin);
      // W mock mode tworzymy prosty chat
      const newChat: Chat = {
        id: Math.max(...chats.map(c => c.id), 0) + 1,
        userAId: user!.id,
        userBId: admin.id,
        createdAt: new Date().toISOString()
      };
      
      setChats(prev => [...prev, newChat]);
      console.log('✅ Mock chat created:', newChat);
      return newChat;
    }
    
    const admin = findAvailableAdmin();
    if (!admin) {
      console.error('❌ Brak dostępnych administratorów');
      console.log('Available users:', Array.from(allUsers.entries()));
      return null;
    }

    console.log('👑 Found admin:', admin);
    return await getOrCreateChat(admin.id);
  }, [findAvailableAdmin, getOrCreateChat, allUsers, mockMode, chats, user]);

  // Wysyłanie wiadomości przez WebSocket
  const sendMessage = useCallback((chatId: number, content: string) => {
    console.log('📤 Sending message:', { chatId, senderId: user?.id, content, mockMode });
    
    if (!user) {
      console.error('No user');
      return;
    }

    if (mockMode) {
      // Mock mode - dodaj wiadomość lokalnie
      const newMessage: Message = {
        chatId,
        senderId: user.id,
        content,
        sentAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      console.log('📱 Mock message sent:', newMessage);
      
      // Symuluj odpowiedź administratora po 2 sekundach
      if (!isAdmin) {
        setTimeout(() => {
          const admins = Array.from(allUsers.values()).filter(u => u.roles.includes('admin'));
          const randomAdmin = admins[Math.floor(Math.random() * admins.length)];
          
          if (randomAdmin) {
            const responses = [
              'Dziękuję za wiadomość. Sprawdzam to dla Ciebie.',
              'Rozumiem problem. Za chwilę się tym zajmę.',
              'Czy możesz podać więcej szczegółów?',
              'To częsty problem. Oto rozwiązanie...',
              'Przekazuję to do odpowiedniego działu.',
            ];
            
            const responseMessage: Message = {
              chatId,
              senderId: randomAdmin.id,
              content: responses[Math.floor(Math.random() * responses.length)],
              sentAt: new Date().toISOString()
            };

            setMessages(prev => [...prev, responseMessage]);
            console.log('🤖 Mock admin response:', responseMessage);
          }
        }, 2000);
      }
      return;
    }

    if (!client || !connected) {
      console.error('WebSocket not connected');
      return;
    }

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        chatId,
        senderId: user.id,
        content
      })
    });
  }, [client, connected, user, mockMode, isAdmin, allUsers]);

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
    findAvailableAdmin,
    mockMode
  };
};