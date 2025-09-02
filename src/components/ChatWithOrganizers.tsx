'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import ChatHeader from './chat/ChatHeader';
import ChatList from './chat/ChatList';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ChatEmptyState from './chat/ChatEmptyState';
import ChatNotAuthenticated from './chat/ChatNotAuthenticated';

// Interface Message nie jest używany w nowym systemie - usuwam
// Używamy Message z useChat hook

export default function ChatWithOrganizers() {
  console.log('💬 ChatWithOrganizers component rendering...');
  
  const { user, isAuthenticated, isAdmin } = useAuth();
  console.log('💬 After useAuth:', { user: !!user, isAuthenticated, isAdmin });
  
  const { 
    connected, 
    messages: chatMessages, 
    chats, 
    allUsers, 
    sendMessage, 
    loadHistory, 
    fetchChats, 
    fetchAllUsers,
    startSupportChat,
    hasAccessToChat,
    mockMode 
  } = useChat();
  
  console.log('💬 After useChat:', { 
    connected, 
    messagesCount: chatMessages.length, 
    chatsCount: chats.length,
    usersCount: allUsers.size 
  });
  
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (connected) {
      fetchChats();
      fetchAllUsers();
      
      // Jeśli po 2 sekundach nie ma użytkowników, problem z API
      setTimeout(() => {
        console.log('⏰ Checking if users loaded...');
      }, 2000);
    }
  }, [connected, fetchChats, fetchAllUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleStartSupport = async () => {
    console.log('🆘 handleStartSupport clicked!', { isAuthenticated, connected });
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      alert('Musisz się zalogować aby korzystać z czatu');
      return;
    }

    if (!connected) {
      console.log('❌ Not connected to WebSocket');
      alert('Brak połączenia z serwerem. Sprawdź console.');
      return;
    }

    console.log('🔄 Calling startSupportChat...');
    const chat = await startSupportChat();
    console.log('📞 startSupportChat result:', chat);
    
    if (chat) {
      setSelectedChatId(chat.id);
      loadHistory(chat.id);
      console.log('✅ Chat started successfully:', chat.id);
    } else {
      console.log('❌ Failed to start chat');
      alert('Nie udało się rozpocząć chatu z administratorem. Sprawdź console dla szczegółów.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChatId && newMessage.trim() && hasAccessToChat(selectedChatId)) {
      sendMessage(selectedChatId, newMessage);
      setNewMessage('');
    }
  };

  const selectChat = (chatId: number) => {
    if (hasAccessToChat(chatId)) {
      setSelectedChatId(chatId);
      loadHistory(chatId);
    }
  };

  const getChatAdmin = (chat: { userAId: number; userBId: number }) => {
    // Znajdź administratora w tym chacie
    const userA = allUsers.get(chat.userAId);
    const userB = allUsers.get(chat.userBId);
    
    const userAIsAdmin = userA?.roles?.includes('admin') || 
                         userA?.roles?.some((role: string | { roleName?: string }) => 
                           typeof role === 'object' && role?.roleName === 'admin'
                         );
    const userBIsAdmin = userB?.roles?.includes('admin') || 
                         userB?.roles?.some((role: string | { roleName?: string }) => 
                           typeof role === 'object' && role?.roleName === 'admin'
                         );
    
    if (userAIsAdmin && chat.userAId !== user?.id) {
      return userA;
    } else if (userBIsAdmin && chat.userBId !== user?.id) {
      return userB;
    }
    return null;
  };

  const getLatestMessage = (chatId: number) => {
    return chatMessages
      .filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];
  };

  // Jeśli nie zalogowany
  if (!isAuthenticated) {
    return <ChatNotAuthenticated />;
  }

  return (
    <div className="chat-container h-screen flex flex-col bg-gray-50 no-scroll-x">
      {/* Header */}
      <ChatHeader
        user={user}
        connected={connected}
        mockMode={mockMode}
        isAdmin={isAdmin}
        onStartSupport={handleStartSupport}
      />

      <div className="chat-layout flex flex-1 overflow-hidden">
        {/* Lista chatów (jeśli są) */}
        <div className="chat-sidebar">
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            isAdmin={isAdmin}
            allUsers={allUsers}
            chatMessages={chatMessages}
            user={user}
            onSelectChat={selectChat}
            getChatAdmin={getChatAdmin}
            getLatestMessage={getLatestMessage}
          />
        </div>

        {/* Okno chatu */}
        <div className="chat-main flex-1 flex flex-col overflow-hidden">
          {selectedChatId ? (
            <>
              <div className="p-4 bg-white border-b border-gray-300 flex-shrink-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {isAdmin ? `Chat #${selectedChatId}` : `Chat z organizatorem #${selectedChatId}`}
                </h3>
              </div>

              {/* Wiadomości */}
              <div className="chat-messages-container flex-1 overflow-y-auto overflow-x-hidden">
                <ChatMessages
                  ref={messagesEndRef}
                  messages={chatMessages}
                  selectedChatId={selectedChatId}
                  allUsers={allUsers}
                  user={user}
                />
              </div>

              {/* Formularz wysyłania */}
              <div className="flex-shrink-0">
                <ChatInput
                  ref={inputRef}
                  newMessage={newMessage}
                  onMessageChange={setNewMessage}
                  onSubmit={handleSendMessage}
                  connected={connected}
                  isAdmin={isAdmin}
                />
              </div>
            </>
          ) : (
            <ChatEmptyState isAdmin={isAdmin} chatsCount={chats.length} />
          )}
        </div>
      </div>
    </div>
  );
}