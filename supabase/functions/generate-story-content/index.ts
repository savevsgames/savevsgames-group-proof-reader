
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set in the environment variables');
    }

    const supabase = createClient(
      supabaseUrl || '',
      supabaseServiceKey || ''
    );

    // Get the token from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse the request
    const { prompt, currentContent, modelVersion = 'gpt-4o', temperature = 0.7, context = '' } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'No prompt provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get any context files for additional context
    const { data: contextFiles, error: filesError } = await supabase
      .from('book_context_files')
      .select('*')
      .eq('book_id', prompt.bookId);

    if (filesError) {
      console.error('Error fetching context files:', filesError);
    }

    // Build the file context string if any files exist
    let fileContext = '';
    if (contextFiles && contextFiles.length > 0) {
      fileContext = '\n\nAdditional context from files: These files contain additional information you may use:\n';
      
      for (const file of contextFiles) {
        fileContext += `- ${file.file_name}\n`;
        
        // If needed, could fetch file content here and add to context
        // This would depend on if you want to include file content directly
      }
    }

    // Build the complete system message with context and instructions
    const systemMessage = `You are a creative storytelling assistant that helps authors write interactive fiction.
      
Your task is to modify or extend the current story content based on the author's prompt.
${context ? `\nImportant context from the author: ${context}` : ''}
${fileContext}

The current story is in a JSON format where each node has text and choices leading to other nodes.
Modify the story while preserving its structure and style.

DO NOT change the overall structure of the JSON. Keep the same node names and format of each node object:
- Each node has "text" (string) and "choices" (array of objects)
- Each choice has "text" (what the reader sees) and "nextNode" (which node to go to next)
- Some nodes may have "isEnding" (boolean) if they're ending nodes with no choices

Your response should be the complete, valid JSON for the story with your modifications incorporated.`;

    // Make the API call to OpenAI
    console.log(`Making OpenAI API call with model: ${modelVersion}, temperature: ${temperature}`);
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelVersion,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Current story content: ${currentContent}\n\nPrompt: ${prompt}` }
        ],
        temperature: temperature,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    const openAIData = await openAIResponse.json();
    const generatedContent = openAIData.choices[0].message.content;

    // Try to extract just the JSON part if the LLM included additional text
    let processedContent = generatedContent;
    try {
      const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        // The LLM wrapped the JSON in code blocks, extract just the JSON
        processedContent = jsonMatch[1];
      }
      
      // Validate that it's proper JSON by parsing it
      JSON.parse(processedContent);
    } catch (e) {
      console.warn('Unable to extract or parse JSON from response, returning raw content:', e);
      // Fall back to returning the raw content
      processedContent = generatedContent;
    }

    return new Response(
      JSON.stringify({ generatedContent: processedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-story-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
