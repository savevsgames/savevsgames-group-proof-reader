
import { User } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any } | undefined>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any } | null>;
}
