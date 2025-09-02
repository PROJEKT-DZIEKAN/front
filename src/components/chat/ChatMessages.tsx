'use client';

import { forwardRef } from 'react';

interface User {
  id: number;
  firstName: string;
  surname: string;
  roles?: (string | { roleName?: string })[];
}

interface Message {
  chatId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

interface ChatMessagesProps {
  messages: Message[];
  selectedChatId: number | null;
  allUsers: Map<number, User>;
  user: User | null;
}

const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(({
  messages,
  selectedChatId,
  allUsers,
  user
}, ref) => {
  const filteredMessages = messages
    .filter(msg => msg.chatId === selectedChatId)
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

  return (
    <div className="p-4 space-y-3 bg-gray-50 h-full overflow-y-auto overflow-x-hidden">
      {filteredMessages.map((msg, index) => {
        const sender = allUsers.get(msg.senderId);
        const isMyMessage = msg.senderId === user?.id;
        const senderIsAdmin = sender?.roles?.includes('admin') || 
                  sender?.roles?.some((role: string | { roleName?: string }) => 
                    typeof role === 'object' && role?.roleName === 'admin'
                  );
        
        return (
          <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`chat-message max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
              isMyMessage 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <div className="text-xs opacity-75 mb-1 font-medium">
                {isMyMessage ? 'Ty' : (senderIsAdmin ? '👑 Organizator' : 'Użytkownik')}
              </div>
              <div className="leading-relaxed break-words">{msg.content}</div>
              <div className="text-xs opacity-75 mt-2">
                {new Date(msg.sentAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={ref} />
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
