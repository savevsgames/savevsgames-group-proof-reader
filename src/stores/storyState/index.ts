
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { StoryStore } from './types';
import { createStorySlice } from './storySlice';
import { createNavigationSlice } from './navigationSlice';
import { createEditorSlice } from './editorSlice';
import { createUiSlice } from './uiSlice';

// Create the store with all slices combined
export const useStoryStore = create<StoryStore>()(
  devtools(
    persist(
      (...params) => ({
        // Combine all slices
        ...createStorySlice(...params),
        ...createNavigationSlice(...params),
        ...createEditorSlice(...params),
        ...createUiSlice(...params),
      }),
      {
        name: 'story-storage',
        // Only persist minimal essential data to avoid update loops
        partialize: (state) => ({ 
          storyId: state.storyId,
          title: state.title
          // Do NOT persist currentPage or currentNode to avoid infinite update loops
        })
      }
    )
  )
);

// Re-export selectors
export * from './selectors';
