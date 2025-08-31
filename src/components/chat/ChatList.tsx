'use client';



interface User {
  id: number;
  firstName: string;
  surname: string;
  roles?: (string | { roleName?: string })[];
}

interface Message {
  chatId: number;
  content: string;
  sentAt: string;
}

interface Chat {
  id: number;
  userAId: number;
  userBId: number;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId: number | null;
  isAdmin: boolean;
  allUsers: Map<number, User>;
  chatMessages: Message[];
  user: User | null;
  onSelectChat: (chatId: number) => void;
  getChatAdmin: (chat: Chat) => User | null | undefined;
  getLatestMessage: (chatId: number) => Message | undefined;
}

export default function ChatList({
  chats,
  selectedChatId,
  isAdmin,
  onSelectChat,
  getChatAdmin,
  getLatestMessage
}: ChatListProps) {
  if (chats.length === 0) return null;

  return (
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
              onClick={() => onSelectChat(chat.id)}
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
  );
}
