
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  systemPrompt: string;
  prompt: string;
  contentType: "edit_json" | "story_suggestions";
  model: string;
  temperature: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the OPENAI_API_KEY from environment variables
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    const { systemPrompt, prompt, contentType, model, temperature } = requestData;

    // Prepare final system prompt based on content type
    const finalSystemPrompt = systemPrompt + (
      contentType === "edit_json" 
        ? "\nYou are a JSON editor. Your task is to generate valid JSON for story nodes based on user instructions and context provided."
        : "\nYou are a creative writing assistant providing suggestions and ideas to improve the story."
    );

    // Make OpenAI API request
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        ...corsHeaders
      },
      body: JSON.stringify({
        model: model,
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
        temperature: temperature,
        max_tokens: 2000,
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API Error (${openAIResponse.status}):`, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API Error (${openAIResponse.status}): ${errorText}` 
        }),
        { 
          status: openAIResponse.status, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Parse and return the OpenAI response
    const data = await openAIResponse.json();
    const generatedContent = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        contentType: contentType
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
});
