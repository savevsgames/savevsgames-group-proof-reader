
import { supabase } from "@/lib/supabase";

export interface ModelSettings {
  model: string;
  temperature: number;
}

// Load model settings from Supabase
export const loadModelSettings = async (storyId: string): Promise<ModelSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("book_llm_settings")
      .select("model_settings")
      .eq("book_id", storyId)
      .single();

    if (error) {
      console.error("Error loading model settings:", error);
      return null;
    }

    if (data && data.model_settings) {
      return data.model_settings;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error in loadModelSettings:", err);
    return null;
  }
};

// Save model settings to Supabase
export const saveModelSettings = async (
  storyId: string, 
  modelSettings: ModelSettings
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("book_llm_settings")
      .upsert({
        book_id: storyId,
        model_settings: modelSettings,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Error saving model settings:", err);
    return false;
  }
};
