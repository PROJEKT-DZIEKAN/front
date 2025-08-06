'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat, type Chat } from '@/hooks/useChat';
import { 
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AdminChatPanel() {
  const { user, isAdmin } = useAuth();
  const { 
    connected, 
    messages, 
    chats, 
    allUsers, 
    sendMessage, 
    loadHistory, 
    fetchChats, 
    fetchAllUsers,
    hasAccessToChat 
  } = useChat();
  
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (connected) {
      fetchChats();
      fetchAllUsers();
    }
  }, [connected, fetchChats, fetchAllUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChatId && messageText.trim() && hasAccessToChat(selectedChatId)) {
      sendMessage(selectedChatId, messageText);
      setMessageText('');
    }
  };

  const selectChat = (chatId: number) => {
    if (hasAccessToChat(chatId)) {
      setSelectedChatId(chatId);
      loadHistory(chatId);
    }
  };

  const getChatTitle = (chat: Chat) => {
    const userA = allUsers.get(chat.userAId);
    const userB = allUsers.get(chat.userBId);
    const userAName = userA ? `${userA.firstName} ${userA.surname}` : `User ${chat.userAId}`;
    const userBName = userB ? `${userB.firstName} ${userB.surname}` : `User ${chat.userBId}`;
    
    // Pokaż kto jest adminem
    const userAIsAdmin = userA?.roles?.includes('admin');
    const userBIsAdmin = userB?.roles?.includes('admin');
    
    return `${userAName}${userAIsAdmin ? ' 👑' : ''} ↔ ${userBName}${userBIsAdmin ? ' 👑' : ''}`;
  };

  const getLatestMessage = (chatId: number) => {
    return messages
      .filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];
  };

  // Jeśli nie admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Brak uprawnień</h2>
          <p className="text-gray-600">Ten panel jest dostępny tylko dla administratorów.</p>
        </div>
      </div>
    );
  }

  if (!user) return <div>Ładowanie...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel chatów */}
      <div className="w-1/3 bg-white border-r border-gray-300">
        <div className="p-4 bg-blue-600 text-white">
          <h2 className="text-xl font-bold">Panel Administratora</h2>
          <div className="text-sm opacity-90">
            {user.firstName} {user.surname} 👑
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{connected ? 'Połączony' : 'Rozłączony'}</span>
          </div>
        </div>
        
        <div className="overflow-y-auto">
          <div className="p-3 bg-gray-50 font-semibold text-sm text-gray-600">
            Wszystkie chaty ({chats.length})
          </div>
          
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Brak chatów do wyświetlenia
            </div>
          ) : (
            chats.map(chat => {
              const latestMessage = getLatestMessage(chat.id);
              
              return (
                <div
                  key={chat.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => selectChat(chat.id)}
                >
                  <div className="font-medium text-sm">
                    {getChatTitle(chat)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Chat ID: {chat.id}
                  </div>
                  {latestMessage && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {latestMessage.content}
                    </div>
                  )}
                  {latestMessage && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(latestMessage.sentAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Okno chatu */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <>
            <div className="p-4 bg-white border-b border-gray-300">
              <h3 className="font-semibold">
                Chat #{selectedChatId}
              </h3>
            </div>

            {/* Wiadomości */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages
                .filter(msg => msg.chatId === selectedChatId)
                .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
                .map((msg, index) => {
                  const sender = allUsers.get(msg.senderId);
                  const isMyMessage = msg.senderId === user.id;
                  const senderIsAdmin = sender?.roles?.includes('admin');
                  
                  return (
                    <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isMyMessage 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <div className="text-xs opacity-75 mb-1">
                          {sender ? `${sender.firstName} ${sender.surname}` : `User ${msg.senderId}`}
                          {senderIsAdmin ? ' 👑' : ''}
                        </div>
                        <div>{msg.content}</div>
                        <div className="text-xs opacity-75 mt-1">
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
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Napisz wiadomość jako administrator..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  disabled={!connected}
                />
                <button
                  type="submit"
                  disabled={!connected || !messageText.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
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
              <div className="text-lg mb-2">👑 Panel Administratora</div>
              <div>Wybierz chat aby rozpocząć konwersację</div>
              <div className="text-sm mt-2 text-gray-400">
                Widzisz wszystkie chaty w systemie
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}