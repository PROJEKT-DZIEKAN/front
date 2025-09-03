'use client';

import { useCallback, useMemo } from 'react';
import { Chat, User, Message } from './useChat';

interface UseChatLogicProps {
  user: any;
  isAdmin: boolean;
  chats: Chat[];
  allUsers: Map<number, User>;
  messages: Message[];
  mockMode: boolean;
  onMessagesUpdate: (messages: Message[]) => void;
  onChatsUpdate: (chats: Chat[]) => void;
}

export const useChatLogic = ({
  user,
  isAdmin,
  chats,
  allUsers,
  messages,
  mockMode,
  onMessagesUpdate,
  onChatsUpdate
}: UseChatLogicProps) => {
  const mockUsers = useMemo(() => new Map<number, User>([
    [1, { id: 1, firstName: 'Admin', surname: 'Główny', roles: ['admin'] }],
    [2, { id: 2, firstName: 'Anna', surname: 'Kowalska', roles: ['admin'] }],
    [3, { id: 3, firstName: 'Jan', surname: 'Nowak', roles: ['user'] }],
    [4, { id: 4, firstName: 'Maria', surname: 'Wiśniewska', roles: ['user'] }],
  ]), []);

  const mockChatsData = useMemo((): Chat[] => [
    { id: 1, userAId: 1, userBId: 3, createdAt: new Date().toISOString() },
    { id: 2, userAId: 2, userBId: 4, createdAt: new Date().toISOString() },
  ], []);

  const getFilteredChats = useCallback(() => {
    if (!user) return [];

    if (isAdmin) {
      return chats;
    } else {
      return chats.filter(chat => {
        const otherUserId = chat.userAId === user.id ? chat.userBId : chat.userAId;
        const otherUser = allUsers.get(otherUserId);
        return otherUser?.roles?.includes('admin');
      });
    }
  }, [chats, user, isAdmin, allUsers]);

  const canChatWith = useCallback((otherUserId: number): boolean => {
    console.log('🔍 canChatWith called:', {
      currentUserId: user?.id,
      otherUserId,
      isAdmin,
      allUsersSize: allUsers.size
    });

    if (!user) {
      console.log('❌ No current user');
      return false;
    }

    const otherUser = allUsers.get(otherUserId);
    if (!otherUser) {
      console.log('❌ Other user not found:', otherUserId);
      return false;
    }

    const otherIsAdmin = otherUser.roles?.includes('admin') || 
                         otherUser.roles?.some((role: string | { roleName?: string }) => 
                           typeof role === 'object' && role?.roleName === 'admin'
                         );
    
    if (isAdmin && otherIsAdmin) {
      console.log('❌ admin -> admin: BLOCKED');
      return false;
    }
    if (!isAdmin && !otherIsAdmin) {
      console.log('❌ user -> user: BLOCKED');
      return false;
    }
    
    console.log('✅ admin <-> user: ALLOWED');
    return true;
  }, [user, isAdmin, allUsers]);

  const findAvailableAdmin = useCallback((): User | null => {
    if (isAdmin) return null;

    const allUsersArray = Array.from(allUsers.values());
    const admins = allUsersArray.filter(u => {
      const hasAdminRole = u.roles?.includes('admin') || 
                           u.roles?.some((role: string | { roleName?: string }) => 
                             typeof role === 'object' && role?.roleName === 'admin'
                           );
      return hasAdminRole;
    });
    
    if (admins.length === 0) {
      const adminById = allUsersArray.find(u => u.id === 1);
      if (adminById) return adminById;
    }
    
    return admins.length > 0 ? admins[0] : null;
  }, [isAdmin, allUsers]);

  const hasAccessToChat = useCallback((chatId: number): boolean => {
    if (!user) return false;

    const chat = chats.find(c => c.id === chatId);
    if (!chat) return false;

    if (isAdmin) {
      return true;
    } else {
      return chat.userAId === user.id || chat.userBId === user.id;
    }
  }, [user, chats, isAdmin]);

  const startSupportChat = useCallback(async (getOrCreateChat: (userId: number) => Promise<Chat | null>, loadHistory: (chatId: number) => void): Promise<Chat | null> => {
    console.log('🆘 Starting support chat...', { mockMode });
    
    if (mockMode) {
      const admin = findAvailableAdmin();
      if (!admin) {
        console.error('❌ Brak dostępnych administratorów');
        return null;
      }

      const newChat: Chat = {
        id: Math.max(...chats.map(c => c.id), 0) + 1,
        userAId: user!.id,
        userBId: admin.id,
        createdAt: new Date().toISOString()
      };
      
      onChatsUpdate([...chats, newChat]);
      return newChat;
    }
    
    const admin = findAvailableAdmin();
    if (!admin) {
      console.error('❌ Brak dostępnych administratorów');
      return null;
    }

    const chat = await getOrCreateChat(admin.id);
    
    if (chat?.id) {
      setTimeout(() => loadHistory(chat.id), 100);
    }
    
    return chat;
  }, [findAvailableAdmin, chats, mockMode, user, onChatsUpdate]);

  const sendMockMessage = useCallback((chatId: number, content: string, isAdmin: boolean) => {
    if (!user) return;

    const newMessage: Message = {
      chatId,
      senderId: user.id,
      content,
      sentAt: new Date().toISOString()
    };
    
    onMessagesUpdate([...messages, newMessage]);
    
    if (!isAdmin) {
      setTimeout(() => {
        const admins = Array.from(allUsers.values()).filter(u => u.roles?.includes('admin'));
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

          onMessagesUpdate(prev => [...prev, responseMessage]);
        }
      }, 2000);
    }
  }, [user, messages, allUsers, isAdmin, onMessagesUpdate]);

  return {
    mockUsers,
    mockChatsData,
    getFilteredChats,
    canChatWith,
    findAvailableAdmin,
    hasAccessToChat,
    startSupportChat,
    sendMockMessage
  };
};
