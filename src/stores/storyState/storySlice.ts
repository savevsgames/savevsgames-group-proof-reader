
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
          dbTotalPages: data.total_pages,
          rawData: JSON.stringify(data).substring(0, 200) + '...' // Log a preview of the data
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
          
          // Log detailed structure of first node to help diagnose issues
          const firstNodeKey = Object.keys(storyContent)[0];
          const firstNode = storyContent[firstNodeKey];
          console.log(`[StoryStore] First node "${firstNodeKey}" details:`, {
            hasText: !!firstNode.text,
            textLength: firstNode.text?.length || 0,
            hasChoices: Array.isArray(firstNode.choices),
            choicesCount: firstNode.choices?.length || 0,
            firstChoiceText: firstNode.choices?.[0]?.text || 'none',
            isEnding: !!firstNode.isEnding
          });
          
          set({ storyData: storyContent, hasUnsavedChanges: false });
          
          // Update node mappings with enhanced debugging
          console.log("[StoryStore] Generating node mappings");
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(storyContent);
          
          console.log("[StoryStore] Node mappings generated:", {
            nodeCount: Object.keys(nodeMappings.nodeToPage).length,
            pageCount: totalPages,
            firstNodeName: Object.keys(nodeMappings.nodeToPage)[0],
            firstNodePage: nodeMappings.nodeToPage[Object.keys(nodeMappings.nodeToPage)[0]]
          });
          
          // Check for valid mappings before setting state
          if (totalPages === 0 && Object.keys(storyContent).length > 0) {
            console.warn("[StoryStore] Warning: totalPages is 0 despite having story content!");
            
            // Count content nodes manually as a fallback
            const contentNodeCount = Object.keys(storyContent).filter(key => 
              key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
            ).length;
            
            console.log(`[StoryStore] Manual content node count: ${contentNodeCount}`);
            
            // Use manual count if mapping failed
            if (contentNodeCount > 0) {
              console.log(`[StoryStore] Using manual count (${contentNodeCount}) as fallback for totalPages`);
              set({ 
                nodeMappings, 
                totalPages: contentNodeCount 
              });
            } else {
              // Set at least 1 page as absolute fallback
              console.log("[StoryStore] Using absolute fallback of 1 for totalPages");
              set({ 
                nodeMappings, 
                totalPages: 1 
              });
            }
          } else {
            set({ nodeMappings, totalPages });
          }
          
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
          
          // Always ensure at least 1 page for default story
          set({ 
            nodeMappings, 
            totalPages: Math.max(totalPages, 1)  // Ensure at least 1 page
          });
          
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
    
    // Ensure we have at least 1 page if we have data
    if (totalPages === 0 && Object.keys(data).length > 0) {
      console.warn("[StoryStore] totalPages is 0 despite having story data");
      
      // Count content nodes manually
      const contentNodeCount = Object.keys(data).filter(key => 
        key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
      ).length;
      
      console.log(`[StoryStore] Manual content node count: ${contentNodeCount}`);
      
      // Use manual count or minimum of 1
      const finalPageCount = Math.max(contentNodeCount, 1);
      console.log(`[StoryStore] Using finalPageCount: ${finalPageCount}`);
      
      set({ 
        nodeMappings, 
        totalPages: finalPageCount 
      });
    } else {
      set({ nodeMappings, totalPages });
    }
    
    console.log("[StoryStore] State updated after data change:", {
      totalPages: get().totalPages,
      hasNodeMappings: !!get().nodeMappings && Object.keys(get().nodeMappings.nodeToPage || {}).length > 0
    });
  },
});
