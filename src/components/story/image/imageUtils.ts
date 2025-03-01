
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
    console.log('Calling image generation with params:', { storyId, nodeId, pageNumber, prompt });
    
    const response = await supabase.functions.invoke('generate-story-image', {
      body: {
        storyId,
        nodeId,
        pageNumber,
        prompt,
      },
    });
    
    // Check if the response exists
    if (!response) {
      console.error('No response received from image generation service');
      throw new Error('No response received from image generation service');
    }
    
    // Log the full response for debugging
    console.log('Image generation raw response:', response);
    
    // Check for error status
    if (response.error) {
      console.error('Error from image generation service:', response.error);
      throw new Error(response.error.message || 'Error from image generation service');
    }
    
    // Check if data exists
    if (!response.data) {
      console.error('No data in response from image generation service');
      throw new Error('No data received from image generation service');
    }
    
    // Check for failure in the data
    if (response.data.success === false) {
      console.error('Image generation failed:', response.data.error, response.data.details);
      throw new Error(response.data.error || response.data.details || 'Failed to generate image');
    }
    
    // Return the image data
    return response.data.image;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};
