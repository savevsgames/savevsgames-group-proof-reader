import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

// Constants
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms
const TIMEOUT = 30000; // 30 seconds for OpenAI API

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to log with timestamps
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

// Handle CORS preflight requests
async function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

// Validate request parameters
function validateRequest(body: any) {
  const { storyId, nodeId, pageNumber, prompt } = body;
  
  if (!storyId) return "Missing storyId parameter";
  if (!nodeId) return "Missing nodeId parameter";
  if (!pageNumber && pageNumber !== 0) return "Missing pageNumber parameter";
  if (!prompt) return "Missing prompt parameter";
  
  return null;
}

// Create or update story image record
async function createOrUpdateImageRecord(
  storyId: string, 
  nodeId: string, 
  pageNumber: number, 
  prompt: string,
  requestId: string
) {
  try {
    // Check if image record exists
    const { data: existingImage, error: fetchError } = await supabase
      .from("story_images")
      .select("*")
      .eq("book_id", storyId)
      .eq("story_node", nodeId)
      .single();
      
    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Error fetching image record: ${fetchError.message}`);
    }
    
    // If record exists, update it
    if (existingImage) {
      const { error: updateError } = await supabase
        .from("story_images")
        .update({
          image_prompt: prompt,
          status: "generating",
          request_id: requestId,
          last_attempt: new Date().toISOString(),
          attempt_count: existingImage.attempt_count ? existingImage.attempt_count + 1 : 1,
          error_message: null // Clear previous errors
        })
        .eq("id", existingImage.id);
        
      if (updateError) {
        throw new Error(`Error updating image record: ${updateError.message}`);
      }
      
      return existingImage.id;
    } 
    // Otherwise create a new record
    else {
      const { data: newImage, error: insertError } = await supabase
        .from("story_images")
        .insert({
          book_id: storyId,
          story_node: nodeId,
          page_number: pageNumber,
          image_prompt: prompt,
          status: "generating",
          request_id: requestId,
          attempt_count: 1
        })
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Error creating image record: ${insertError.message}`);
      }
      
      return newImage.id;
    }
  } catch (error) {
    logWithTimestamp(`Database error in createOrUpdateImageRecord: ${error.message}`);
    throw error;
  }
}

// Enhanced prompt to improve image quality
function enhancePrompt(prompt: string) {
  return `High quality, detailed digital illustration: ${prompt}. Vibrant colors, dramatic lighting, 8k resolution.`;
}

