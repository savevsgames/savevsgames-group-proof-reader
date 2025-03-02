
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify OpenAI API key is set
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      throw new Error('OpenAI API key is not configured in the edge function');
    }

    const { storyId, nodeId, pageNumber, prompt } = await req.json();
    console.log('Image generation requested for:', { 
      storyId, 
      nodeId, 
      pageNumber, 
      promptLength: prompt?.length 
    });

    if (!storyId || !nodeId || !pageNumber || !prompt) {
      throw new Error('Missing required parameters: storyId, nodeId, pageNumber, prompt are all required');
    }

    // Check if image already exists
    const { data: existingImage, error: fetchError } = await supabase
      .from('story_images')
      .select('*')
      .eq('book_id', storyId)
      .eq('story_node', nodeId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error when checking for existing image:', fetchError);
      throw new Error(`Database error when checking for existing image: ${fetchError.message}`);
    }

    console.log('Existing image check:', existingImage ? 
      `Found image with status: ${existingImage.status}` : 
      'No existing image found');

    // Get image style settings from book_llm_settings
    const { data: settings, error: settingsError } = await supabase
      .from('book_llm_settings')
      .select('image_generation_settings')
      .eq('book_id', storyId)
      .maybeSingle();

    if (settingsError) {
      console.error('Could not fetch image settings:', settingsError);
    }

    console.log('Image settings retrieved:', settings ? 
      'Found settings' : 
      'No settings found, will use defaults');

    // Default settings if none found
    const imageSettings = settings?.image_generation_settings || {
      base_style: "High-detail pixel art in a fantasy style, rendered as if an oil painting was converted to pixel art. Each pixel should be distinct and carefully placed, maintaining the richness of oil painting textures while achieving a retro-pixel aesthetic.",
      quality_settings: {
        size: "1024x1024",
        quality: "high",
        style: "vivid"
      }
    };

    // Create enhanced prompt with style guidelines
    const enhancedPrompt = `Style: ${imageSettings.base_style}
Scene: ${prompt}
Additional details: Maintain consistent pixel density and color palette. Ensure fantasy elements are prominent while keeping the pixel art aesthetic clear and defined.`;

    console.log('Enhanced prompt created:', enhancedPrompt.substring(0, 100) + '...');

    // Define quality settings
    const imageSize = imageSettings.quality_settings?.size || "1024x1024";
    const imageQuality = imageSettings.quality_settings?.quality || "standard";
    const imageStyle = imageSettings.quality_settings?.style || "vivid";

    console.log('Using image quality settings:', { imageSize, imageQuality, imageStyle });

    let imageData = null;
    let imageUrl = null;
    let requestId = null;
    let errorMessage = null;
    let attemptCount = 1;

    if (existingImage) {
      attemptCount = (existingImage.attempt_count || 1) + 1;
      console.log('Incrementing attempt count to:', attemptCount);
    }

    // Create or update the image record with 'generating' status
    const { data: updatedImage, error: updateError } = await supabase
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
      throw new Error(`Database error when updating image status: ${updateError.message}`);
    }

    console.log('Updated image record with generating status:', updatedImage?.id);
    imageData = updatedImage;

    try {
      // Call OpenAI API to generate image
      console.log('Calling OpenAI to generate image with request payload:', {
        model: "dall-e-3",
        prompt: enhancedPrompt.substring(0, 50) + '...',
        size: imageSize,
        quality: imageQuality,
        style: imageStyle
      });
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
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

      console.log('OpenAI API response status:', response.status);
      
      // Check response status and headers for debugging
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log('OpenAI API response headers:', responseHeaders);

      // Handle non-200 responses with better error details
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenAI API error response:', errorBody);
        
        try {
          // Try to parse as JSON for structured error
          const errorData = JSON.parse(errorBody);
          throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
        } catch (parseError) {
          // Handle case where response is not valid JSON
          throw new Error(`OpenAI API error: Status ${response.status} - ${errorBody || 'No response body'}`);
        }
      }

      const result = await response.json();
      console.log('OpenAI response received:', {
        resultKeys: Object.keys(result),
        hasData: !!result.data?.length,
        created: result.created
      });

      // Extract image URL and request ID from response
      imageUrl = result.data?.[0]?.url;
      requestId = result.created?.toString();

      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      console.log('Image URL received:', imageUrl.substring(0, 30) + '...');

      // Update the record with completed status and image URL
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
        throw new Error(`Database error when saving the completed image: ${finalUpdateError.message}`);
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
    } catch (imageGenError) {
      console.error('Error generating image:', imageGenError);
      errorMessage = imageGenError.message || 'Unknown error during image generation';

      // Update the record with error status
      const { error: errorUpdateError } = await supabase
        .from('story_images')
        .update({
          status: 'error',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageData.id);

      if (errorUpdateError) {
        console.error('Could not update error status:', errorUpdateError);
      }

      // Get the updated record with error information
      const { data: errorImage } = await supabase
        .from('story_images')
        .select('*')
        .eq('id', imageData.id)
        .single();

      // Return error response
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: imageGenError.toString(),
          image: errorImage
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
