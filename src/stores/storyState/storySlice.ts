
import { StateCreator } from 'zustand';
import { StoryStore } from './types';
import { supabase } from '@/lib/supabase';
import { extractStoryContent } from '@/lib/storyEditorUtils';
import { generateAndLogNodeMappings } from '@/lib/storyEditorUtils';

// Slice for core story data management
export const createStorySlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'storyId' | 'story' | 'storyData' | 'title' | 'setStoryId' | 'setStoryData' | 'setInkStory' | 'setTitle' | 'initializeStory' | 'handleStoryDataChange'>
> = (set, get) => ({
  storyId: null,
  story: null,
  storyData: null,
  title: 'Untitled Story',
  
  // Basic setters
  setStoryId: (id) => set({ storyId: id }),
  setStoryData: (data) => set({ storyData: data }),
  setInkStory: (story) => set({ story }),
  setTitle: (title) => set({ title }),
  
  // Initialize story data
  initializeStory: async (storyId) => {
    const store = get();
    
    // Prevent duplicate initializations
    if (store.storyId === storyId && !store.loading && store.storyData) {
      console.log("[StoryStore] Story already initialized, skipping");
      return;
    }
    
    console.log("[StoryStore] Initializing story:", storyId);
    set({ loading: true, storyId, error: null });
    
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", storyId)
        .single();
        
      if (error) {
        console.error("[StoryStore] Supabase error:", error);
        throw error;
      }
      
      if (data) {
        console.log("[StoryStore] Story data fetched:", {
          title: data.title,
          hasStoryUrl: !!data.story_url,
          hasStoryContent: !!data.story_content
        });
        
        set({ title: data.title || 'Untitled Story' });
        
        // Extract story content
        console.log("[StoryStore] Extracting story content");
        const storyContent = await extractStoryContent(data);
        
        if (storyContent) {
          console.log(`[StoryStore] Valid story content extracted with ${Object.keys(storyContent).length} nodes`);
          set({ storyData: storyContent, hasUnsavedChanges: false });
          
          // Update node mappings
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(storyContent);
          set({ nodeMappings, totalPages });
          
          // Initialize story content
          const startNode = storyContent.start ? 'start' : 'root';
          const startNodeData = storyContent[startNode];
          
          if (startNodeData && startNodeData.text) {
            set({
              currentNode: startNode,
              currentText: startNodeData.text,
              currentChoices: startNodeData.choices || []
            });
          } else {
            set({
              currentNode: 'root',
              currentText: "Story begins...",
              currentChoices: []
            });
          }
          
          // Reset history
          set({ storyHistory: [], canGoBack: false });
        } else {
          // Create default empty story structure
          console.log("[StoryStore] No valid story content found, creating default structure");
          const defaultStory = {
            root: {
              text: "Start writing your story here...",
              choices: [],
            },
          };
          
          set({ 
            storyData: defaultStory,
            currentNode: 'root',
            currentText: defaultStory.root.text,
            currentChoices: [],
            hasUnsavedChanges: false 
          });
          
          // Update node mappings for default story
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(defaultStory);
          set({ nodeMappings, totalPages });
        }
      } else {
        console.error("[StoryStore] Story not found");
        set({ error: "Story not found." });
      }
    } catch (error: any) {
      console.error("[StoryStore] Error fetching story:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  handleStoryDataChange: (data) => {
    console.log("[StoryStore] Story data change requested");
    set({ storyData: data, hasUnsavedChanges: true });
    
    // Update node mappings
    const { nodeMappings, totalPages } = generateAndLogNodeMappings(data);
    set({ nodeMappings, totalPages });
  },
});
