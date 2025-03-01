
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType } from './AuthTypes';

/**
 * Hook for accessing the authentication context
 * @returns The authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Custom hook for checking if a user is authenticated
 * @returns Whether the user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated, isLoading } = useAuth();
  return isAuthenticated && !isLoading;
};

/**
 * Custom hook for getting user info with loading state
 * @returns User info and loading state
 */
export const useUserInfo = () => {
  const { user, profile, isLoading } = useAuth();
  
  // Combine user and profile data
  const userInfo = user ? {
    id: user.id,
    email: user.email,
    username: profile?.username || user.email?.split('@')[0],
    avatarUrl: profile?.avatar_url,
  } : null;
  
  return {
    userInfo,
    isLoading
  };
};
