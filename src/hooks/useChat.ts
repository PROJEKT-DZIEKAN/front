'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useWebSocket } from './useWebSocket';
import { useChatApi } from './useChatApi';
import { useChatLogic } from './useChatLogic';

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
  roles?: string[];
}

export const useChat = () => {
  const { user, isAdmin, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<Map<number, User>>(new Map());
  const [mockMode, setMockMode] = useState(false);

  const enableMockMode = useCallback(() => {
    console.log('📱 Enabling mock mode...');
    setMockMode(true);
  }, []);

  const chatLogic = useChatLogic({
    user,
    isAdmin,
    chats,
    allUsers,
    messages,
    mockMode,
    onMessagesUpdate: setMessages,
    onChatsUpdate: setChats
  });

  const chatApi = useChatApi({
    user,
    token,
    mockChatsData: chatLogic.mockChatsData,
    mockUsers: chatLogic.mockUsers,
    onChatsUpdate: setChats,
    onUsersUpdate: setAllUsers
  });

  const webSocket = useWebSocket({
    user,
    token,
    onMessageReceived: (message) => setMessages(prev => [...prev, message]),
    onHistoryReceived: setMessages,
    onConnectionError: enableMockMode
  });

  useEffect(() => {
    if (user && token) {
      chatApi.fetchChats();
      chatApi.fetchAllUsers();
    }
  }, [user, token]);

  const sendMessage = useCallback((chatId: number, content: string) => {
    console.log('📤 Sending message:', { chatId, senderId: user?.id, content, mockMode });
    
    if (!user) {
      console.error('No user');
      return;
    }

    if (mockMode) {
      chatLogic.sendMockMessage(chatId, content, isAdmin);
      return;
    }

    webSocket.sendMessage(chatId, content, user.id);
  }, [user, mockMode, isAdmin, chatLogic, webSocket]);

  const startSupportChat = useCallback(async (): Promise<Chat | null> => {
    return chatLogic.startSupportChat(chatApi.getOrCreateChat, webSocket.loadHistory);
  }, [chatLogic, chatApi, webSocket]);

  const startChatWithUser = useCallback(async (targetUserId: number): Promise<Chat | null> => {
    return chatLogic.startChatWithUser(chatApi.getOrCreateChat, webSocket.loadHistory, targetUserId);
  }, [chatLogic, chatApi, webSocket]);

  return {
    connected: webSocket.connected,
    messages,
    chats: chatLogic.getFilteredChats(),
    allUsers,
    sendMessage,
    loadHistory: webSocket.loadHistory,
    fetchChats: chatApi.fetchChats,
    fetchAllUsers: chatApi.fetchAllUsers,
    getOrCreateChat: chatApi.getOrCreateChat,
    startSupportChat,
    startChatWithUser,
    canChatWith: chatLogic.canChatWith,
    hasAccessToChat: chatLogic.hasAccessToChat,
    findAvailableAdmin: chatLogic.findAvailableAdmin,
    mockMode
  };
};