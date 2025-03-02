
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to download image from URL
async function downloadImage(url: string): Promise<Uint8Array> {
  console.log(`Downloading image from: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Define valid image quality parameters
const validQualityOptions = ['standard', 'hd'];
const validStyleOptions = ['vivid', 'natural']; 
const validSizeOptions = ['1024x1024', '1024x1792', '1792x1024'];

// Define default settings
const DEFAULT_SETTINGS = {
  quality: 'hd',
  style: 'vivid',
  size: '1024x1024'
};

// Main function to generate image
async function generateStoryImage(
  storyId: string,
  nodeId: string,
  pageNumber: number,
  prompt: string
) {
  console.log(`Generating image for story ${storyId}, node ${nodeId}, page ${pageNumber}`);
  console.log(`Prompt: ${prompt}`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const openaiKey = Deno.env.get('OPENAI_API_KEY') || '';
  
  // Initialize Supabase client with service role key for admin privileges
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Generate a unique request ID
  const requestId = crypto.randomUUID();
  
  try {
    // Check if an image already exists for this node
    const { data: existingImage } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .maybeSingle();
    
    if (existingImage?.status === 'completed' && existingImage?.image_url) {
      console.log(`Image already exists for node ${nodeId}, returning existing image`);
      return { success: true, image: existingImage };
    }
    
    // Get image quality settings from database
    const { data: settingsData } = await supabase
      .from('book_llm_settings')
      .select('image_generation_settings')
      .eq('book_id', storyId)
      .maybeSingle();
    
    // Prepare image generation settings with validation
    let quality = DEFAULT_SETTINGS.quality;
    let style = DEFAULT_SETTINGS.style;
    let size = DEFAULT_SETTINGS.size;
    let baseStyle = '';
    
    if (settingsData?.image_generation_settings) {
      const settings = settingsData.image_generation_settings;
      
      // Validate quality parameter
      if (settings.quality_settings?.quality && 
          validQualityOptions.includes(settings.quality_settings.quality)) {
        quality = settings.quality_settings.quality;
      }
      
      // Validate style parameter
      if (settings.quality_settings?.style && 
          validStyleOptions.includes(settings.quality_settings.style)) {
        style = settings.quality_settings.style;
      }
      
      // Validate size parameter
      if (settings.quality_settings?.size && 
          validSizeOptions.includes(settings.quality_settings.size)) {
        size = settings.quality_settings.size;
      }
      
      // Get base style
      baseStyle = settings.base_style || '';
    }
    
    console.log(`Using image settings: quality=${quality}, style=${style}, size=${size}`);
    
    // Update or create a story_image record with pending status
    const { data: imageRecord, error: recordError } = await supabase
      .from('story_images')
      .upsert({
        book_id: storyId,
        story_node: nodeId,
        page_number: pageNumber,
        status: 'generating',
        image_prompt: prompt,
        request_id: requestId,
        attempt_count: existingImage ? (existingImage.attempt_count || 0) + 1 : 1,
        created_at: existingImage ? existingImage.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'book_id,story_node'
      })
      .select()
      .single();
    
    if (recordError) {
      console.error('Error creating image record:', recordError);
      throw new Error(`Failed to create image record: ${recordError.message}`);
    }
    
    // Enhance the prompt with the base style if available
    let enhancedPrompt = prompt;
    if (baseStyle) {
      enhancedPrompt = `${prompt}. ${baseStyle}`;
    }
    console.log(`Enhanced prompt: ${enhancedPrompt}`);
    
    // Update the record with the enhanced prompt
    await supabase
      .from('story_images')
      .update({
        enhanced_prompt: enhancedPrompt,
        status: 'generating'
      })
      .eq('id', imageRecord.id);
    
    // Call OpenAI API to generate image
    console.log('Calling OpenAI API to generate image');
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        quality: quality,
        style: style,
        size: size
      })
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      
      // Update the record with error status
      await supabase
        .from('story_images')
        .update({
          status: 'error',
          error_message: `OpenAI API error: ${JSON.stringify(errorData)}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageRecord.id);
      
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }
    
    const openaiData = await openaiResponse.json();
    console.log('OpenAI API response:', JSON.stringify(openaiData));
    
    if (!openaiData.data || !openaiData.data[0] || !openaiData.data[0].url) {
      throw new Error('No image URL in OpenAI response');
    }
    
    const temporaryImageUrl = openaiData.data[0].url;
    console.log(`Temporary OpenAI image URL: ${temporaryImageUrl}`);
    
    // Update status to uploading
    await supabase
      .from('story_images')
      .update({
        status: 'uploading',
        updated_at: new Date().toISOString()
      })
      .eq('id', imageRecord.id);
    
    // Download image from OpenAI URL
    const imageData = await downloadImage(temporaryImageUrl);
    
    // Upload image to Supabase Storage bucket
    const fileName = `story_${storyId}_node_${nodeId}_${requestId}.png`;
    const storagePath = `story_images/${fileName}`;
    
    console.log(`Uploading image to Supabase Storage: ${storagePath}`);
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('images')
      .upload(storagePath, imageData, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (storageError) {
      console.error('Error uploading to storage:', storageError);
      
      // Update the record with error status
      await supabase
        .from('story_images')
        .update({
          status: 'error',
          error_message: `Storage error: ${storageError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageRecord.id);
      
      throw new Error(`Failed to upload image to storage: ${storageError.message}`);
    }
    
    // Get public URL for the stored image
    const { data: publicUrlData } = supabase
      .storage
      .from('images')
      .getPublicUrl(storagePath);
    
    const permanentImageUrl = publicUrlData.publicUrl;
    console.log(`Permanent Storage URL: ${permanentImageUrl}`);
    
    // Update the story_images record with completed status and permanent URL
    const { data: updatedRecord, error: updateError } = await supabase
      .from('story_images')
      .update({
        status: 'completed',
        image_url: permanentImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageRecord.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating image record:', updateError);
      throw new Error(`Failed to update image record: ${updateError.message}`);
    }
    
    console.log('Image generation and storage completed successfully');
    return { success: true, image: updatedRecord };
  } catch (error) {
    console.error('Error in generateStoryImage:', error);
    
    // Update the record with error status
    await supabase
      .from('story_images')
      .update({
        status: 'error',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('book_id', storyId)
      .eq('story_node', nodeId);
    
    return { 
      success: false, 
      error: error.message,
      details: error.toString()
    };
  }
}

// Main server handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Log request info
    console.log(`Request received: ${req.method} ${req.url}`);
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const requestData = await req.json();
    console.log(`Request data: ${JSON.stringify(requestData)}`);
    
    // Extract parameters
    const { storyId, nodeId, pageNumber, prompt } = requestData;
    
    // Validate required parameters
    if (!storyId || !nodeId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate and store the image
    const result = await generateStoryImage(
      storyId, 
      nodeId, 
      pageNumber || 1, 
      prompt
    );
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error in server:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
