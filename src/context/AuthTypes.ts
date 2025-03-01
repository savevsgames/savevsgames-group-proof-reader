
import { User } from '@/lib/supabase';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any } | undefined>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}
