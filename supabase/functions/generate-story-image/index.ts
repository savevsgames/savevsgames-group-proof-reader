
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  ERROR: 'error'
};

serve(async (req) => {
  // Generate a unique request ID for tracking
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Processing image generation request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      console.error(`[${requestId}] OPENAI_API_KEY is not set`);
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get request body
    const { storyId, nodeId, pageNumber, prompt } = await req.json();
    
    console.log(`[${requestId}] Parameters:`, { storyId, nodeId, pageNumber, promptLength: prompt?.length });
    
    if (!storyId || !nodeId || !pageNumber || !prompt) {
      console.error(`[${requestId}] Missing required parameters`);
      throw new Error('Missing required parameters: storyId, nodeId, pageNumber, prompt');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initial status update - set to GENERATING
    console.log(`[${requestId}] Creating/updating image record with GENERATING status`);
    
    // Enhance the prompt with fantasy-style details
    const enhancedPrompt = `Create a detailed fantasy-style illustration for a story book with the following scene: ${prompt}. 
    Make it visually appealing and suitable for a book page. Use rich colors and detailed art style. Make the image appropriate for all age groups.`;
    
    // Create or update the story_images record with 'generating' status
    const { data: imageRecord, error: recordError } = await supabase
      .from('story_images')
      .upsert({
        book_id: storyId,
        story_node: nodeId,
        page_number: pageNumber,
        image_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        status: STATUS.GENERATING,
        request_id: requestId,
        attempt_count: 1
      }, {
        onConflict: 'book_id,story_node',
        returning: 'representation'
      });

    if (recordError) {
      console.error(`[${requestId}] Error creating image record:`, recordError);
      throw new Error(`Error creating image record: ${recordError.message}`);
    }

    if (!imageRecord || imageRecord.length === 0) {
      console.error(`[${requestId}] No image record created`);
      throw new Error('Failed to create image record');
    }

    console.log(`[${requestId}] Image record created/updated:`, imageRecord[0].id);

    // Continue processing in background
    const processImageGeneration = async () => {
      try {
        console.log(`[${requestId}] Starting background image generation with DALL-E 3`);
        
        // Generate the image using DALL-E 3
        const openAIResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIApiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
          })
        });

        const responseData = await openAIResponse.json();
        
        if (!openAIResponse.ok) {
          console.error(`[${requestId}] Error from OpenAI:`, responseData.error || responseData);
          
          // Update the record with error status
          await supabase
            .from('story_images')
            .update({ 
              status: STATUS.ERROR,
              error_message: JSON.stringify(responseData.error || 'Unknown error from OpenAI'),
              updated_at: new Date().toISOString() 
            })
            .eq('id', imageRecord[0].id);
            
          return;
        }

        const imageUrl = responseData.data[0]?.url;
        if (!imageUrl) {
          console.error(`[${requestId}] No image URL returned from OpenAI`);
          
          // Update the record with error status
          await supabase
            .from('story_images')
            .update({ 
              status: STATUS.ERROR,
              error_message: 'No image URL returned from OpenAI',
              updated_at: new Date().toISOString() 
            })
            .eq('id', imageRecord[0].id);
            
          return;
        }

        console.log(`[${requestId}] Image URL received from OpenAI, downloading...`);

        // Update status to uploading
        await supabase
          .from('story_images')
          .update({ 
            status: STATUS.UPLOADING,
            updated_at: new Date().toISOString() 
          })
          .eq('id', imageRecord[0].id);

        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`[${requestId}] Error downloading image: ${imageResponse.statusText}`);
          
          // Update the record with error status
          await supabase
            .from('story_images')
            .update({ 
              status: STATUS.ERROR,
              error_message: `Error downloading image: ${imageResponse.statusText}`,
              updated_at: new Date().toISOString() 
            })
            .eq('id', imageRecord[0].id);
            
          return;
        }

        const imageBlob = await imageResponse.blob();
        console.log(`[${requestId}] Image downloaded successfully, size: ${imageBlob.size} bytes`);

        // Generate a unique filename
        const timestamp = new Date().getTime();
        const filename = `story_${storyId}_node_${nodeId}_${timestamp}.png`;

        console.log(`[${requestId}] Uploading image to Supabase Storage as ${filename}`);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('images')
          .upload(filename, imageBlob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error(`[${requestId}] Error uploading image:`, uploadError);
          
          // Update the record with error status
          await supabase
            .from('story_images')
            .update({ 
              status: STATUS.ERROR,
              error_message: `Error uploading image: ${uploadError.message}`,
              updated_at: new Date().toISOString() 
            })
            .eq('id', imageRecord[0].id);
            
          return;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('images')
          .getPublicUrl(filename);

        const publicUrl = publicUrlData.publicUrl;
        console.log(`[${requestId}] Image uploaded successfully, public URL: ${publicUrl}`);

        // Update the record with the image URL
        const { data: updatedRecord, error: updateError } = await supabase
          .from('story_images')
          .update({ 
            image_url: publicUrl,
            status: STATUS.COMPLETED,
            updated_at: new Date().toISOString() 
          })
          .eq('id', imageRecord[0].id)
          .select();

        if (updateError) {
          console.error(`[${requestId}] Error updating image record:`, updateError);
          return;
        }

        console.log(`[${requestId}] Image generation process completed successfully`);
      } catch (error) {
        console.error(`[${requestId}] Error in background processing:`, error);
        
        // Update the record with error status
        await supabase
          .from('story_images')
          .update({ 
            status: STATUS.ERROR,
            error_message: error.message || 'Unknown error in background processing',
            updated_at: new Date().toISOString() 
          })
          .eq('id', imageRecord[0].id);
      }
    };

    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined') {
      console.log(`[${requestId}] Using EdgeRuntime.waitUntil for background processing`);
      EdgeRuntime.waitUntil(processImageGeneration());
    } else {
      console.log(`[${requestId}] EdgeRuntime not available, processing in foreground`);
      // In local development, just process it without background
      processImageGeneration().catch(console.error);
    }

    // Return immediately with the initial record
    return new Response(
      JSON.stringify({ 
        success: true, 
        image: imageRecord[0],
        message: 'Image generation started in background',
        requestId: requestId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in generate-story-image function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
