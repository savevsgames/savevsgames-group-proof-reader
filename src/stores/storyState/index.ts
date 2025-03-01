
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
      (...params) => {
        console.log('[StoryStore] Creating store instance');
        // Combine all slices
        const store = {
          ...createStorySlice(...params),
          ...createNavigationSlice(...params),
          ...createEditorSlice(...params),
          ...createUiSlice(...params),
        };
        
        console.log('[StoryStore] Store initialized with:', {
          storyId: store.storyId,
          hasTitle: !!store.title,
          totalPages: store.totalPages || 0,
          nodeMappingsSize: store.nodeMappings ? Object.keys(store.nodeMappings.nodeToPage || {}).length : 0
        });
        
        return store;
      },
      {
        name: 'story-storage',
        // Only persist minimal essential data to avoid update loops
        partialize: (state) => {
          console.log('[StoryStore] Persisting state with:', {
            storyId: state.storyId,
            title: state.title,
            totalPageCount: state.totalPages || 0,
            nodeMappingsSize: state.nodeMappings ? Object.keys(state.nodeMappings.nodeToPage || {}).length : 0
          });
          return { 
            storyId: state.storyId,
            title: state.title
            // Do NOT persist currentPage or currentNode to avoid infinite update loops
          };
        },
        onRehydrateStorage: () => (state) => {
          console.log('[StoryStore] Rehydrated state:', {
            storyId: state?.storyId,
            hasTitle: !!state?.title,
            hasNodeMappings: state?.nodeMappings && Object.keys(state?.nodeMappings.nodeToPage || {}).length > 0,
            totalPages: state?.totalPages || 0
          });
        }
      }
    )
  )
);

// Re-export selectors
export * from './selectors';
