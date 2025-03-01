
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { StoryStore } from '@/types/story-types.definitions';
import { createStorySlice } from './storySlice';
import { createNavigationSlice } from './navigationSlice';
import { createEditorSlice } from './editorSlice';
import { createUiSlice } from './uiSlice';

// Create the store with all slices combined
export const useStoryStore = create<StoryStore>()(
  devtools(
    persist(
      (...params) => {
        // Disable verbose logging during store creation
        const isInitializing = true;
        
        // Combine all slices
        const store = {
          ...createStorySlice(...params),
          ...createNavigationSlice(...params),
          ...createEditorSlice(...params),
          ...createUiSlice(...params),
        };
        
        // Only log during development and not during frequent updates
        if (process.env.NODE_ENV === 'development') {
          console.log('[StoryStore] Store initialized with:', {
            storyId: store.storyId,
            hasTitle: !!store.title,
            totalPages: store.totalPages || 0,
            nodeMappingsSize: store.nodeMappings ? Object.keys(store.nodeMappings.nodeToPage || {}).length : 0
          });
        }
        
        return store;
      },
      {
        name: 'story-storage',
        // Only persist essential data to avoid update loops
        partialize: (state) => {
          // Avoid logging during normal state persistence to prevent loops
          // Only log during significant changes
          if (state.totalPages > 0 && process.env.NODE_ENV === 'development') {
            console.log('[StoryStore] Persisting essential state', {
              storyId: state.storyId,
              hasTitle: !!state.title,
              totalPages: state.totalPages
            });
          }
          
          return { 
            storyId: state.storyId,
            title: state.title,
            // Store totalPages to ensure it's preserved between sessions
            totalPages: state.totalPages 
            // Do NOT persist currentPage or currentNode to avoid infinite update loops
          };
        },
        onRehydrateStorage: () => (state) => {
          if (state && process.env.NODE_ENV === 'development') {
            console.log('[StoryStore] Rehydrated state:', {
              storyId: state?.storyId,
              hasTitle: !!state?.title,
              totalPages: state?.totalPages || 0
            });
          }
        }
      }
    )
  )
);

// Re-export selectors
export * from './selectors';
