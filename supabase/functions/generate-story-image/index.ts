
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate OpenAI image generation parameters
function validateAndFixImageSettings(settings) {
  const fixedSettings = { ...settings };
  
  // Valid quality values for DALL-E 3 are 'standard' or 'hd'
  if (fixedSettings.quality_settings?.quality === 'high') {
    console.log('Converting invalid quality value "high" to "hd"');
    fixedSettings.quality_settings.quality = 'hd';
  }
  
  // Ensure quality is one of the valid values
  if (fixedSettings.quality_settings?.quality && 
      !['standard', 'hd'].includes(fixedSettings.quality_settings.quality)) {
    console.log(`Invalid quality value "${fixedSettings.quality_settings.quality}", defaulting to "standard"`);
    fixedSettings.quality_settings.quality = 'standard';
  }
  
  // Valid style values are 'vivid' or 'natural'
  if (fixedSettings.quality_settings?.style && 
      !['vivid', 'natural'].includes(fixedSettings.quality_settings.style)) {
    console.log(`Invalid style value "${fixedSettings.quality_settings.style}", defaulting to "vivid"`);
    fixedSettings.quality_settings.style = 'vivid';
  }
  
  // Valid size values are '1024x1024', '1792x1024', or '1024x1792'
  const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
  if (fixedSettings.quality_settings?.size && 
      !validSizes.includes(fixedSettings.quality_settings.size)) {
    console.log(`Invalid size value "${fixedSettings.quality_settings.size}", defaulting to "1024x1024"`);
    fixedSettings.quality_settings.size = '1024x1024';
  }
  
  return fixedSettings;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API key is not configured',
          details: 'Missing API key configuration'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse request body
    const { storyId, nodeId, pageNumber, prompt } = await req.json();
    console.log('Image generation request received:', { 
      storyId, 
      nodeId, 
      pageNumber, 
      promptLength: prompt?.length 
    });

    // Validate required parameters
    if (!storyId || !nodeId || !pageNumber || !prompt) {
      console.error('Missing required parameters:', { storyId, nodeId, pageNumber, promptExists: !!prompt });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters',
          details: 'storyId, nodeId, pageNumber, prompt are all required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check if image already exists
    console.log('Checking for existing image');
    const { data: existingImage, error: fetchError } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error when checking for existing image:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          details: fetchError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Get image style settings
    console.log('Fetching image style settings');
    const { data: settings, error: settingsError } = await supabase
      .from('book_llm_settings')
      .select('image_generation_settings')
      .eq('book_id', storyId)
      .maybeSingle();

    if (settingsError) {
      console.warn('Could not fetch image settings:', settingsError);
    }

    // Default settings if none found
    let imageSettings = settings?.image_generation_settings || {
      base_style: "High-detail pixel art in a fantasy style, rendered as if an oil painting was converted to pixel art. Each pixel should be distinct and carefully placed, maintaining the richness of oil painting textures while achieving a retro-pixel aesthetic.",
      quality_settings: {
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      }
    };
    
    // Validate and fix any invalid parameters
    imageSettings = validateAndFixImageSettings(imageSettings);

    // Create enhanced prompt with style guidelines
    const enhancedPrompt = `Style: ${imageSettings.base_style}
Scene: ${prompt}
Additional details: Maintain consistent pixel density and color palette. Ensure fantasy elements are prominent while keeping the pixel art aesthetic clear and defined.`;

    console.log('Enhanced prompt created:', enhancedPrompt.substring(0, 100) + '...');

    // Define quality settings with validation
    const imageSize = imageSettings.quality_settings?.size || "1024x1024";
    const imageQuality = imageSettings.quality_settings?.quality || "standard";
    const imageStyle = imageSettings.quality_settings?.style || "vivid";

    console.log('Using image quality settings:', { imageSize, imageQuality, imageStyle });

    // Calculate attempt count
    let attemptCount = 1;
    if (existingImage) {
      attemptCount = (existingImage.attempt_count || 1) + 1;
      console.log('Incrementing attempt count to:', attemptCount);
    }

    // Create or update the image record with 'generating' status
    console.log('Updating database with generating status');
    const { data: imageData, error: updateError } = await supabase
      .from('story_images')
      .upsert({
        book_id: storyId,
        story_node: nodeId,
        page_number: pageNumber,
        image_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        status: 'generating',
        attempt_count: attemptCount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'book_id,story_node'
      })
      .select()
      .single();

    if (updateError) {
      console.error('Database error when updating image status:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          details: updateError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Log OpenAI request parameters before API call
    console.log('Calling OpenAI API with parameters:', {
      model: "dall-e-3",
      promptPreview: enhancedPrompt.substring(0, 50) + '...',
      size: imageSize,
      quality: imageQuality,
      style: imageStyle
    });
    
    // Call OpenAI API to generate image
    const openAIResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: imageSize,
        quality: imageQuality,
        style: imageStyle
      })
    });

    // Check for OpenAI API errors
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API Error (${openAIResponse.status}):`, errorText);
      
      // Update the record with error status
      await supabase
        .from('story_images')
        .update({
          status: 'error',
          error_message: `OpenAI API Error (${openAIResponse.status}): ${errorText}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageData.id);
      
      // Get the updated record with error information
      const { data: errorImage } = await supabase
        .from('story_images')
        .select('*')
        .eq('id', imageData.id)
        .single();
        
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API Error: ${openAIResponse.status}`,
          details: errorText,
          image: errorImage
        }),
        { 
          status: 422, // Using 422 to distinguish from server errors
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse successful response
    const result = await openAIResponse.json();
    console.log('OpenAI response received:', {
      resultKeys: Object.keys(result),
      hasData: !!result.data?.length,
      created: result.created
    });

    // Extract image URL and request ID from response
    const imageUrl = result.data?.[0]?.url;
    const requestId = result.created?.toString();

    if (!imageUrl) {
      console.error('No image URL in OpenAI response');
      
      // Update record with error
      await supabase
        .from('story_images')
        .update({
          status: 'error',
          error_message: 'No image URL returned from OpenAI',
          updated_at: new Date().toISOString()
        })
        .eq('id', imageData.id);
        
      // Get updated record
      const { data: errorImage } = await supabase
        .from('story_images')
        .select('*')
        .eq('id', imageData.id)
        .single();
        
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No image URL in response',
          details: 'OpenAI API returned success but no image URL was found',
          image: errorImage
        }),
        { 
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update the record with completed status and image URL
    console.log('Updating database with completed status and image URL');
    const { error: finalUpdateError } = await supabase
      .from('story_images')
      .update({
        image_url: imageUrl,
        status: 'completed',
        request_id: requestId,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageData.id);

    if (finalUpdateError) {
      console.error('Database error when saving the completed image:', finalUpdateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          details: finalUpdateError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Get the final updated record
    const { data: finalImage } = await supabase
      .from('story_images')
      .select('*')
      .eq('id', imageData.id)
      .single();

    console.log('Successfully completed image generation for:', {
      imageId: finalImage?.id,
      storyId,
      nodeId
    });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        image: finalImage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unhandled exception in image generation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
