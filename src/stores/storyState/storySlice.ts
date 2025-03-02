
import { StateCreator } from 'zustand';
import { StoryStore } from './types';
import { supabase } from '@/lib/supabase';
import { extractStoryContent, generateAndLogNodeMappings } from '@/lib/storyEditorUtils';
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
          console.log(`[StoryStore] Valid story content extracted with ${Object.keys(storyContent).length} top-level keys`);
          
          // Log comprehensive information about the story structure
          console.log("[StoryStore] Story structure overview:", {
            hasStart: !!storyContent.start,
            hasRoot: !!storyContent.root,
            isInkFormat: !!storyContent.inkVersion,
            contentSize: JSON.stringify(storyContent).length,
            dbTotalPages: data.total_pages
          });
          
          // First, analyze and count only actual story nodes
          const skipKeys = ['inkVersion', 'listDefs', '#f'];
          const storyNodeKeys = Object.keys(storyContent).filter(key => {
            if (skipKeys.includes(key)) return false;
            
            const node = storyContent[key];
            return (
              node && 
              typeof node === 'object' && 
              !Array.isArray(node) && 
              (typeof node.text === 'string' || Array.isArray(node.choices))
            );
          });
          
          console.log(`[StoryStore] Found ${storyNodeKeys.length} valid story nodes`);
          
          // If we have Ink.js format but no valid story nodes, we need special handling
          const isInkFormat = storyContent.inkVersion && Array.isArray(storyContent.root);
          if (isInkFormat && storyNodeKeys.length === 0) {
            console.log("[StoryStore] Detected Ink.js format with no custom nodes, needs special handling");
          }
          
          // Set story data first - do this separately to avoid circular dependencies
          set({ 
            storyData: storyContent, 
            hasUnsavedChanges: false 
          });
          
          // Now generate node mappings with proper story flow tracking
          // Use setTimeout to avoid blocking the main thread and allow UI updates
          setTimeout(() => {
            const currentStoryData = get().storyData;
            if (!currentStoryData) return;
            
            console.log("[StoryStore] Generating node mappings by tracking story flow");
            const { nodeMappings, totalPages } = generateAndLogNodeMappings(currentStoryData);
            
            // Log the results of the mapping operation
            console.log("[StoryStore] Node mapping results:", {
              mappedNodes: Object.keys(nodeMappings.nodeToPage).length,
              mappedPages: Object.keys(nodeMappings.pageToNode).length,
              generatedTotalPages: totalPages
            });
            
            // Comprehensive calculation strategy for total pages
            // 1. Prefer computed page count from node flow mapping
            // 2. Otherwise use the raw node count
            // 3. Fallback to database value if available
            // 4. Last resort: use 1 page as minimum
            
            const mappedPages = totalPages;
            const rawNodeCount = storyNodeKeys.length;
            const dbPageCount = data.total_pages || 0;
            
            let finalPageCount = 1; // Default minimum
            
            // Decision tree for page count
            if (mappedPages > 0) {
              finalPageCount = mappedPages;
              console.log(`[StoryStore] Using mapped flow-based page count: ${finalPageCount}`);
            } else if (rawNodeCount > 0) {
              finalPageCount = rawNodeCount;
              console.log(`[StoryStore] Using raw node count as page count: ${finalPageCount}`);
            } else if (dbPageCount > 0) {
              finalPageCount = dbPageCount;
              console.log(`[StoryStore] Using database page count: ${finalPageCount}`);
            } else {
              console.log(`[StoryStore] Using default minimum page count: ${finalPageCount}`);
            }
            
            console.log("[StoryStore] Final page count decision:", {
              mappedPages,
              rawNodeCount,
              dbPageCount,
              finalDecision: finalPageCount
            });
            
            // Set mappings and page count in a single update to avoid multiple renders
            set({ 
              nodeMappings, 
              totalPages: finalPageCount
            });
            
            // Initialize story content with the appropriate start node
            const startNode = determineStartNode(currentStoryData);
            console.log(`[StoryStore] Determined start node: ${startNode}`);
            
            const startNodeData = currentStoryData[startNode];
            
            if (startNodeData && (typeof startNodeData.text === 'string' || startNodeData.text === '')) {
              console.log("[StoryStore] Setting initial node:", startNode);
              // Batch state updates into a single set call
              set({
                currentNode: startNode,
                currentText: startNodeData.text || '',
                currentChoices: startNodeData.choices || [],
                currentPage: 1,
                storyHistory: [], 
                canGoBack: false
              });
            } else {
              console.log("[StoryStore] No valid start node content found, using fallback");
              
              // If the start node doesn't have valid content, use the first valid node
              if (storyNodeKeys.length > 0) {
                const firstNode = storyNodeKeys[0];
                const firstNodeData = currentStoryData[firstNode];
                
                set({
                  currentNode: firstNode,
                  currentText: firstNodeData.text || '',
                  currentChoices: firstNodeData.choices || [],
                  currentPage: 1,
                  storyHistory: [], 
                  canGoBack: false
                });
              } else {
                // Ultimate fallback - create default content
                console.log("[StoryStore] No valid nodes found, using default content");
                set({
                  currentNode: 'default',
                  currentText: "Story begins...",
                  currentChoices: [],
                  currentPage: 1,
                  storyHistory: [], 
                  canGoBack: false
                });
              }
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
    const skipKeys = ['inkVersion', 'listDefs', '#f'];
    const storyNodeKeys = Object.keys(data).filter(key => {
      if (skipKeys.includes(key)) return false;
      
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
      const mappedPages = totalPages;
      const rawNodeCount = storyNodeKeys.length;
      
      // Decision tree for page count
      let finalPageCount = 1; // Default minimum
      
      if (mappedPages > 0) {
        finalPageCount = mappedPages;
        console.log(`[StoryStore] Using mapped flow-based page count: ${finalPageCount}`);
      } else if (rawNodeCount > 0) {
        finalPageCount = rawNodeCount;
        console.log(`[StoryStore] Using raw node count as page count: ${finalPageCount}`);
      } else {
        console.log(`[StoryStore] Using default minimum page count: ${finalPageCount}`);
      }
      
      console.log("[StoryStore] Updated page count decision:", {
        mappedPages,
        rawNodeCount,
        finalDecision: finalPageCount
      });
      
      // Update node mappings and page count
      set({ 
        nodeMappings, 
        totalPages: finalPageCount 
      });
    }, 300); // Debounce time
  },
});

// Helper function to determine the story's start node
function determineStartNode(storyData: any): string {
  // No data case
  if (!storyData) return 'root';
  
  // Check for explicit start node
  if (storyData.start && typeof storyData.start === 'object' && 
      (typeof storyData.start.text === 'string' || storyData.start.text === '')) {
    return 'start';
  }
  
  // Check for root node
  if (storyData.root && typeof storyData.root === 'object' && 
      (typeof storyData.root.text === 'string' || storyData.root.text === '')) {
    return 'root';
  }
  
  // Ink.js special format case
  if (storyData.inkVersion && Array.isArray(storyData.root)) {
    // For Ink.js, we'll use a special fragment naming convention
    return 'fragment_0';
  }
  
  // Last resort: find first valid content node
  for (const key of Object.keys(storyData)) {
    // Skip metadata keys
    if (['inkVersion', 'listDefs', '#f'].includes(key)) continue;
    
    const node = storyData[key];
    if (node && typeof node === 'object' && !Array.isArray(node) &&
        (typeof node.text === 'string' || Array.isArray(node.choices))) {
      return key;
    }
  }
  
  // Nothing found - fallback to 'root'
  return 'root';
}
