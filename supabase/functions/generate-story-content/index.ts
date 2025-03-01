
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { systemPrompt, prompt, contentType, model, temperature } = await req.json();

    if (!systemPrompt || !prompt) {
      return new Response(
        JSON.stringify({ error: "System prompt and prompt are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate content type
    if (!["edit_json", "story_suggestions"].includes(contentType)) {
      return new Response(
        JSON.stringify({ error: "Invalid content type. Must be 'edit_json' or 'story_suggestions'" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Set appropriate system prompt based on content type
    let finalSystemPrompt = systemPrompt;
    if (contentType === "edit_json") {
      finalSystemPrompt += "\nYou are a JSON editor. Your task is to generate valid JSON for story nodes based on user instructions and context provided.";
    } else {
      finalSystemPrompt += "\nYou are a creative writing assistant providing suggestions and ideas to improve the story.";
    }

    // Set up OpenAI API request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: finalSystemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: temperature || 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate content with OpenAI" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content || "";

    console.log(`Generated ${contentType} content successfully`);

    return new Response(
      JSON.stringify({ 
        content: generatedContent, 
        contentType 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in generate-story-content function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
