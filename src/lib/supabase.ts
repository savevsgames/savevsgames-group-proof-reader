
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pakmcaxaxyvhjdddfpdh.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha21jYXhheHl2aGpkZGRmcGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODg1NjksImV4cCI6MjA1NjI2NDU2OX0.00F3C-SjlKk2mBtvw-Zfa74ykFLgnVFpRwoJlUvBKSc";

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AppUser type for our simplified user representation
export type AppUser = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
};
