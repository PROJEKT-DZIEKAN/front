'use client';

import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useEvents } from './EventContext';
import { AuthContextType } from '@/types/auth';
import { EventContextType } from '@/types/event';

// Łączymy typy z obu kontekstów
interface UserContextType extends AuthContextType, EventContextType {}

// Re-exportujemy eventBus dla kompatybilności
export { eventBus } from '@/utils/eventBus';

export function UserProvider({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}

// Hook useUser dla kompatybilności wstecznej
export function useUser() {
  const authContext = useAuth();
  const eventContext = useEvents();

  return {
    ...authContext,
    ...eventContext
  };
}