// Generate image using OpenAI DALL-E API
async function generateImageWithDALLE(enhancedPrompt: string, requestId: string, retryCount = 0) {
  try {
    logWithTimestamp(`Generating image with DALL-E, attempt ${retryCount + 1}`, { requestId });
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json();
      logWithTimestamp(`DALL-E API error: ${response.status}`, errorData);
      
      // Handle rate limiting or temporary failures with retries
      if ((response.status === 429 || response.status >= 500) && retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return generateImageWithDALLE(enhancedPrompt, requestId, retryCount + 1);
      }
      
      throw new Error(`DALL-E API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    logWithTimestamp("DALL-E API response received", { requestId });
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error("Invalid response from DALL-E API: missing image URL");
    }
    
    return data.data[0].url;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("DALL-E API request timed out after 30 seconds");
    }
    throw error;
  }
}

// Upload image to Supabase Storage
async function uploadImageToStorage(imageUrl: string, imageId: string, requestId: string) {
  try {
    logWithTimestamp("Fetching image from DALL-E URL", { requestId });
    
    // Fetch the image from DALL-E
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const fileExt = "png"; // DALL-E images are PNG
    const fileName = `${imageId}.${fileExt}`;
    const filePath = `story-images/${fileName}`;
    
    logWithTimestamp("Uploading image to Supabase Storage", { requestId, filePath });
    
    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from("images")
      .upload(filePath, imageBlob, {
        contentType: "image/png",
        upsert: true
      });
      
    if (storageError) {
      throw new Error(`Storage upload error: ${storageError.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from("images")
      .getPublicUrl(filePath);
      
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL for uploaded image");
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    logWithTimestamp(`Error in uploadImageToStorage: ${error.message}`, { requestId });
    throw error;
  }
}

// Update image record with completed status
async function updateImageRecord(imageId: string, imageUrl: string, requestId: string) {
  try {
    logWithTimestamp("Updating image record as completed", { requestId, imageId });
    
    const { error } = await supabase
      .from("story_images")
      .update({
        image_url: imageUrl,
        status: "completed",
        last_attempt: new Date().toISOString()
      })
      .eq("id", imageId);
      
    if (error) {
      throw new Error(`Error updating image record: ${error.message}`);
    }
  } catch (error) {
    logWithTimestamp(`Database error in updateImageRecord: ${error.message}`, { requestId });
    throw error;
  }
}

// Update image record with error status
async function updateImageWithError(imageId: string, errorMessage: string, requestId: string) {
  try {
    logWithTimestamp("Updating image record with error", { requestId, imageId, errorMessage });
    
    const { error } = await supabase
      .from("story_images")
      .update({
        status: "error",
        error_message: errorMessage,
        last_attempt: new Date().toISOString()
      })
      .eq("id", imageId);
      
    if (error) {
      console.error(`Failed to update image with error: ${error.message}`);
    }
  } catch (error) {
    console.error(`Critical error in updateImageWithError: ${error.message}`);
  }
}

// Main image generation process
async function generateImage(storyId: string, nodeId: string, pageNumber: number, prompt: string, requestId: string) {
  let imageId: string;
  
  try {
    // Step 1: Create or update database record
    imageId = await createOrUpdateImageRecord(storyId, nodeId, pageNumber, prompt, requestId);
    
    // Step 2: Enhance the prompt
    const enhancedPrompt = enhancePrompt(prompt);
    
    // Step 3: Generate image with DALL-E
    const dalleImageUrl = await generateImageWithDALLE(enhancedPrompt, requestId);
    
    // Step 4: Upload to storage
    const storageUrl = await uploadImageToStorage(dalleImageUrl, imageId, requestId);
    
    // Step 5: Update record with success
    await updateImageRecord(imageId, storageUrl, requestId);
    
    logWithTimestamp("Image generation completed successfully", { requestId, imageId });
    
    // Return the image data
    return {
      success: true,
      image: {
        id: imageId,
        image_url: storageUrl,
        status: "completed"
      }
    };
  } catch (error) {
    logWithTimestamp(`Error in generateImage: ${error.message}`, { requestId });
    
    // Update record with error if we have an imageId
    if (imageId) {
      await updateImageWithError(imageId, error.message, requestId);
    }
    
    return {
      success: false,
      error: error.message,
      image: imageId ? {
        id: imageId,
        status: "error",
        error_message: error.message
      } : null
    };
  }
}

// Main request handler
async function handleRequest(req: Request) {
  try {
    const requestId = uuidv4();
    logWithTimestamp("New image generation request received", { requestId });
    
    const body = await req.json();
    const validationError = validateRequest(body);
    
    if (validationError) {
      logWithTimestamp(`Validation error: ${validationError}`, { requestId });
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { storyId, nodeId, pageNumber, prompt } = body;
    
    // First phase: Create/update the record and return quickly
    const imageId = await createOrUpdateImageRecord(storyId, nodeId, pageNumber, prompt, requestId);
    
    // Second phase: Process the image generation in the background
    // This allows the Edge Function to respond quickly while processing continues
    if (typeof EdgeRuntime !== "undefined") {
      EdgeRuntime.waitUntil(
        generateImage(storyId, nodeId, pageNumber, prompt, requestId)
          .catch(error => {
            console.error(`Background processing error: ${error.message}`);
            if (imageId) {
              updateImageWithError(imageId, error.message, requestId)
                .catch(err => console.error(`Failed to update error status: ${err.message}`));
            }
          })
      );
    } else {
      // Fallback for environments without EdgeRuntime.waitUntil
      setTimeout(() => {
        generateImage(storyId, nodeId, pageNumber, prompt, requestId)
          .catch(error => {
            console.error(`Background processing error: ${error.message}`);
            if (imageId) {
              updateImageWithError(imageId, error.message, requestId)
                .catch(err => console.error(`Failed to update error status: ${err.message}`));
            }
          });
      }, 0);
    }
    
    // Return a quick response with the image ID and status
    return new Response(
      JSON.stringify({
        success: true,
        image: {
          id: imageId,
          status: "generating",
          request_id: requestId
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logWithTimestamp(`Unhandled error: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
        details: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Main entry point
serve(async (req) => {
  try {
    // Handle CORS preflight requests
    const corsResponse = await handleCors(req);
    if (corsResponse) return corsResponse;
    
    // Process the request
    return await handleRequest(req);
  } catch (error) {
    console.error(`Critical error: ${error.message}`);
    return new Response(
      JSON.stringify({ success: false, error: "Fatal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
