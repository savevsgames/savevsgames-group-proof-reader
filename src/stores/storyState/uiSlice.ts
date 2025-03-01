
import { StateCreator } from 'zustand';
import { StoryStore } from './types';

// Slice for UI-related state and actions
export const createUiSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'loading' | 'error' | 'commentCount' | 'usingCustomFormat' | 'setLoading' | 'setError' | 'setCommentCount'>
> = (set) => ({
  // UI state
  loading: false,
  error: null,
  commentCount: 0,
  usingCustomFormat: true,
  
  // Setters
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCommentCount: (count) => set({ commentCount: count }),
});
