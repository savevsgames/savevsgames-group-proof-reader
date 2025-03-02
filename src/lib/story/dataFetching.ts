
import { supabase, validateImageQualitySettings, DEFAULT_IMAGE_QUALITY_SETTINGS } from '../supabase';

// Fetch comment count for a position - updated to use page number
export const fetchCommentCount = async (storyId: string, position: number) => {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('story_id', storyId)
    .eq('story_position', position);
  
  if (error) {
    throw error;
  }
  
  return count || 0;
};

// Fetch comments for a specific story position
export const fetchComments = async (storyId: string, storyPosition: number) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(username)
      `)
      .eq('story_id', storyId)
      .eq('story_position', storyPosition)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    // Handle the case where some comments might have 'content' field instead of 'text'
    return (data || []).map(comment => ({
      ...comment,
      text: comment.text || comment.content || '',
    }));
  } catch (error) {
    console.error('Error in fetchComments:', error);
    return [];
  }
};

// Fetch book details from database
export const fetchBookDetails = async (storyId: string) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', storyId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch book details: ${error.message}`);
  }

  if (!data) {
    throw new Error('Book not found');
  }

  return data;
};

// Fetch image generation settings from the database
export const fetchImageGenerationSettings = async (storyId: string) => {
  try {
    const { data, error } = await supabase
      .from('book_llm_settings')
      .select('image_generation_settings')
      .eq('book_id', storyId)
      .single();
      
    if (error) {
      console.error('Error fetching image settings:', error);
      return {
        base_style: 'High-detail pixel art in a fantasy style',
        quality_settings: DEFAULT_IMAGE_QUALITY_SETTINGS
      };
    }
    
    if (!data || !data.image_generation_settings) {
      return {
        base_style: 'High-detail pixel art in a fantasy style',
        quality_settings: DEFAULT_IMAGE_QUALITY_SETTINGS
      };
    }
    
    // Validate the quality settings from the database
    const settings = data.image_generation_settings;
    const validatedSettings = {
      base_style: settings.base_style || 'High-detail pixel art in a fantasy style',
      quality_settings: validateImageQualitySettings(settings.quality_settings)
    };
    
    return validatedSettings;
  } catch (error) {
    console.error('Error in fetchImageGenerationSettings:', error);
    return {
      base_style: 'High-detail pixel art in a fantasy style',
      quality_settings: DEFAULT_IMAGE_QUALITY_SETTINGS
    };
  }
};

// Fetch story content from URL
export const fetchStoryContent = async (storyUrl: string) => {
  const response = await fetch(storyUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch story content: ${response.statusText}`);
  }
  
  return await response.json();
};
