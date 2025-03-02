
// Import necessary dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enable cross-origin resource sharing (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Create a Supabase client for database operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle requests to this edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { storyId, nodeId, pageNumber, prompt } = requestData;
    
    console.log('Received image generation request:', { storyId, nodeId, pageNumber, promptLength: prompt?.length });
    
    // Validate required parameters
    if (!storyId || !nodeId || !prompt) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters',
          details: `Required: storyId, nodeId, prompt. Received: ${JSON.stringify({ storyId, nodeId, prompt: prompt ? 'present' : 'missing' })}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if an image record already exists
    const { data: existingImage, error: fetchError } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing image:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    // Get attempt count from existing record or start at 1
    const attemptCount = existingImage ? (existingImage.attempt_count || 0) + 1 : 1;
    
    // Create/update the image entry in 'pending' status
    const imageRecord = {
      book_id: storyId,
      story_node: nodeId,
      image_url: existingImage?.image_url || '',
      status: 'generating',
      attempt_count: attemptCount,
      last_attempt: new Date().toISOString(),
      error_message: null
    };

    // Use upsert to handle both new and existing records
    const { data: updatedImage, error: upsertError } = await supabase
      .from('story_images')
      .upsert(imageRecord, { onConflict: 'book_id,story_node', returning: 'representation' });
    
    if (upsertError) {
      console.error('Error upserting image record:', upsertError);
      throw new Error(`Database upsert error: ${upsertError.message}`);
    }

    console.log('Image record created/updated:', updatedImage);

    // In a real implementation, this is where you would call an image generation API
    // For this example, we'll simulate image generation with a placeholder image
    try {
      // Simulate API call latency
      console.log('Generating image with prompt:', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));
      
      // For testing, use a placeholder image
      const imageUrl = "https://picsum.photos/seed/" + encodeURIComponent(nodeId) + "/800/600";
      
      // Update the record with the generated image URL
      const { error: updateError } = await supabase
        .from('story_images')
        .update({ 
          status: 'completed', 
          image_url: imageUrl
        })
        .eq('book_id', storyId)
        .eq('story_node', nodeId);
      
      if (updateError) {
        console.error('Error updating image record with URL:', updateError);
        throw new Error(`Database update error: ${updateError.message}`);
      }
      
      // Return a success response with the updated image data
      return new Response(
        JSON.stringify({
          success: true,
          image: {
            id: updatedImage[0].id,
            status: 'completed',
            image_url: imageUrl,
            attempt_count: attemptCount
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (genError) {
      console.error('Error in image generation process:', genError);
      
      // Update the record to reflect the error
      await supabase
        .from('story_images')
        .update({ 
          status: 'error', 
          error_message: genError.message || 'Unknown error during image generation'
        })
        .eq('book_id', storyId)
        .eq('story_node', nodeId);
      
      throw genError;
    }
  } catch (error) {
    console.error('Function error:', error);
    
    // Return a detailed error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        details: error.stack || 'No additional details available'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
