'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import ChatApp from './ChatApp';

export default function ChatDemo() {
  const { user, isAuthenticated, loginWithUserId, logout } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<number>(1);

  // Mock użytkownicy do testowania
  const mockUsers = [
    { id: 1, name: 'Admin Główny', role: 'admin' },
    { id: 2, name: 'Anna Kowalska (Admin)', role: 'admin' },
    { id: 3, name: 'Jan Nowak (User)', role: 'user' },
    { id: 4, name: 'Maria Wiśniewska (User)', role: 'user' },
  ];

  const handleLogin = async () => {
    const success = await loginWithUserId(selectedUserId);
    if (!success) {
      alert('Błąd logowania');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div>
        <div className="bg-gray-100 p-4 border-b">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div>
              <span className="text-sm text-gray-600">Zalogowany jako: </span>
              <span className="font-medium">{user.firstName} {user.surname}</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user.roles?.includes('admin') ? 'Administrator' : 'Użytkownik'}
              </span>
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
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Demo Systemu Chatów</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wybierz użytkownika:
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          {mockUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Zaloguj jako {mockUsers.find(u => u.id === selectedUserId)?.name}
      </button>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Funkcjonalności:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Administratorzy</strong> - widzą wszystkie chaty</li>
          <li>• <strong>Użytkownicy</strong> - mogą rozmawiać tylko z adminami</li>
          <li>• Automatyczne odpowiedzi (mock)</li>
          <li>• Kontrola uprawnień</li>
          <li>• Responsywny interfejs</li>
        </ul>
      </div>
    </div>
  );
}