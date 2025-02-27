
import { createClient } from '@supabase/supabase-js';

// Default to empty strings but log a warning to help with debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

// Create a dummy client if credentials are missing (for development without Supabase)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signOut: async () => {}
      }
    } as any;

export type User = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
};
