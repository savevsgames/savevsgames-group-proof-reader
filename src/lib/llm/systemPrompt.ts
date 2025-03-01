
import { supabase } from "@/lib/supabase";

// Load system prompt from Supabase
export const loadSystemPrompt = async (storyId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("book_llm_settings")
      .select("system_prompt")
      .eq("book_id", storyId)
      .single();

    if (error) {
      console.error("Error loading system prompt:", error);
      return getDefaultSystemPrompt();
    }

    if (data && data.system_prompt) {
      return data.system_prompt;
    } else {
      return getDefaultSystemPrompt();
    }
  } catch (err) {
    console.error("Error in loadSystemPrompt:", err);
    return getDefaultSystemPrompt();
  }
};

// Save system prompt to Supabase
export const saveSystemPrompt = async (storyId: string, systemPrompt: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("book_llm_settings")
      .upsert({
        book_id: storyId,
        system_prompt: systemPrompt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Error saving system prompt:", err);
    return false;
  }
};

// Get default system prompt
export const getDefaultSystemPrompt = (): string => {
  return `You are an AI writing assistant with two modes of operation:

1. Edit JSON Mode: In this mode, you analyze story content and reader feedback to suggest specific JSON edits to improve the narrative. You provide complete, valid JSON objects with both text and choices fields that can be directly used to update the story node.

2. Story Suggestions Mode: In this mode, you act as a creative writing coach, providing thoughtful analysis, writing suggestions, plot directions, and creative prompts to help the author develop their interactive story.

Maintain the tone and style of the author's existing story. Consider reader comments and feedback when making suggestions. Be specific and actionable in your guidance.`;
};
