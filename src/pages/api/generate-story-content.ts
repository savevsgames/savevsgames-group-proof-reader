
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, prompt, contentType, model, temperature } = req.body;

    if (!systemPrompt || !prompt) {
      return res.status(400).json({ error: "System prompt and prompt are required" });
    }

    // Validate content type
    if (!["edit_json", "story_suggestions"].includes(contentType)) {
      return res.status(400).json({ 
        error: "Invalid content type. Must be 'edit_json' or 'story_suggestions'" 
      });
    }

    // Set appropriate system prompt based on content type
    let finalSystemPrompt = systemPrompt;
    if (contentType === "edit_json") {
      finalSystemPrompt += "\nYou are a JSON editor. Your task is to generate valid JSON for story nodes based on user instructions and context provided.";
    } else {
      finalSystemPrompt += "\nYou are a creative writing assistant providing suggestions and ideas to improve the story.";
    }

    // Get OpenAI API key from environment
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key is not configured" });
    }

    // Set up OpenAI API request
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return res.status(500).json({ 
        error: "Failed to generate content with OpenAI",
        details: errorData
      });
    }

    const data = await openaiResponse.json();
    const generatedContent = data.choices[0]?.message?.content || "";

    return res.status(200).json({ 
      content: generatedContent, 
      contentType 
    });
  } catch (error: any) {
    console.error("Error in generate-story-content API:", error);
    
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred" 
    });
  }
}
