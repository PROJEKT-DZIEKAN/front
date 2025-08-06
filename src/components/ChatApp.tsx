'use client';

import { useAuth } from '@/hooks/useAuth';
import AdminChatPanel from './AdminChatPanel';
import ChatWithOrganizers from './ChatWithOrganizers';

export default function ChatApp() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl mb-4">Musisz być zalogowany</div>
          <div className="text-gray-500">Zaloguj się aby korzystać z chatu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {isAdmin ? <AdminChatPanel /> : <ChatWithOrganizers />}
    </div>
  );
}