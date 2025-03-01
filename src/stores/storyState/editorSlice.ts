
import { StateCreator } from 'zustand';
import { StoryStore } from '@/types';
import { supabase } from '@/lib/supabase';

// Slice for editor-specific state and actions
export const createEditorSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'handleSave'>
> = (set, get) => ({
  // Editor actions
  handleSave: async () => {
    const { storyId, storyData, hasUnsavedChanges, setSaving, setHasUnsavedChanges, setError } = get();
    
    if (!storyId || !storyData || !hasUnsavedChanges) {
      console.log("[StoryStore] No story to save or no changes");
      return;
    }
    
    console.log("[StoryStore] Saving story");
    setSaving(true);
    
    try {
      const storyContent = JSON.stringify(storyData);
      
      const { error } = await supabase
        .from("books")
        .update({ story_content: storyContent })
        .eq("id", storyId);
        
      if (error) {
        console.error("[StoryStore] Error saving story:", error);
        setError(`Failed to save: ${error.message}`);
        return;
      }
      
      console.log("[StoryStore] Story saved successfully");
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("[StoryStore] Error in save operation:", error);
      setError(`Save error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }
});
