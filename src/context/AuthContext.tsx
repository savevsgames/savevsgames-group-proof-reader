
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';
import { AuthContextType, AuthState, UserProfile } from './AuthTypes';
import { getUserProfile, updateUserProfile, formatAuthError } from './authUtils';
import { toast } from "sonner";

// Create auth context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial auth state
const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  error: null
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Function to update state to avoid repetition
  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Function to refresh user profile data
  const refreshUserProfile = useCallback(async () => {
    if (!state.user) return;
    
    try {
      const profileData = await getUserProfile(state.user.id);
      
      if (profileData) {
        updateState({ 
          profile: profileData,
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }, [state.user]);

  // Initialize auth state on mount
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        updateState({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get additional user profile data
          const profileData = await getUserProfile(session.user.id);
          
          updateState({
            user: session.user as User,
            profile: profileData,
            isAuthenticated: true,
            isGuest: false,
            error: null
          });
          
          console.log('User authenticated:', session.user.email);
        } else {
          console.log('No active session found');
          updateState({
            user: null,
            profile: null,
            isAuthenticated: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error checking initial auth session:', error);
        updateState({
          user: null,
          profile: null,
          isAuthenticated: false,
          error: 'Failed to check authentication status'
        });
      } finally {
        updateState({ isLoading: false });
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        
        updateState({ isLoading: true });
        
        if (session?.user) {
          // Get additional user profile data
          const profileData = await getUserProfile(session.user.id);
          
          updateState({
            user: session.user as User,
            profile: profileData,
            isAuthenticated: true,
            isGuest: false,
            error: null
          });
        } else {
          updateState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isGuest: false
          });
        }
        
        updateState({ isLoading: false });
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const errorMessage = formatAuthError(error);
        updateState({ error: errorMessage });
        
        toast.error("Sign in failed: " + errorMessage);
        
        console.error('Sign in error:', error.message);
        return { error };
      }
      
      if (data?.user) {
        // Get additional user profile data
        const profileData = await getUserProfile(data.user.id);
        
        updateState({
          user: data.user as User,
          profile: profileData,
          isAuthenticated: true,
          isGuest: false
        });
        
        toast.success("Signed in successfully" + (profileData?.username ? ', ' + profileData.username : '') + "!");
        
        console.log('User signed in successfully:', data.user.email);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      updateState({ error: 'An unexpected error occurred' });
      return { error };
    } finally {
      updateState({ isLoading: false });
    }
  };

  // Sign up with email, password, and username
  const signUp = async (email: string, password: string, username: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) {
        const errorMessage = formatAuthError(error);
        updateState({ error: errorMessage });
        
        toast.error("Sign up failed: " + errorMessage);
        
        console.error('Sign up error:', error.message);
        return { error };
      }
      
      if (data?.user) {
        toast.success("Account created. Please check your email to verify your account.");
        console.log('User signed up:', data.user.email);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      updateState({ error: 'An unexpected error occurred' });
      return { error };
    } finally {
      updateState({ isLoading: false });
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      updateState({ isLoading: true });
      await supabase.auth.signOut();
      
      updateState({
        user: null,
        profile: null,
        isAuthenticated: false,
        isGuest: false,
        error: null
      });
      
      toast.success("You have been signed out successfully.");
      
      console.log('User signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
      
      toast.error("There was an error signing out. Please try again.");
      
      updateState({ error: 'Failed to sign out' });
    } finally {
      updateState({ isLoading: false });
    }
  };

  // Continue as guest
  const continueAsGuest = () => {
    updateState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isGuest: true,
      error: null
    });
    
    toast.info("You're browsing as a guest. Some features may be limited.");
    
    console.log('Continuing as guest');
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { error: new Error('No user is logged in') };
    }
    
    try {
      const { error } = await updateUserProfile(state.user.id, updates);
      
      if (error) {
        toast.error("Update failed: " + error.message);
        return { error };
      }
      
      // Refresh profile after update
      await refreshUserProfile();
      
      toast.success("Your profile has been updated successfully.");
      
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      
      toast.error("An unexpected error occurred. Please try again.");
      
      return { error };
    }
  };

  // Combine state and functions for context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    continueAsGuest,
    refreshUserProfile,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
