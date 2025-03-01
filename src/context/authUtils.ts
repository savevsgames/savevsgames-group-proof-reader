
import { supabase } from '@/lib/supabase';
import { UserProfile } from './AuthTypes';

/**
 * Helper function to get user profile data
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, email, created_at')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
};

/**
 * Helper function to update user profile data
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Exception updating profile:', error);
    return { error };
  }
};

/**
 * Helper function to check if a user is authenticated
 */
export const isUserAuthenticated = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Helper function to format auth error messages
 */
export const formatAuthError = (error: any): string => {
  if (!error) return '';
  
  // Handle common auth errors with user-friendly messages
  const errorMessage = error.message || 'An authentication error occurred';
  
  if (errorMessage.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in';
  }
  
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Incorrect email or password';
  }
  
  if (errorMessage.includes('User already registered')) {
    return 'An account with this email already exists';
  }
  
  return errorMessage;
};
