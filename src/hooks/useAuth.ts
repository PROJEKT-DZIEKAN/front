'use client';

import { useUser } from '@/context/UserContext';

// Hook inspirowany kodem Java - wykorzystuje istniejący UserContext
export const useAuth = () => {
  const context = useUser();
  
  return {
    token: null, // Można dodać export tokenu z UserContext jeśli potrzeba
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isAdmin: context.isAdmin,
    login: context.loginWithUserId,
    logout: context.logout,
    loading: context.isLoading
  };
};