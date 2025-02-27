
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if user was a guest before
    const storedGuest = localStorage.getItem('isGuest');
    if (storedGuest === 'true') {
      setIsGuest(true);
    }

    // Check for session on load
    const getSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user as User);
        }
      } catch (err) {
        console.error('Failed to get session:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Auth state changed: ${event}`);
        setSession(session);
        setUser(session?.user as User || null);
        setLoading(false);
      });

      return () => {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    } catch (err) {
      console.error('Failed to setup auth listener:', err);
      setLoading(false);
      return () => {};
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        setIsGuest(false);
        localStorage.removeItem('isGuest');
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      if (!error) {
        setIsGuest(false);
        localStorage.removeItem('isGuest');
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsGuest(false);
      localStorage.removeItem('isGuest');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
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
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
