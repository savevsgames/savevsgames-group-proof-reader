
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
      console.log("[StoryStore] Story already initialized, skipping", {
        storyId,
        currentNodeMappings: Object.keys(store.nodeMappings.nodeToPage || {}).length,
        totalPages: store.totalPages
      });
      return;
    }
    
    console.log("[StoryStore] Initializing story:", storyId);
    set({ loading: true, storyId, error: null });
    
    try {
      // Fetch story data from Supabase
      console.log("[StoryStore] Fetching story data from Supabase for ID:", storyId);
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
          hasStoryContent: !!data.story_content,
          dbTotalPages: data.total_pages
        });
        
        set({ title: data.title || 'Untitled Story' });
        
        // Extract story content
        console.log("[StoryStore] Extracting story content from:", {
          storyUrl: data.story_url,
          storyFile: data.story_file
        });
        
        const storyContent = await extractStoryContent(data);
        
        if (storyContent) {
          console.log(`[StoryStore] Valid story content extracted with ${Object.keys(storyContent).length} nodes`);
          console.log("[StoryStore] First 3 nodes:", Object.keys(storyContent).slice(0, 3));
          console.log("[StoryStore] Sample node content:", storyContent[Object.keys(storyContent)[0]]);
          
          set({ storyData: storyContent, hasUnsavedChanges: false });
          
          // Update node mappings
          console.log("[StoryStore] Generating node mappings");
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(storyContent);
          
          console.log("[StoryStore] Node mappings generated:", {
            nodeCount: Object.keys(nodeMappings.nodeToPage).length,
            pageCount: totalPages,
            firstNodeName: Object.keys(nodeMappings.nodeToPage)[0],
            firstNodePage: nodeMappings.nodeToPage[Object.keys(nodeMappings.nodeToPage)[0]]
          });
          
          set({ nodeMappings, totalPages });
          console.log("[StoryStore] State updated with mappings and total pages:", totalPages);
          
          // Initialize story content
          const startNode = storyContent.start ? 'start' : 'root';
          const startNodeData = storyContent[startNode];
          
          if (startNodeData && startNodeData.text) {
            console.log("[StoryStore] Setting initial node:", startNode);
            set({
              currentNode: startNode,
              currentText: startNodeData.text,
              currentChoices: startNodeData.choices || []
            });
          } else {
            console.log("[StoryStore] No valid start node found, defaulting to 'root'");
            set({
              currentNode: 'root',
              currentText: "Story begins...",
              currentChoices: []
            });
          }
          
          // Reset history
          set({ storyHistory: [], canGoBack: false });
          console.log("[StoryStore] Initialization complete:", {
            currentNode: get().currentNode,
            totalPages: get().totalPages,
            hasNodeMappings: !!get().nodeMappings && Object.keys(get().nodeMappings.nodeToPage || {}).length > 0
          });
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
          console.log("[StoryStore] Generating default node mappings");
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(defaultStory);
          
          console.log("[StoryStore] Default node mappings generated:", {
            nodeCount: Object.keys(nodeMappings.nodeToPage).length,
            pageCount: totalPages
          });
          
          set({ nodeMappings, totalPages });
          console.log("[StoryStore] Default state updated with mappings and total pages:", totalPages);
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
      console.log("[StoryStore] Final state after initialization:", {
        storyId: get().storyId,
        hasStoryData: !!get().storyData,
        currentNode: get().currentNode,
        totalPages: get().totalPages,
        hasNodeMappings: !!get().nodeMappings && Object.keys(get().nodeMappings.nodeToPage || {}).length > 0
      });
    }
  },
  
  handleStoryDataChange: (data) => {
    console.log("[StoryStore] Story data change requested", {
      nodeCount: Object.keys(data).length,
      firstNode: Object.keys(data)[0]
    });
    
    set({ storyData: data, hasUnsavedChanges: true });
    
    // Update node mappings
    console.log("[StoryStore] Regenerating node mappings after data change");
    const { nodeMappings, totalPages } = generateAndLogNodeMappings(data);
    
    console.log("[StoryStore] Updated node mappings:", {
      nodeCount: Object.keys(nodeMappings.nodeToPage).length,
      pageCount: totalPages
    });
    
    set({ nodeMappings, totalPages });
    console.log("[StoryStore] State updated after data change:", {
      totalPages: get().totalPages,
      hasNodeMappings: !!get().nodeMappings && Object.keys(get().nodeMappings.nodeToPage || {}).length > 0
    });
  },
});
