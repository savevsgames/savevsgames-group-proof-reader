
import { supabase } from "@/lib/supabase";

export interface ImageData {
  id: string;
  image_url: string;
  status: 'pending' | 'generating' | 'uploading' | 'completed' | 'error';
  error_message?: string;
  request_id?: string;
  attempt_count?: number;
}

// Extract image prompt from the text if it exists
export const extractImagePrompt = (text: string): string | null => {
  const imageMarker = "IMAGE:";
  if (text.includes(imageMarker)) {
    const startIndex = text.indexOf(imageMarker) + imageMarker.length;
    let endIndex = text.indexOf("\n", startIndex);
    if (endIndex === -1) endIndex = text.length;
    return text.substring(startIndex, endIndex).trim();
  }
  return null;
};

// Fetch existing image data from Supabase
export const fetchImageData = async (storyId: string, nodeId: string): Promise<ImageData | null> => {
  try {
    const { data, error } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

// Generate a new image via Supabase Edge Function
export const generateNewImage = async (
  storyId: string, 
  nodeId: string, 
  pageNumber: number, 
  prompt: string
): Promise<ImageData | null> => {
  try {
    const response = await supabase.functions.invoke('generate-story-image', {
      body: {
        storyId,
        nodeId,
        pageNumber,
        prompt,
      },
    });
    
    if (!response || !response.data) {
      throw new Error('No response received from image generation service');
    }
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate image');
    }
    
    return response.data.image;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};
