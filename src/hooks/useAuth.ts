'use client';

import { useUser } from '@/context/UserContext';

// Hook inspirowany kodem Java - wykorzystuje istniejący UserContext
export const useAuth = () => {
  const context = useUser();
  
  // Debug logging
  console.log('🔑 useAuth debug:', {
    token: !!context.token,
    tokenLength: context.token?.length,
    user: !!context.user,
    userId: context.user?.id,
    isAuthenticated: context.isAuthenticated,
    isAdmin: context.isAdmin
  });
  
  return {
    token: context.token, // Teraz poprawnie zwracam token z UserContext
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isAdmin: context.isAdmin,
    login: context.loginWithUserId,
    logout: context.logout,
    loading: context.isLoading
  };
};