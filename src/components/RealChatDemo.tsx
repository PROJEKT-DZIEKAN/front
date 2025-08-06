'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import ChatApp from './ChatApp';

export default function RealChatDemo() {
  const { user, isAuthenticated, loginWithUserId, logout } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<number>(1);

  // Prawdziwi użytkownicy z Twojego backendu
  const realUsers = [
    { id: 1, name: 'User ID 1', description: 'Pierwszy użytkownik' },
    { id: 2, name: 'User ID 2', description: 'Drugi użytkownik' },
    { id: 3, name: 'User ID 3', description: 'Trzeci użytkownik' },
    { id: 4, name: 'User ID 4', description: 'Czwarty użytkownik' },
    { id: 5, name: 'User ID 5', description: 'Piąty użytkownik' },
  ];

  const handleLogin = async () => {
    const success = await loginWithUserId(selectedUserId);
    if (!success) {
      alert('Błąd logowania - sprawdź czy użytkownik istnieje w bazie danych');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div>
        <div className="bg-gray-100 p-4 border-b">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600">Zalogowany jako: </span>
                <span className="font-medium">{user.firstName} {user.surname}</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  ID: {user.id}
                </span>
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {user.roles?.includes('admin') ? 'Administrator' : 'Użytkownik'}
                </span>
              </div>
              
              {/* Status połączenia WebSocket */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Połączony z backendem</span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Wyloguj
            </button>
          </div>
        </div>
        
        <ChatApp />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Prawdziwy Chat System
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">🔗 Połączenie z backendem:</h3>
        <p className="text-sm text-blue-700">
          <strong>URL:</strong> https://dziekan-backend-ywfy.onrender.com
        </p>
        <p className="text-sm text-blue-700">
          <strong>WebSocket:</strong> /ws-chat
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wybierz User ID do logowania:
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          {realUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.description}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600 transition-colors font-medium"
      >
        Zaloguj jako User ID {selectedUserId}
      </button>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-3 text-gray-800">📋 Instrukcje testowania:</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Zaloguj się jako <strong>admin</strong> (jeśli user ma role admin)</li>
          <li>W drugim oknie/urządzeniu zaloguj się jako <strong>zwykły user</strong></li>
          <li>User może utworzyć chat z adminem</li>
          <li>Admin widzi wszystkie chaty w systemie</li>
          <li>Wiadomości są synchronizowane przez WebSocket</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded">
        <h3 className="font-medium mb-2 text-yellow-800">⚠️ Wymagania backendu:</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Endpoint <code>/api/chats</code></li>
          <li>Endpoint <code>/api/chats/get-or-create</code></li>
          <li>Endpoint <code>/api/users</code></li>
          <li>WebSocket <code>/ws-chat</code> z STOMP</li>
          <li>Autoryzacja przez Bearer token</li>
        </ul>
      </div>
    </div>
  );
}