
import { StateCreator } from 'zustand';
import { StoryStore } from './types';
import { supabase } from '@/lib/supabase';
import { extractStoryContent } from '@/lib/storyEditorUtils';
import { generateAndLogNodeMappings } from '@/lib/storyEditorUtils';
import { CustomStory } from '@/types';
import { shallow } from 'zustand/shallow';

// Slice for core story data management
export const createStorySlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'storyId' | 'story' | 'storyData' | 'title' | 'totalPages' | 'setStoryId' | 'setStoryData' | 'setInkStory' | 'setTitle' | 'initializeStory' | 'handleStoryDataChange'>
> = (set, get) => ({
  storyId: null,
  story: null,
  storyData: null,
  title: 'Untitled Story',
  totalPages: 0, // Initialize with 0
  
  // Basic setters
  setStoryId: (id) => set({ storyId: id }),
  setStoryData: (data) => set({ storyData: data }),
  setInkStory: (story) => set({ story }),
  setTitle: (title) => set({ title }),
  
  // Initialize story data with improved story flow handling
  initializeStory: async (storyId) => {
    const store = get();
    
    // Prevent duplicate initializations with better validation
    if (
      store.storyId === storyId && 
      !store.loading && 
      store.storyData && 
      store.totalPages > 0 && 
      store.nodeMappings &&
      Object.keys(store.nodeMappings.nodeToPage || {}).length > 0
    ) {
      console.log("[StoryStore] Story already initialized with valid data, skipping");
      return;
    }
    
    console.log("[StoryStore] Initializing story:", storyId);
    
    // Set initial loading state in a single update
    set({ 
      loading: true, 
      storyId, 
      error: null,
      // Reset these values to avoid stale data
      storyData: null,
      totalPages: 0,
      nodeMappings: { nodeToPage: {}, pageToNode: {} }
    });
    
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
          dbTotalPages: data.total_pages || 0
        });
        
        // Store the title from the database
        set({ title: data.title || 'Untitled Story' });
        
        // Extract story content
        console.log("[StoryStore] Extracting story content");
        const storyContent = await extractStoryContent(data);
        
        if (storyContent) {
          console.log(`[StoryStore] Valid story content extracted with ${Object.keys(storyContent).length} nodes`);
          
          // First, analyze and count only actual story nodes
          const storyNodeKeys = Object.keys(storyContent).filter(key => {
            const node = storyContent[key];
            return (
              node && 
              typeof node === 'object' && 
              !Array.isArray(node) && 
              (typeof node.text === 'string' || Array.isArray(node.choices))
            );
          });
          
          console.log(`[StoryStore] Found ${storyNodeKeys.length} valid story nodes`);
          
          // Set story data first - do this separately to avoid circular dependencies
          set({ 
            storyData: storyContent, 
            hasUnsavedChanges: false 
          });
          
          // Now generate node mappings with proper story flow tracking
          setTimeout(() => {
            const currentStoryData = get().storyData;
            if (!currentStoryData) return;
            
            console.log("[StoryStore] Generating node mappings by tracking story flow");
            const { nodeMappings, totalPages } = generateAndLogNodeMappings(currentStoryData);
            
            // Use the computed page count from story flow, falling back to DB if needed
            const computedPages = totalPages > 0 ? totalPages : 0;
            const dbPages = data.total_pages > 0 ? data.total_pages : 0;
            const storyNodes = storyNodeKeys.length;
            
            // Prioritize the flow-based count, then node count, then DB value
            const finalPageCount = computedPages > 0 
              ? computedPages 
              : (storyNodes > 0 ? storyNodes : (dbPages > 0 ? dbPages : 1));
            
            console.log("[StoryStore] Setting totalPages:", {
              flowBasedPages: totalPages,
              storyNodeCount: storyNodes,
              dbPages: data.total_pages,
              finalPageCount
            });
            
            // Set mappings and page count in a single update to avoid multiple renders
            set({ 
              nodeMappings, 
              totalPages: finalPageCount
            });
            
            // Initialize story content with the start node
            const startNode = currentStoryData.start ? 'start' : 'root';
            const startNodeData = currentStoryData[startNode];
            
            if (startNodeData && startNodeData.text) {
              console.log("[StoryStore] Setting initial node:", startNode);
              // Batch state updates into a single set call
              set({
                currentNode: startNode,
                currentText: startNodeData.text,
                currentChoices: startNodeData.choices || [],
                currentPage: 1,
                storyHistory: [], 
                canGoBack: false
              });
            } else {
              console.log("[StoryStore] No valid start node found, defaulting to 'root'");
              set({
                currentNode: 'root',
                currentText: "Story begins...",
                currentChoices: [],
                currentPage: 1,
                storyHistory: [], 
                canGoBack: false
              });
            }
            
            // Final state update to set loading to false
            set({ loading: false });
          }, 0);
        } else {
          // Create default empty story structure
          console.log("[StoryStore] No valid story content found, creating default structure");
          const defaultStory = {
            root: {
              text: "Start writing your story here...",
              choices: [],
            },
          };
          
          // Set default story with minimal mappings in a single batch update
          set({ 
            storyData: defaultStory,
            currentNode: 'root',
            currentText: defaultStory.root.text,
            currentChoices: [],
            hasUnsavedChanges: false,
            nodeMappings: {
              nodeToPage: { 'root': 1 },
              pageToNode: { 1: 'root' }
            },
            totalPages: 1,
            loading: false,
            storyHistory: [], 
            canGoBack: false,
            currentPage: 1 
          });
        }
      } else {
        console.error("[StoryStore] Story not found");
        set({ 
          error: "Story not found.",
          loading: false
        });
      }
    } catch (error: any) {
      console.error("[StoryStore] Error fetching story:", error);
      set({ 
        error: error.message,
        loading: false 
      });
    }
  },
  
  // Optimize data change handler with proper story flow tracking
  handleStoryDataChange: (data) => {
    // Get current state
    const currentState = get();
    
    // Check if the data has actually changed to prevent unnecessary updates
    if (currentState.storyData && shallow(currentState.storyData, data)) {
      console.log("[StoryStore] Story data unchanged, skipping update");
      return;
    }
    
    console.log("[StoryStore] Story data change requested");
    
    // First, count actual story nodes to validate story structure
    const storyNodeKeys = Object.keys(data).filter(key => {
      const node = data[key];
      return (
        node && 
        typeof node === 'object' && 
        !Array.isArray(node) && 
        (typeof node.text === 'string' || Array.isArray(node.choices))
      );
    });
    
    console.log(`[StoryStore] Found ${storyNodeKeys.length} valid story nodes in updated data`);
    
    // Update story data and mark as unsaved
    set({ storyData: data, hasUnsavedChanges: true });
    
    // Debounce the node mapping update
    const requestId = Date.now();
    (get() as any)._lastMappingRequestId = requestId;
    
    setTimeout(() => {
      // Only proceed if this is still the latest request
      if ((get() as any)._lastMappingRequestId !== requestId) {
        console.log("[StoryStore] Cancelling outdated mapping request");
        return;
      }
      
      // Update node mappings with story flow tracking
      console.log("[StoryStore] Regenerating node mappings with story flow tracking");
      const { nodeMappings, totalPages } = generateAndLogNodeMappings(data);
      
      // Determine final page count based on multiple sources
      const computedPages = totalPages > 0 ? totalPages : 0;
      const storyNodes = storyNodeKeys.length;
      
      // Prioritize the flow-based page count, then node count
      const finalPageCount = computedPages > 0 
        ? computedPages 
        : (storyNodes > 0 ? storyNodes : 1);
      
      console.log("[StoryStore] Updated page count:", {
        flowBasedPages: totalPages,
        storyNodeCount: storyNodes,
        finalPageCount
      });
      
      // Update node mappings and page count
      set({ 
        nodeMappings, 
        totalPages: finalPageCount 
      });
    }, 300);
  },
});
