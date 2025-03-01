
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { StoryStore } from '@/types';
import { createStorySlice } from './storySlice';
import { createNavigationSlice } from './navigationSlice';
import { createEditorSlice } from './editorSlice';
import { createUiSlice } from './uiSlice';
import { createCommentsSlice } from './commentsSlice';

/**
 * Create the global story store with all slices combined
 */
export const useStoryStore = create<StoryStore>()(
  devtools(
    persist(
      (...params) => ({
        // Combine all slices to form the complete store
        ...createStorySlice(...params),
        ...createNavigationSlice(...params),
        ...createEditorSlice(...params),
        ...createUiSlice(...params),
        ...createCommentsSlice(...params),
      }),
      {
        name: 'story-storage',
        // Only persist essential data to avoid update loops
        partialize: (state) => {
          return { 
            storyId: state.storyId,
            title: state.title,
            totalPages: state.totalPages 
          };
        }
      }
    )
  )
);

// Re-export selectors for convenience
export * from './selectors';
