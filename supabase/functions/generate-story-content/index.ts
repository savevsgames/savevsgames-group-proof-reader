
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// Properly typed request body for better documentation and type safety
interface RequestBody {
  systemPrompt: string;
  prompt: string;
  contentType: "edit_json" | "story_suggestions";
  model?: string;
  temperature?: number;
}

/**
 * Supabase Edge Function for generating AI-assisted story content
 * 
 * This function serves as a secure proxy between the client application and OpenAI,
 * handling all communication with the AI service while keeping API keys secure.
 * 
 * The function:
 * 1. Receives context data (story context, comments, etc.) from the client
 * 2. Formats and sends this data to OpenAI with appropriate parameters
 * 3. Processes and returns the AI-generated content to the client
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { systemPrompt, prompt, contentType, model, temperature } = await req.json() as RequestBody;
    
    // Log the received request for debugging
    console.log('Content generation request:', { contentType, model, promptLength: prompt.length });

    // Input validation
    if (!prompt || !contentType) {
      throw new Error('Missing required parameters: prompt and contentType are required');
    }

    // Get API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use appropriate model based on request or fallback to default
    const modelToUse = model || 'gpt-4o-mini';
    const tempToUse = temperature !== undefined ? temperature : 0.7;

    console.log(`Using model: ${modelToUse} with temperature: ${tempToUse}`);

    // Prepare OpenAI request
    const openAIRequest = {
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are an AI assistant for interactive story editing and analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: tempToUse,
      max_tokens: 2048  // Adjust based on expected response length
    };

    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify(openAIRequest)
    });

    // Handle API errors
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    // Extract and format the response
    const data = await openAIResponse.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Content generated successfully', { 
      contentType, 
      contentLength: generatedContent.length,
      modelUsed: modelToUse
    });

    // Return the formatted response
    return new Response(
      JSON.stringify({
        content: generatedContent,
        contentType: contentType,
        model: modelToUse
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    // Proper error handling with detailed logging
    console.error('Error in generate-story-content function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during content generation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
