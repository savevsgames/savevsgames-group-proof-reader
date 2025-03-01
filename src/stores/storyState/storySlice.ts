
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
  
  // Initialize story data
  initializeStory: async (storyId) => {
    const store = get();
    
    // Prevent duplicate initializations
    if (store.storyId === storyId && !store.loading && store.storyData && store.totalPages > 0) {
      console.log("[StoryStore] Story already initialized with valid page count, skipping", {
        storyId,
        currentNodeMappings: store.nodeMappings ? Object.keys(store.nodeMappings.nodeToPage || {}).length : 0,
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
          dbTotalPages: data.total_pages || 0
        });
        
        // Store the title from the database
        set({ title: data.title || 'Untitled Story' });
        
        // Extract story content
        console.log("[StoryStore] Extracting story content");
        const storyContent = await extractStoryContent(data);
        
        if (storyContent) {
          console.log(`[StoryStore] Valid story content extracted with ${Object.keys(storyContent).length} nodes`);
          
          // Set story data first
          set({ storyData: storyContent, hasUnsavedChanges: false });
          
          // Now generate node mappings with improved page counting
          console.log("[StoryStore] Generating node mappings");
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(storyContent);
          
          // Determine the final page count, using DB value as fallback
          const finalPageCount = totalPages > 0 ? 
            totalPages : 
            (data.total_pages > 0 ? data.total_pages : 1); // Fallback to DB value or at least 1
          
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
          
          console.log("[StoryStore] Node mappings and page count set:", {
            mappedNodeCount: Object.keys(nodeMappings.nodeToPage).length,
            totalPages: finalPageCount
          });
          
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
          
          // Set default story with minimal mappings
          set({ 
            storyData: defaultStory,
            currentNode: 'root',
            currentText: defaultStory.root.text,
            currentChoices: [],
            hasUnsavedChanges: false 
          });
          
          // Create simple mapping for default story
          const nodeMappings = {
            nodeToPage: { 'root': 1 },
            pageToNode: { 1: 'root' }
          };
          
          // Always use at least 1 page for default story
          set({ 
            nodeMappings, 
            totalPages: 1
          });
          
          console.log("[StoryStore] Default state initialized with 1 page");
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
    
    // Ensure we have at least 1 page
    const finalPageCount = Math.max(totalPages, 1);
    
    console.log("[StoryStore] Updating state with new mappings:", {
      mappedNodeCount: Object.keys(nodeMappings.nodeToPage).length,
      finalPageCount
    });
    
    set({ 
      nodeMappings, 
      totalPages: finalPageCount 
    });
  },
});
