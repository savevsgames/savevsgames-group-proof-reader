
import { supabase } from '@/lib/supabase';

/**
 * Helper function to get user profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, created_at')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
};
