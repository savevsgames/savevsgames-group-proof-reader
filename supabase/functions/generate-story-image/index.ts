import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Respond to OPTIONS requests for CORS preflight
function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

interface ImageGenerationOptions {
  storyId: string;
  nodeId: string;
  pageNumber: number;
  prompt: string;
  forceRegenerate?: boolean;
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    console.log("New image generation request received");

    // Parse request body
    const { storyId, nodeId, pageNumber, prompt, forceRegenerate = false } = await req.json() as ImageGenerationOptions;

    // Validate required parameters
    if (!storyId || !nodeId || !prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters",
          details: "storyId, nodeId, and prompt are required fields"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
          details: "Database connection credentials are missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing image for this story node
    const { data: existingImage, error: fetchError } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Database error checking for existing image:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database error",
          details: fetchError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Handle image regeneration logic
    let attemptCount = 1;
    let existingImageUrl = null;
    let imageRequestId = crypto.randomUUID();

    if (existingImage) {
      console.log("Found existing image:", {
        imageId: existingImage.id,
        status: existingImage.status,
        forceRegenerate
      });

      // If image is completed and we don't want to force regenerate, return existing data
      if (existingImage.status === 'completed' && !forceRegenerate) {
        return new Response(
          JSON.stringify({
            success: true,
            image: existingImage
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // For regeneration, increment attempt count
      attemptCount = (existingImage.attempt_count || 1) + 1;
      existingImageUrl = existingImage.image_url;
    }

    // Fetch image generation settings
    const { data: settingsData } = await supabase
      .from('book_llm_settings')
      .select('image_generation_settings')
      .eq('book_id', storyId)
      .maybeSingle();
      
    // Default settings if none found
    const imageSettings = settingsData?.image_generation_settings || {
      base_style: 'High-detail pixel art in a fantasy style',
      quality_settings: {
        quality: 'hd',
        style: 'vivid',
        size: '1024x1024'
      }
    };

    // Validate and fix settings
    const qualitySettings = imageSettings.quality_settings || {};
    const validatedSettings = {
      quality: ['standard', 'hd'].includes(qualitySettings.quality) ? qualitySettings.quality : 'hd',
      style: ['vivid', 'natural'].includes(qualitySettings.style) ? qualitySettings.style : 'vivid',
      size: ['1024x1024', '1024x1792', '1792x1024'].includes(qualitySettings.size) ? qualitySettings.size : '1024x1024'
    };

    // Get base style from settings or use default
    const baseStyle = imageSettings.base_style || 'High-detail pixel art in a fantasy style';

    // Create or update the image record with pending status
    const imageId = existingImage?.id || crypto.randomUUID();
    const { error: upsertError } = await supabase
      .from('story_images')
      .upsert({
        id: imageId,
        book_id: storyId,
        story_node: nodeId,
        page_number: pageNumber,
        status: 'generating',
        created_at: existingImage ? existingImage.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        request_id: imageRequestId,
        attempt_count: attemptCount,
        last_attempt: new Date().toISOString(),
        // Keep existing URL until new one is generated
        image_url: existingImage?.image_url || '',
      });

    if (upsertError) {
      console.error("Error creating image record:", upsertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create image record",
          details: upsertError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Start image generation in the background
    const backgroundTask = async () => {
      try {
        // If we're regenerating and have an existing image, delete it from storage
        if (forceRegenerate && existingImageUrl) {
          try {
            // Extract path from URL - assuming URL format like "https://xxx.supabase.co/storage/v1/object/public/images/filename.jpg"
            const urlParts = existingImageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            if (fileName) {
              console.log(`Attempting to delete previous image file: ${fileName}`);
              const { error: deleteError } = await supabase.storage
                .from('images')
                .remove([fileName]);
                
              if (deleteError) {
                console.warn(`Could not delete previous image file: ${deleteError.message}`);
              } else {
                console.log(`Successfully deleted previous image file: ${fileName}`);
              }
            }
          } catch (deleteErr) {
            console.warn("Error deleting previous image:", deleteErr);
            // Continue with generation even if deletion fails
          }
        }

        // Set up enhanced prompt with base style
        const enhancedPrompt = `${prompt}. ${baseStyle}`;
        console.log(`Generating image with prompt: "${enhancedPrompt}"`);
        
        // Update database with enhanced prompt
        await supabase
          .from('story_images')
          .update({
            enhanced_prompt: enhancedPrompt,
          })
          .eq('id', imageId);

        // Initialize OpenAI API
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
          throw new Error("OpenAI API key is missing");
        }

        // Generate image with OpenAI
        const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            n: 1,
            model: "dall-e-3",
            quality: validatedSettings.quality,
            style: validatedSettings.style,
            size: validatedSettings.size,
          })
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          console.error("OpenAI API error:", errorData);
          
          await supabase
            .from('story_images')
            .update({
              status: 'error',
              error_message: `OpenAI API error: ${JSON.stringify(errorData)}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', imageId);
            
          return;
        }

        const imageData = await openaiResponse.json();
        console.log("OpenAI image generated successfully");

        // Update status to uploading
        await supabase
          .from('story_images')
          .update({
            status: 'uploading',
            updated_at: new Date().toISOString(),
          })
          .eq('id', imageId);

        // Download the image
        const imageUrl = imageData.data[0].url;
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = "jpg"; // DALL-E returns JPG
        const filename = `${storyId}_${nodeId}_${timestamp}.${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filename, imageBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });
          
        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
        
        console.log("Image uploaded to storage:", filename);
        
        // Get public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(filename);
          
        const publicUrl = publicUrlData.publicUrl;
        
        // Update database with completed status and image URL
        await supabase
          .from('story_images')
          .update({
            status: 'completed',
            image_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', imageId);
          
        console.log("Image generation completed successfully:", publicUrl);
        
      } catch (error) {
        console.error("Error in image generation background task:", error);
        
        // Update database with error status
        await supabase
          .from('story_images')
          .update({
            status: 'error',
            error_message: error.message || "Unknown error in image generation",
            updated_at: new Date().toISOString(),
          })
          .eq('id', imageId);
      }
    };

    // Start background task and return immediately
    EdgeRuntime.waitUntil(backgroundTask());

    // Fetch the updated record to return
    const { data: updatedImage } = await supabase
      .from('story_images')
      .select('*')
      .eq('id', imageId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        image: updatedImage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Unhandled error in generate-story-image function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        details: error.message || "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
