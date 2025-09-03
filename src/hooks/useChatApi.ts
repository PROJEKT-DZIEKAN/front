'use client';

import { useCallback } from 'react';
import { Chat, User } from './useChat';

const API_BASE_URL = 'https://dziekan-48de5f4dea14.herokuapp.com';

interface UseChatApiProps {
  user: User | null;
  token: string | null;
  mockChatsData: Chat[];
  mockUsers: Map<number, User>;
  onChatsUpdate: (chats: Chat[]) => void;
  onUsersUpdate: (users: Map<number, User>) => void;
}

export const useChatApi = ({
  user,
  token,
  mockChatsData,
  mockUsers,
  onChatsUpdate,
  onUsersUpdate
}: UseChatApiProps) => {
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
          onChatsUpdate(chatsData);
        } catch (parseError) {
          console.error('❌ JSON parse error for chats:', parseError);
          console.log('🔄 Using mock chats due to JSON error');
          onChatsUpdate(mockChatsData);
        }
      } else {
        console.error('Failed to fetch chats:', response.status);
        console.log('🔄 Using mock chats due to HTTP error');
        onChatsUpdate(mockChatsData);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      console.log('🔄 Using mock chats due to network error');
      onChatsUpdate(mockChatsData);
    }
  }, [user, token, mockChatsData, onChatsUpdate]);

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
          
          const usersMap = new Map(usersData.map(user => [
            user.id, 
            {
              ...user,
              roles: user.roles || []
            }
          ]));
          onUsersUpdate(usersMap);
          
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.log('🔄 Using mock users due to JSON error');
          onUsersUpdate(mockUsers);
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        console.log('🔄 Using mock users due to HTTP error');
        onUsersUpdate(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.log('🔄 Using mock users due to network error');
      onUsersUpdate(mockUsers);
    }
  }, [token, mockUsers, onUsersUpdate]);

  const getOrCreateChat = useCallback(async (otherUserId: number): Promise<Chat | null> => {
    console.log('🏗️ getOrCreateChat called:', {
      hasUser: !!user,
      hasToken: !!token,
      otherUserId
    });

    if (!user || !token) {
      console.error('❌ No user or token');
      return null;
    }

    try {
      console.log('🌐 Making API request:', {
        url: `${API_BASE_URL}/api/chats/get-or-create`,
        userAId: user.id,
        userBId: otherUserId,
        hasToken: !!token,
        tokenLength: token?.length
      });

      const response = await fetch(`${API_BASE_URL}/api/chats/get-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          userAId: user.id,
          userBId: otherUserId
        })
      });
      
      if (response.ok) {
        const chat = await response.json();
        console.log('Created/got chat:', chat);
        await fetchChats();
        return chat;
      } else {
        console.error('Failed to create chat:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [user, token, fetchChats]);

  return {
    fetchChats,
    fetchAllUsers,
    getOrCreateChat
  };
};
