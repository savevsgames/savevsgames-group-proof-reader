
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openAIKey = Deno.env.get('OPENAI_API_KEY') || '';

// Supabase client with admin rights
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create a function to normalize node IDs to ensure consistency
function normalizeNodeId(nodeId: string): string {
  // If the node ID starts with "fragment_", ensure we're consistent with it
  return nodeId.trim();
}

// Helper function to clean up old image records
async function cleanupStuckImageRecords(bookId: string, normalizedNodeId: string): Promise<void> {
  try {
    console.log(`Cleaning up stuck image records for book ${bookId}, node ${normalizedNodeId}`);
    
    // Find any records stuck in generating or uploading state for this node
    const { data: stuckRecords, error: findError } = await supabase
      .from('story_images')
      .select('id, status, created_at')
      .eq('book_id', bookId)
      .eq('story_node', normalizedNodeId)
      .in('status', ['generating', 'uploading', 'pending'])
      .order('created_at', { ascending: false });
      
    if (findError) {
      console.error(`Error finding stuck records: ${findError.message}`);
      return;
    }
    
    // If we found stuck records, clean them up
    if (stuckRecords && stuckRecords.length > 0) {
      console.log(`Found ${stuckRecords.length} stuck records to clean up`);
      
      for (const record of stuckRecords) {
        // Records older than 10 minutes are definitely stuck
        const recordAge = Date.now() - new Date(record.created_at).getTime();
        const isStuck = recordAge > 10 * 60 * 1000; // 10 minutes in milliseconds
        
        if (isStuck) {
          console.log(`Cleaning up stuck record ${record.id} (status: ${record.status})`);
          
          // Update the record to error state
          const { error: updateError } = await supabase
            .from('story_images')
            .update({
              status: 'error',
              error_message: 'Operation timed out or was interrupted',
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);
            
          if (updateError) {
            console.error(`Error updating stuck record ${record.id}: ${updateError.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error in cleanupStuckImageRecords: ${err.message}`);
    // We don't throw here because this is a cleanup function that shouldn't
    // block the main operation if it fails
  }
}

// Helper function to safely remove an image from storage without crashing if it doesn't exist
async function safelyRemoveImageFromStorage(imagePath: string): Promise<boolean> {
  try {
    if (!imagePath) return false;
    
    // Extract the filename from the full URL
    const url = new URL(imagePath);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (!filename) return false;
    
    console.log(`Attempting to remove image file: ${filename}`);
    
    const { error } = await supabase
      .storage
      .from('images')
      .remove([filename]);
      
    if (error) {
      // If it's just not found, that's fine
      if (error.message.includes('Not Found')) {
        console.log(`Image file ${filename} not found, continuing anyway`);
        return true;
      }
      
      console.error(`Error removing image file ${filename}: ${error.message}`);
      return false;
    }
    
    console.log(`Successfully removed image file: ${filename}`);
    return true;
  } catch (err) {
    console.error(`Error in safelyRemoveImageFromStorage: ${err.message}`);
    // We don't throw here because failing to remove an old image
    // shouldn't prevent us from generating a new one
    return false;
  }
}

// Function to handle image generation through OpenAI
async function generateImageWithOpenAI(prompt: string, qualitySettings: any): Promise<string> {
  console.log(`Generating image with prompt: ${prompt.substring(0, 50)}...`);
  console.log(`Quality settings: ${JSON.stringify(qualitySettings)}`);
  
  // Validate the quality settings before sending to OpenAI
  const validatedQuality = qualitySettings.quality === 'high' ? 'hd' : qualitySettings.quality;
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: qualitySettings.size || '1024x1024',
        quality: validatedQuality || 'hd',  // Use only 'standard' or 'hd'
        style: qualitySettings.style || 'vivid'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: Status ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('OpenAI API returned unexpected data structure');
    }
    
    return data.data[0].url;
  } catch (error) {
    console.error(`Error in generateImageWithOpenAI: ${error.message}`);
    throw error;
  }
}

// Handler for the actual HTTP request
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const { storyId, nodeId, pageNumber, prompt, forceRegenerate } = await req.json();
    
    // Validate required parameters
    if (!storyId || !nodeId || !pageNumber || !prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters',
          details: 'storyId, nodeId, pageNumber, and prompt are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Processing image generation request for story ${storyId}, node ${nodeId}, page ${pageNumber}`);
    console.log(`Force regenerate: ${forceRegenerate}`);
    
    // Normalize the node ID to ensure consistency
    const normalizedNodeId = normalizeNodeId(nodeId);
    
    // First, clean up any stuck records to prevent conflicts
    await cleanupStuckImageRecords(storyId, normalizedNodeId);
    
    // Check if an image already exists for this story node
    const { data: existingImage, error: findError } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', normalizedNodeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (findError) {
      console.error(`Error finding existing image: ${findError.message}`);
      throw new Error(`Database error: ${findError.message}`);
    }
    
    // If an image exists and we're not forcing regeneration, return it
    if (existingImage && existingImage.status === 'completed' && !forceRegenerate) {
      console.log(`Found existing completed image ${existingImage.id} for node ${normalizedNodeId}, returning it`);
      return new Response(
        JSON.stringify({
          success: true,
          image: existingImage
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get image generation settings
    const { data: settings, error: settingsError } = await supabase
      .from('book_llm_settings')
      .select('image_generation_settings')
      .eq('book_id', storyId)
      .maybeSingle();
      
    if (settingsError) {
      console.error(`Error fetching image generation settings: ${settingsError.message}`);
      throw new Error(`Settings error: ${settingsError.message}`);
    }
    
    // Use default settings if none found
    const imageSettings = settings?.image_generation_settings || {
      base_style: 'High-detail pixel art in a fantasy style',
      quality_settings: {
        quality: 'hd',
        style: 'vivid',
        size: '1024x1024'
      }
    };
    
    // Create an enhanced prompt combining base style with user prompt
    const baseStyle = imageSettings.base_style || '';
    const enhancedPrompt = `${baseStyle}, ${prompt}`;
    console.log(`Enhanced prompt created: ${enhancedPrompt.substring(0, 100)}...`);
    
    // 1. Create or update the image record with 'generating' status
    let imageRecord;
    
    if (existingImage) {
      // Update existing record
      const newAttemptCount = (existingImage.attempt_count || 1) + 1;
      console.log(`Updating existing image record ${existingImage.id} for regeneration (attempt ${newAttemptCount})`);
      
      const { data: updatedRecord, error: updateError } = await supabase
        .from('story_images')
        .update({
          status: 'generating',
          image_prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          attempt_count: newAttemptCount,
          error_message: null,
          image_url: null,  // Clear the existing URL since we're regenerating
          updated_at: new Date().toISOString()
        })
        .eq('id', existingImage.id)
        .select('*')
        .single();
        
      if (updateError) {
        console.error(`Error updating image record: ${updateError.message}`);
        throw new Error(`Database error: ${updateError.message}`);
      }
      
      imageRecord = updatedRecord;
      
      // If we're forcing regeneration and there's an existing image URL,
      // try to remove the old image from storage
      if (forceRegenerate && existingImage.image_url) {
        await safelyRemoveImageFromStorage(existingImage.image_url);
      }
    } else {
      // Create new record
      console.log(`Creating new image record for node ${normalizedNodeId}`);
      
      const { data: newRecord, error: insertError } = await supabase
        .from('story_images')
        .insert({
          book_id: storyId,
          story_node: normalizedNodeId,
          page_number: pageNumber,
          image_prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          status: 'generating',
          attempt_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
        
      if (insertError) {
        console.error(`Error creating image record: ${insertError.message}`);
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      imageRecord = newRecord;
    }
    
    // Start the image generation process asynchronously to avoid timeout
    // We'll return the initial record first, then update it in the background
    const generationPromise = (async () => {
      try {
        // Generate the image with OpenAI
        const imageUrl = await generateImageWithOpenAI(enhancedPrompt, imageSettings.quality_settings);
        
        // Update the record with the completed status and image URL
        const { error: completeError } = await supabase
          .from('story_images')
          .update({
            status: 'completed',
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', imageRecord.id);
          
        if (completeError) {
          console.error(`Error updating completed image: ${completeError.message}`);
          throw completeError;
        }
        
        console.log(`Image generation completed successfully for ${imageRecord.id}`);
      } catch (error) {
        console.error(`Error in background image generation: ${error.message}`);
        
        // Update the record with the error status
        const { error: errorUpdateError } = await supabase
          .from('story_images')
          .update({
            status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', imageRecord.id);
          
        if (errorUpdateError) {
          console.error(`Error updating error status: ${errorUpdateError.message}`);
        }
      }
    })();
    
    // We don't await the promise - instead, we return the initial record immediately
    // The background process will update the database when done
    return new Response(
      JSON.stringify({
        success: true,
        image: imageRecord
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error(`Error in generate-story-image function: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
