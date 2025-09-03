'use client';

import { useAuth } from '@/hooks/useAuth';
import ChatWithOrganizers from './ChatWithOrganizers';
import AdminChatPanel from './AdminChatPanel';

const ChatApp = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Musisz być zalogowany</h3>
          <p className="text-gray-600">Zaloguj się aby korzystać z chatu</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <AdminChatPanel /> : <ChatWithOrganizers />;
};

export default ChatApp;