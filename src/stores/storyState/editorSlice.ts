
import { StateCreator } from 'zustand';
import { StoryStore } from '@/types';
import { supabase } from '@/lib/supabase';

// Slice for editor-specific state and actions
export const createEditorSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'hasUnsavedChanges' | 'saving' | 'setHasUnsavedChanges' | 'setSaving' | 'handleSave'>
> = (set, get) => ({
  hasUnsavedChanges: false,
  saving: false,
  
  // Setters
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  setSaving: (saving) => set({ saving }),
  
  // Editor actions
  handleSave: async () => {
    const { storyId, storyData, hasUnsavedChanges } = get();
    
    if (!storyId || !storyData || !hasUnsavedChanges) {
      console.log("[StoryStore] No story to save or no changes");
      return;
    }
    
    console.log("[StoryStore] Saving story");
    set({ saving: true });
    
    try {
      const storyContent = JSON.stringify(storyData);
      
      const { error } = await supabase
        .from("books")
        .update({ story_content: storyContent })
        .eq("id", storyId);
        
      if (error) {
        console.error("[StoryStore] Error saving story:", error);
        set({ error: `Failed to save: ${error.message}` });
        return;
      }
      
      console.log("[StoryStore] Story saved successfully");
      set({ hasUnsavedChanges: false });
    } catch (error: any) {
      console.error("[StoryStore] Error in save operation:", error);
      set({ error: `Save error: ${error.message}` });
    } finally {
      set({ saving: false });
    }
  }
});
