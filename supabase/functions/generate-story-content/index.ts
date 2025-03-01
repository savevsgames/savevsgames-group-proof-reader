
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { systemPrompt, prompt, contentType, model = "gpt-4o-mini", temperature = 0.7 } = await req.json();
    
    // Validate inputs
    if (!systemPrompt || !prompt) {
      return new Response(
        JSON.stringify({ error: "System prompt and prompt are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate model - only allow specific models
    const allowedModels = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];
    if (!allowedModels.includes(model)) {
      return new Response(
        JSON.stringify({ error: "Invalid model specified. Allowed models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate temperature
    const temp = Number(temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      return new Response(
        JSON.stringify({ error: "Temperature must be a number between 0 and 1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating content with model: ${model}, temperature: ${temperature}`);

    // Prepare the request to OpenAI
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        temperature: temp,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error from OpenAI API", details: errorData }),
        { status: openAIResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseData = await openAIResponse.json();
    
    // Extract the generated content
    const generatedContent = responseData.choices[0].message.content;

    // Return the generated content with content type
    return new Response(
      JSON.stringify({
        content: generatedContent,
        contentType: contentType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story-content function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
