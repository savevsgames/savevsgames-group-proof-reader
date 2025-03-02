
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
  
  // Initialize story data with improved state management
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
      console.log("[StoryStore] Story already initialized with valid data, skipping", {
        storyId,
        currentNodeMappings: store.nodeMappings ? Object.keys(store.nodeMappings.nodeToPage || {}).length : 0,
        totalPages: store.totalPages
      });
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
          
          // Set story data first - do this separately to avoid circular dependencies
          set({ 
            storyData: storyContent, 
            hasUnsavedChanges: false 
          });
          
          // Now generate node mappings with improved page counting - in a separate update
          // This prevents some potential circular dependencies
          setTimeout(() => {
            const currentStoryData = get().storyData;
            if (!currentStoryData) return;
            
            console.log("[StoryStore] Generating node mappings");
            const { nodeMappings, totalPages } = generateAndLogNodeMappings(currentStoryData);
            
            // Determine the final page count, prioritizing the computed value but falling back to DB
            const computedPages = totalPages > 0 ? totalPages : 0;
            const dbPages = data.total_pages > 0 ? data.total_pages : 0;
            const finalPageCount = computedPages > 0 ? computedPages : (dbPages > 0 ? dbPages : 1);
            
            console.log("[StoryStore] Setting totalPages:", {
              mappedPages: totalPages,
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
            
            console.log("[StoryStore] Initialization complete:", {
              currentNode: get().currentNode,
              totalPages: get().totalPages,
              hasNodeMappings: !!get().nodeMappings && Object.keys(get().nodeMappings.nodeToPage || {}).length > 0
            });
            
            // Final state update to set loading to false after everything else is done
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
          
          console.log("[StoryStore] Default state initialized with 1 page");
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
  
  // Optimize data change handler with debouncing and state comparison
  handleStoryDataChange: (data) => {
    // Get current state
    const currentState = get();
    
    // Check if the data has actually changed to prevent unnecessary updates
    if (currentState.storyData && shallow(currentState.storyData, data)) {
      console.log("[StoryStore] Story data unchanged, skipping update");
      return;
    }
    
    console.log("[StoryStore] Story data change requested", {
      nodeCount: Object.keys(data).length,
      firstNode: Object.keys(data)[0]
    });
    
    // Update story data and mark as unsaved
    set({ storyData: data, hasUnsavedChanges: true });
    
    // Debounce the node mapping update to prevent rapid consecutive updates
    // Use a unique ID to track the latest request and cancel previous ones
    const requestId = Date.now();
    (get() as any)._lastMappingRequestId = requestId;
    
    setTimeout(() => {
      // Only proceed if this is still the latest request
      if ((get() as any)._lastMappingRequestId !== requestId) {
        console.log("[StoryStore] Cancelling outdated mapping request");
        return;
      }
      
      // Update node mappings
      console.log("[StoryStore] Regenerating node mappings after data change");
      const { nodeMappings, totalPages } = generateAndLogNodeMappings(data);
      
      // Ensure we have at least 1 page
      const finalPageCount = Math.max(totalPages, 1);
      
      // Compare with current state before updating
      const currentMappings = get().nodeMappings;
      const currentPageCount = get().totalPages;
      
      // Only update if there's an actual change
      if (
        !currentMappings || 
        !shallow(currentMappings.nodeToPage, nodeMappings.nodeToPage) || 
        currentPageCount !== finalPageCount
      ) {
        console.log("[StoryStore] Updating state with new mappings:", {
          mappedNodeCount: Object.keys(nodeMappings.nodeToPage).length,
          finalPageCount,
          previousCount: currentPageCount
        });
        
        set({ 
          nodeMappings, 
          totalPages: finalPageCount 
        });
      } else {
        console.log("[StoryStore] Node mappings unchanged, skipping update");
      }
    }, 300); // Add a 300ms debounce
  },
});
