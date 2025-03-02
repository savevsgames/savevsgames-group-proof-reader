
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle requests to the Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Extract request data
  const { storyId, nodeId, pageNumber, prompt, forceRegenerate } = await req.json();
  
  // Validate required parameters
  if (!storyId || !nodeId || !prompt) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required parameters",
        details: "storyId, nodeId, and prompt are required"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
  
  // Setup Supabase client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log(`Processing image request for story ${storyId}, node ${nodeId}`);
    console.log(`Force regenerate: ${forceRegenerate ? 'Yes' : 'No'}`);
    console.log(`Prompt: "${prompt}"`);
    
    // Check if image already exists
    const { data: existingImage, error: fetchError } = await supabaseAdmin
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Database error: ${fetchError.message}`);
    }
    
    // If image exists and we're not forcing regeneration, return existing image
    if (existingImage && !forceRegenerate) {
      console.log(`Using existing image: ${existingImage.id}, status: ${existingImage.status}`);
      return new Response(
        JSON.stringify({
          success: true,
          image: existingImage
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    let imageRequest;
    
    // Update existing record or create new record
    if (existingImage) {
      console.log(`Updating existing image record: ${existingImage.id}`);
      // If regenerating, increment the attempt count
      const attemptCount = (existingImage.attempt_count || 1) + (forceRegenerate ? 1 : 0);
      
      // If image already exists and we're forcing regeneration, delete the old image
      if (forceRegenerate && existingImage.image_url) {
        try {
          console.log(`Deleting existing image file for regeneration`);
          const path = existingImage.image_url.split('/').pop();
          if (path) {
            const { error: deleteError } = await supabaseAdmin
              .storage
              .from('images')
              .remove([path]);
              
            if (deleteError) {
              console.warn(`Failed to delete old image: ${deleteError.message}`);
            }
          }
        } catch (e) {
          console.warn(`Error removing old image: ${e.message}`);
        }
      }
      
      // Update the record to show we're generating a new image
      const { data: updatedRecord, error: updateError } = await supabaseAdmin
        .from('story_images')
        .update({
          status: 'generating',
          attempt_count: attemptCount,
          last_attempt: new Date().toISOString(),
          error_message: null,
          request_id: crypto.randomUUID()
        })
        .eq('id', existingImage.id)
        .select()
        .single();
        
      if (updateError) {
        throw new Error(`Failed to update image record: ${updateError.message}`);
      }
      
      imageRequest = updatedRecord;
    } else {
      console.log(`Creating new image record for node ${nodeId}`);
      // Create a new record
      const { data: newRecord, error: insertError } = await supabaseAdmin
        .from('story_images')
        .insert({
          book_id: storyId,
          story_node: nodeId,
          page_number: pageNumber,
          status: 'generating',
          request_id: crypto.randomUUID(),
        })
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Failed to create image record: ${insertError.message}`);
      }
      
      imageRequest = newRecord;
    }
    
    // Return the image record
    return new Response(
      JSON.stringify({
        success: true,
        image: imageRequest
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`Error processing image request: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process image generation request",
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
