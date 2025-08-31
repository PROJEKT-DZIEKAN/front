'use client';

import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface ChatHeaderProps {
  user: {
    firstName: string;
    surname: string;
  } | null;
  connected: boolean;
  mockMode: boolean;
  isAdmin: boolean;
  onStartSupport: () => void;
}

export default function ChatHeader({ 
  user, 
  connected, 
  mockMode, 
  isAdmin, 
  onStartSupport 
}: ChatHeaderProps) {
  return (
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
            <Button
              onClick={onStartSupport}
              disabled={!connected}
              variant="primary"
              icon={<PaperAirplaneIcon className="h-4 w-4" />}
            >
              Nowy Chat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
