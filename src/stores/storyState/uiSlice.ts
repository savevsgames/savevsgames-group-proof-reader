
import { StateCreator } from 'zustand';
import { StoryStore } from '@/types';

// Slice for UI-related state and actions
export const createUiSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'loading' | 'error' | 'commentCount' | 'usingCustomFormat' | 'saving' | 'hasUnsavedChanges' | 'setLoading' | 'setError' | 'setCommentCount' | 'setSaving' | 'setHasUnsavedChanges' | 'setUsingCustomFormat'>
> = (set) => ({
  // UI state
  loading: false,
  error: null,
  commentCount: 0,
  usingCustomFormat: true,
  saving: false,
  hasUnsavedChanges: false,
  
  // Setters
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSaving: (saving) => set({ saving }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  setUsingCustomFormat: (usingCustomFormat) => set({ usingCustomFormat }),
  
  // Set comment count with debounce to prevent excessive updates
  setCommentCount: (count) => {
    // Only update if the count is different to prevent unnecessary re-renders
    set(state => {
      if (state.commentCount !== count) {
        return { commentCount: count };
      }
      return {};
    });
  },
});
