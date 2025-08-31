'use client';

import Card from '../ui/Card';

interface ChatEmptyStateProps {
  isAdmin: boolean;
  chatsCount: number;
}

export default function ChatEmptyState({ isAdmin, chatsCount }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <Card className="text-center py-8">
        <div className="text-6xl mb-4">💬</div>
        <div className="text-lg mb-2">
          {isAdmin ? 'Panel Organizatora' : 'Chat z Organizatorami'}
        </div>
        <div className="mb-4">
          {chatsCount === 0 ? 
            (isAdmin ? 'Brak aktywnych chatów' : 'Kliknij "Nowy Chat" aby rozpocząć') : 
            'Wybierz chat aby kontynuować konwersację'
          }
        </div>
        <div className="text-sm text-gray-400">
          {isAdmin ? 'Czekasz na wiadomości od użytkowników' : 'Organizatorzy są dostępni aby Ci pomóc'}
        </div>
      </Card>
    </div>
  );
}
