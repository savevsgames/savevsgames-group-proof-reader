import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

// Log helper function
const logAuth = (action: string, details?: any) => {
  console.log(`[Auth] ${action}`, details || '');
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    logAuth('Get current user', session?.user || null);
    return session?.user as User || null;
  } catch (error) {
    logAuth('Error getting current user', error);
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  logAuth('Sign in attempt', { email });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logAuth('Sign in error', error);
      return { error };
    }
    
    logAuth('Sign in successful', data.user);
    return { data, error: null };
  } catch (error) {
    logAuth('Exception during sign in', error);
    return { error };
  }
};

export const signUp = async (email: string, password: string, username: string) => {
  logAuth('Sign up attempt', { email, username });
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/verify`,
      },
    });
    
    if (error) {
      logAuth('Sign up error', error);
      return { error };
    }
    
    logAuth('Sign up successful', data.user);
    return { data, error: null };
  } catch (error) {
    logAuth('Exception during sign up', error);
    return { error };
  }
};

export const signOut = async () => {
  logAuth('Sign out attempt');
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logAuth('Sign out error', error);
      throw error;
    }
    logAuth('Sign out successful');
  } catch (error) {
    logAuth('Exception during sign out', error);
    toast({
      title: "Sign out failed",
      description: "There was an error signing out. Please try again.",
      variant: "destructive",
    });
  }
};

export const uploadAvatar = async (file: File, userId: string) => {
  logAuth('Avatar upload attempt', { userId, fileName: file.name });
  
  if (!file) {
    logAuth('Avatar upload error', 'No file provided');
    return { error: 'No file provided' };
  }
  
  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;
  
  try {
    // Upload image to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
      
    if (uploadError) {
      logAuth('Avatar upload error', uploadError);
      return { error: uploadError };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
      
    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);
      
    if (updateError) {
      logAuth('Profile update error', updateError);
      return { error: updateError };
    }
    
    logAuth('Avatar upload and profile update successful', { url: publicUrl });
    return { publicUrl, error: null };
  } catch (error) {
    logAuth('Exception during avatar upload', error);
    return { error };
  }
};

export const getUserProfile = async (userId: string) => {
  logAuth('Get user profile attempt', { userId });
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      logAuth('Get user profile error', error);
      return { error };
    }
    
    logAuth('Get user profile successful', data);
    return { profile: data, error: null };
  } catch (error) {
    logAuth('Exception during get user profile', error);
    return { error };
  }
};
