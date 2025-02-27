
import { createClient } from '@supabase/supabase-js';

// Default to empty strings but log a warning to help with debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

// Mock functions for the database client when credentials are missing
const mockFrom = (table: string) => {
  return {
    select: (columns?: string, options?: any) => ({
      eq: () => ({
        eq: () => mockFrom(table),
        order: () => mockFrom(table),
        then: async () => ({ data: [], error: null, count: 0 })
      }),
      order: () => mockFrom(table),
      then: async () => ({ data: [], error: null, count: 0 })
    }),
    insert: () => ({
      then: async () => ({ data: null, error: null })
    }),
    update: () => ({
      eq: () => ({
        eq: () => ({
          then: async () => ({ data: null, error: null })
        })
      }),
      then: async () => ({ data: null, error: null })
    }),
    delete: () => ({
      eq: () => ({
        eq: () => ({
          then: async () => ({ data: null, error: null })
        })
      }),
      then: async () => ({ data: null, error: null })
    }),
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    count: async (columnName?: string, opts?: any) => ({ count: 0, error: null }),
  };
};

// Create a real client if credentials exist, otherwise use a mock client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signOut: async () => {}
      },
      from: (table: string) => mockFrom(table)
    } as any;

export type User = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
};
