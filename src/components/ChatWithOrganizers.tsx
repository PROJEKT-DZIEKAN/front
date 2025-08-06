'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

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
    
    const userAIsAdmin = userA?.roles?.includes('admin');
    const userBIsAdmin = userB?.roles?.includes('admin');
    
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
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Zaloguj się</h2>
          <p className="text-gray-600">Musisz się zalogować aby korzystać z czatu z organizatorami.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-300 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              Chat z Organizatorami
            </h2>
            <div className="text-sm text-gray-600">
              {user?.firstName} {user?.surname}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? (mockMode ? 'Mock Mode' : 'Połączony') : 'Rozłączony z backendem'}
              </span>
              {mockMode && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEMO</span>
              )}
              {!connected && !mockMode && (
                <span className="text-xs text-gray-500">(sprawdź console)</span>
              )}
            </div>
            {!isAdmin && (
              <button
                onClick={(e) => {
                  console.log('🔥 BUTTON CLICKED!', { connected, isAuthenticated, isAdmin });
                  handleStartSupport();
                }}
                disabled={!connected}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Nowy Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista chatów (jeśli są) */}
        {chats.length > 0 && (
          <div className="w-1/3 bg-white border-r border-gray-300">
            <div className="p-3 bg-gray-50 font-semibold text-sm text-gray-600 border-b">
              {isAdmin ? `Wszystkie chaty (${chats.length})` : `Moje chaty (${chats.length})`}
            </div>
            <div className="overflow-y-auto">
              {chats.map(chat => {
                const admin = isAdmin ? null : getChatAdmin(chat);
                const latestMessage = getLatestMessage(chat.id);
                
                return (
                  <div
                    key={chat.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => selectChat(chat.id)}
                  >
                    <div className="font-medium text-sm">
                      {isAdmin ? 
                        `Chat #${chat.id}` : 
                        `Chat z: ${admin ? `${admin.firstName} ${admin.surname} 👑` : 'Organizatorem'}`
                      }
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Chat ID: {chat.id}
                    </div>
                    {latestMessage && (
                      <>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {latestMessage.content}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(latestMessage.sentAt).toLocaleTimeString()}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Okno chatu */}
        <div className="flex-1 flex flex-col">
          {selectedChatId ? (
            <>
              <div className="p-4 bg-white border-b border-gray-300">
                <h3 className="font-semibold text-gray-800">
                  {isAdmin ? `Chat #${selectedChatId}` : `Chat z organizatorem #${selectedChatId}`}
                </h3>
              </div>

              {/* Wiadomości */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {chatMessages
                  .filter(msg => msg.chatId === selectedChatId)
                  .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
                  .map((msg, index) => {
                    const sender = allUsers.get(msg.senderId);
                    const isMyMessage = msg.senderId === user?.id;
                    const senderIsAdmin = sender?.roles?.includes('admin');
                    
                    return (
                      <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                          isMyMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}>
                          <div className="text-xs opacity-75 mb-1 font-medium">
                            {isMyMessage ? 'Ty' : (senderIsAdmin ? '👑 Organizator' : 'Użytkownik')}
                          </div>
                          <div className="leading-relaxed">{msg.content}</div>
                          <div className="text-xs opacity-75 mt-2">
                            {new Date(msg.sentAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>

              {/* Formularz wysyłania */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-300">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isAdmin ? "Napisz wiadomość jako organizator..." : "Napisz wiadomość do organizatora..."}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={!connected}
                  />
                  <button
                    type="submit"
                    disabled={!connected || !newMessage.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Wyślij
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-lg mb-2">
                  {isAdmin ? 'Panel Organizatora' : 'Chat z Organizatorami'}
                </div>
                <div className="mb-4">
                  {chats.length === 0 ? 
                    (isAdmin ? 'Brak aktywnych chatów' : 'Kliknij "Nowy Chat" aby rozpocząć') : 
                    'Wybierz chat aby kontynuować konwersację'
                  }
                </div>
                <div className="text-sm text-gray-400">
                  {isAdmin ? 'Czekasz na wiadomości od użytkowników' : 'Organizatorzy są dostępni aby Ci pomóc'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}