
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContextType } from './AuthTypes';
import { getUserProfile } from './authUtils';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get additional user profile data
          const profileData = await getUserProfile(session.user.id);
          
          setUser({
            ...session.user as User,
            username: profileData?.username,
            avatar_url: profileData?.avatar_url
          });
          setIsGuest(false);
          
          console.log('User authenticated:', session.user.email);
        } else {
          console.log('No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking initial auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        
        if (session?.user) {
          // Get additional user profile data
          const profileData = await getUserProfile(session.user.id);
          
          setUser({
            ...session.user as User,
            username: profileData?.username,
            avatar_url: profileData?.avatar_url
          });
          setIsGuest(false);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
        return { error };
      }
      
      if (data?.user) {
        // Get additional user profile data
        const profileData = await getUserProfile(data.user.id);
        
        setUser({
          ...data.user as User,
          username: profileData?.username,
          avatar_url: profileData?.avatar_url
        });
        setIsGuest(false);
        toast({
          title: "Signed in successfully",
          description: `Welcome back${profileData?.username ? ', ' + profileData.username : ''}!`,
        });
        
        console.log('User signed in successfully:', data.user.email);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);
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
        console.error('Sign up error:', error.message);
        return { error };
      }
      
      if (data?.user) {
        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        });
        console.log('User signed up:', data.user.email);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsGuest(false);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/auth');
      console.log('User signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    setUser(null);
    setIsGuest(true);
    toast({
      title: "Guest mode",
      description: "You're browsing as a guest. Some features may be limited.",
    });
    console.log('Continuing as guest');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        signIn,
        signUp,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Re-export the useAuth hook
export { useAuth } from './useAuth';
