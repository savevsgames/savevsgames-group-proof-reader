
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get request body
    const { storyId, nodeId, pageNumber, prompt } = await req.json();
    
    if (!storyId || !nodeId || !pageNumber || !prompt) {
      throw new Error('Missing required parameters: storyId, nodeId, pageNumber, prompt');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Enhance the prompt with fantasy-style details
    const enhancedPrompt = `Create a detailed fantasy-style illustration for a story book with the following scene: ${prompt}. 
    Make it visually appealing and suitable for a book page. Use rich colors and detailed art style. Make the image appropriate for all age groups.`;
    
    console.log(`Generating image for story ${storyId}, node ${nodeId}, page ${pageNumber}`);
    console.log(`Enhanced prompt: ${enhancedPrompt}`);

    // Create or update the story_images record with 'generating' status
    const { data: imageRecord, error: recordError } = await supabase
      .from('story_images')
      .upsert({
        book_id: storyId,
        story_node: nodeId,
        page_number: pageNumber,
        image_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        status: 'generating'
      }, {
        onConflict: 'book_id,story_node',
        returning: 'representation'
      });

    if (recordError) {
      throw new Error(`Error creating image record: ${recordError.message}`);
    }

    // Generate the image using DALL-E 3
    const response = await fetch('https://api.openai.com/v1/images/generations', {
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

    const responseData = await response.json();
    
    if (!response.ok) {
      // Update the record with error status
      await supabase
        .from('story_images')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString() 
        })
        .eq('id', imageRecord[0].id);
        
      throw new Error(`Error from OpenAI: ${JSON.stringify(responseData.error || responseData)}`);
    }

    const imageUrl = responseData.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const filename = `story_${storyId}_node_${nodeId}_${timestamp}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(filename, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error uploading image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('images')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    // Update the record with the image URL
    const { data: updatedRecord, error: updateError } = await supabase
      .from('story_images')
      .update({ 
        image_url: publicUrl,
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', imageRecord[0].id)
      .select();

    if (updateError) {
      throw new Error(`Error updating image record: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: updatedRecord[0]
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
        error: error.message 
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
