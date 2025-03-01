
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
  return "You are a creative writing assistant helping the author craft an interactive story. Analyze the reader comments and current story content to suggest improvements. Maintain the style and tone of the story. Format your suggestions in the same structure as the story JSON.";
};
