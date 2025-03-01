
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pakmcaxaxyvhjdddfpdh.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha21jYXhheHl2aGpkZGRmcGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODg1NjksImV4cCI6MjA1NjI2NDU2OX0.00F3C-SjlKk2mBtvw-Zfa74ykFLgnVFpRwoJlUvBKSc";

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
};

// Get the public URL for an avatar
export function getAvatarUrl(userId: string, fileName: string): string {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/${fileName}`);
  
  return data.publicUrl;
}

// Upload an avatar for a user
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: null, error: new Error('File must be an image') };
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { url: null, error: new Error('File size must be less than 2MB') };
    }
    
    // Generate a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
      
    if (uploadError) {
      return { url: null, error: uploadError };
    }
    
    // Get the public URL
    const url = getAvatarUrl(userId, fileName);
    
    // Update the user's profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId);
      
    if (updateError) {
      return { url, error: updateError };
    }
    
    return { url, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { url: null, error: error as Error };
  }
}

// Delete a user's avatar
export async function deleteAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ error: Error | null }> {
  try {
    // Extract file name from URL
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${userId}/${fileName}`;
    
    // Delete the file
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
      
    if (deleteError) {
      return { error: deleteError };
    }
    
    // Update the user's profile to remove the avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);
      
    if (updateError) {
      return { error: updateError };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return { error: error as Error };
  }
}
