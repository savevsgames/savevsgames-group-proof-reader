
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '@/lib/authUtils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean; 
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Checking initial session');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('[AuthContext] Found existing session', session.user);
          setUser(session.user as User);
          setIsGuest(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error checking initial auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[AuthContext] Auth state changed', { event: _event, user: session?.user });
        if (session?.user) {
          setUser(session.user as User);
          setIsGuest(false);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Clean up subscription
    return () => {
      console.log('[AuthContext] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] SignIn attempt', { email });
    try {
      const { data, error } = await authSignIn(email, password);
      
      if (error) {
        console.log('[AuthContext] SignIn error', error);
        return { error };
      }
      
      if (data?.user) {
        setUser(data.user as User);
        setIsGuest(false);
        toast({
          title: "Signed in successfully",
          description: `Welcome back${data.user.email ? ', ' + data.user.email : ''}!`,
        });
      }
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Error during sign in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('[AuthContext] SignUp attempt', { email, username });
    try {
      const { data, error } = await authSignUp(email, password, username);
      
      if (error) {
        console.log('[AuthContext] SignUp error', error);
        return { error };
      }
      
      if (data?.user) {
        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        });
      }
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Error during sign up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] SignOut attempt');
    try {
      await authSignOut();
      setUser(null);
      setIsGuest(false);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('[AuthContext] Error during sign out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const continueAsGuest = () => {
    console.log('[AuthContext] Continuing as guest');
    setUser(null);
    setIsGuest(true);
    toast({
      title: "Guest mode",
      description: "You're browsing as a guest. Some features may be limited.",
    });
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
