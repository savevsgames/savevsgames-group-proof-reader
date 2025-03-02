
import { StateCreator } from 'zustand';
import { StoryStore } from '@/types';
import { saveStoryToDatabase } from '@/lib/storyEditorUtils';

// Slice for editor-specific state and actions
export const createEditorSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'handleSave'>
> = (set, get) => ({
  // Editor actions
  handleSave: async () => {
    const { storyId, storyData, title, hasUnsavedChanges, setSaving, setHasUnsavedChanges, setError } = get();
    
    if (!storyId || !storyData || !hasUnsavedChanges) {
      console.log("[StoryStore] No story to save or no changes");
      return;
    }
    
    console.log("[StoryStore] Saving story");
    setSaving(true);
    
    try {
      // Use the updated saveStoryToDatabase function without totalPages
      const saveSuccess = await saveStoryToDatabase(storyId, storyData, title);
      
      if (!saveSuccess) {
        console.error("[StoryStore] Error saving story");
        setError(`Failed to save story`);
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
