'use client';

import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  
  return {
    token: context.token,
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isAdmin: context.isAdmin,
    loginWithUserId: context.loginWithUserId,
    login: context.login,
    logout: context.logout,
    loading: context.isLoading
  };
};