
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { StoryStore } from './types';
import { generateAndLogNodeMappings, extractStoryContent } from '@/lib/storyEditorUtils';
import { supabase } from '@/lib/supabase';
import { fetchCommentCount } from '@/lib/storyUtils';

const initialState: Omit<StoryStore, keyof StoryActions> = {
  storyId: null,
  story: null,
  storyData: null,
  title: 'Untitled Story',
  
  nodeMappings: {
    nodeToPage: {},
    pageToNode: {}
  },
  totalPages: 1,
  currentPage: 1,
  currentNode: 'root',
  
  currentText: '',
  currentChoices: [],
  canContinue: false,
  
  storyHistory: [],
  canGoBack: false,
  
  loading: false,
  saving: false,
  error: null,
  hasUnsavedChanges: false,
  commentCount: 0,
  currentStoryPosition: 1,
  
  usingCustomFormat: true
};

export const useStoryStore = create<StoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Basic setters
        setStoryId: (id) => set({ storyId: id }),
        setStoryData: (data) => set({ storyData: data }),
        setInkStory: (story) => set({ story }),
        setTitle: (title) => set({ title }),
        setCurrentPage: (page) => set({ currentPage: page }),
        setCurrentNode: (node) => set({ currentNode: node }),
        setCurrentText: (text) => set({ currentText: text }),
        setCurrentChoices: (choices) => set({ currentChoices: choices }),
        setCanContinue: (canContinue) => set({ canContinue }),
        setLoading: (loading) => set({ loading }),
        setSaving: (saving) => set({ saving }),
        setError: (error) => set({ error }),
        setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
        setCommentCount: (count) => set({ commentCount: count }),
        setCurrentStoryPosition: (position) => set({ currentStoryPosition: position }),
        
        // History management
        addToHistory: (node) => set((state) => ({ 
          storyHistory: [...state.storyHistory, node],
          canGoBack: true
        })),
        clearHistory: () => set({ storyHistory: [], canGoBack: false }),
        goBack: () => {
          const { storyHistory, storyData } = get();
          
          if (storyHistory.length === 0 || !storyData) return;
          
          const newHistory = [...storyHistory];
          const prevNode = newHistory.pop() as string;
          
          set({
            storyHistory: newHistory,
            canGoBack: newHistory.length > 0,
            currentNode: prevNode
          });
          
          if (storyData[prevNode]) {
            const prevNodeData = storyData[prevNode];
            set({
              currentText: prevNodeData.text,
              currentChoices: prevNodeData.choices || []
            });
            
            // Update page using node mappings
            const { nodeMappings } = get();
            const prevPage = nodeMappings.nodeToPage[prevNode] || Math.max(get().currentPage - 1, 1);
            
            set({
              currentPage: prevPage,
              currentStoryPosition: prevPage
            });
            
            // Update comment count
            const storyId = get().storyId;
            if (storyId) {
              fetchCommentCount(storyId, prevPage).then(count => 
                set({ commentCount: count })
              );
            }
          }
        },
        
        // Node mappings
        updateNodeMappings: () => {
          const { storyData } = get();
          if (!storyData) return;
          
          console.log("[StoryStore] Updating node mappings");
          const { nodeMappings, totalPages } = generateAndLogNodeMappings(storyData);
          
          console.log(`[StoryStore] Generated ${Object.keys(nodeMappings.nodeToPage).length} node mappings over ${totalPages} pages`);
          set({ nodeMappings, totalPages });
        },
        
        // Navigation
        navigateToNode: (nodeName) => {
          const { storyData, currentNode } = get();
          if (!storyData || !storyData[nodeName]) {
            console.error(`[StoryStore] Node "${nodeName}" not found in story data`);
            return;
          }
          
          // Add current node to history
          get().addToHistory(currentNode);
          
          // Set the new node and update content
          const nodeData = storyData[nodeName];
          set({
            currentNode: nodeName,
            currentText: nodeData.text,
            currentChoices: nodeData.choices || []
          });
          
          // Update page using node mappings
          const { nodeMappings } = get();
          const page = nodeMappings.nodeToPage[nodeName] || 1;
          
          set({
            currentPage: page,
            currentStoryPosition: page
          });
          
          // Update comment count
          const storyId = get().storyId;
          if (storyId) {
            fetchCommentCount(storyId, page).then(count => 
              set({ commentCount: count })
            );
          }
        },
        
        // Compound actions
        initializeStory: async (storyId) => {
          const store = get();
          
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
        
        handlePageChange: async (newPage) => {
          const { 
            currentPage, 
            nodeMappings, 
            totalPages,
            storyData,
            storyId
          } = get();
          
          if (!storyId || newPage === currentPage || newPage < 1 || newPage > totalPages) {
            console.log(`[StoryStore] Invalid page navigation: current=${currentPage}, target=${newPage}, max=${totalPages}`);
            return;
          }
          
          console.log(`[StoryStore] Navigating to page ${newPage} (current: ${currentPage})`);
          
          // Get the target node for this page
          const targetNode = nodeMappings.pageToNode[newPage];
          
          if (!targetNode) {
            console.error(`[StoryStore] No node mapping found for page ${newPage}`);
            return;
          }
          
          if (storyData && storyData[targetNode]) {
            console.log(`[StoryStore] Found node ${targetNode} for page ${newPage}`);
            
            // Add current node to history before changing
            get().addToHistory(get().currentNode);
            
            // Set new node data
            const nodeData = storyData[targetNode];
            set({
              currentNode: targetNode,
              currentText: nodeData.text,
              currentChoices: nodeData.choices || [],
              currentPage: newPage,
              currentStoryPosition: newPage
            });
            
            // Update comment count
            if (storyId) {
              const count = await fetchCommentCount(storyId, newPage);
              set({ commentCount: count });
            }
          } else {
            console.error(`[StoryStore] Node "${targetNode}" not found in story data`);
          }
        },
        
        handleNodeChange: async (nodeName) => {
          const { storyData, currentNode } = get();
          
          if (!storyData || !storyData[nodeName]) {
            console.error(`[StoryStore] Node "${nodeName}" not found in story data`);
            return;
          }
          
          console.log(`[StoryStore] Changing to node: ${nodeName}`);
          
          // Add current node to history
          get().addToHistory(currentNode);
          
          // Set new node data
          const nodeData = storyData[nodeName];
          set({
            currentNode: nodeName,
            currentText: nodeData.text,
            currentChoices: nodeData.choices || []
          });
          
          // Update page using node mappings
          const { nodeMappings, storyId } = get();
          const page = nodeMappings.nodeToPage[nodeName] || 1;
          
          set({
            currentPage: page,
            currentStoryPosition: page
          });
          
          // Update comment count
          if (storyId) {
            const count = await fetchCommentCount(storyId, page);
            set({ commentCount: count });
          }
        },
        
        handleSave: async () => {
          const { storyId, storyData, hasUnsavedChanges } = get();
          
          if (!storyId || !storyData || !hasUnsavedChanges) {
            console.log("[StoryStore] No story to save or no changes");
            return;
          }
          
          console.log("[StoryStore] Saving story");
          set({ saving: true });
          
          try {
            const storyContent = JSON.stringify(storyData);
            
            const { error } = await supabase
              .from("books")
              .update({ story_content: storyContent })
              .eq("id", storyId);
              
            if (error) {
              console.error("[StoryStore] Error saving story:", error);
              set({ error: `Failed to save: ${error.message}` });
              return;
            }
            
            console.log("[StoryStore] Story saved successfully");
            set({ hasUnsavedChanges: false });
          } catch (error: any) {
            console.error("[StoryStore] Error in save operation:", error);
            set({ error: `Save error: ${error.message}` });
          } finally {
            set({ saving: false });
          }
        },
        
        handleContinue: async () => {
          const { currentChoices, storyData, storyId } = get();
          
          if (!storyData || !storyId || currentChoices.length !== 1) return;
          
          // For single choice (continue), use the first choice
          await get().handleChoice(0);
        },
        
        handleChoice: async (index) => {
          const { 
            currentChoices, 
            storyData, 
            storyId, 
            currentNode
          } = get();
          
          if (!storyData || !storyId || index < 0 || index >= currentChoices.length) {
            return;
          }
          
          const choice = currentChoices[index];
          
          if (choice && choice.nextNode) {
            // Add current node to history before navigating
            get().addToHistory(currentNode);
            
            const nextNode = choice.nextNode;
            const nextNodeData = storyData[nextNode];
            
            if (nextNodeData) {
              // Update node and content
              set({
                currentNode: nextNode,
                currentText: nextNodeData.text,
                currentChoices: nextNodeData.choices || []
              });
              
              // Update page using node mappings
              const { nodeMappings } = get();
              const nextPage = nodeMappings.nodeToPage[nextNode];
              
              if (nextPage) {
                console.log(`[StoryStore] Choice navigation: node ${nextNode} maps to page ${nextPage}`);
                set({
                  currentPage: nextPage,
                  currentStoryPosition: nextPage
                });
              } else {
                console.warn(`[StoryStore] No page mapping for node ${nextNode}, using incremental page`);
                const newPage = Math.min(get().currentPage + 1, get().totalPages);
                set({
                  currentPage: newPage,
                  currentStoryPosition: newPage
                });
              }
              
              // Update comment count
              const count = await fetchCommentCount(storyId, get().currentPage);
              set({ commentCount: count });
            } else {
              console.error(`[StoryStore] Node "${nextNode}" not found in story`);
            }
          } else {
            console.error("[StoryStore] Invalid choice, no nextNode specified");
          }
        },
        
        handleRestart: async () => {
          const { storyData, storyId } = get();
          
          if (!storyData || !storyId) return;
          
          console.log("[StoryStore] Restarting story");
          
          // Reset history
          set({ 
            storyHistory: [], 
            canGoBack: false,
            currentPage: 1,
            currentStoryPosition: 1
          });
          
          // Reset to start node
          const startNode = storyData.start ? 'start' : 'root';
          const startNodeData = storyData[startNode];
          
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
          
          // Update comment count
          const count = await fetchCommentCount(storyId, 1);
          set({ commentCount: count });
        }
      }),
      {
        name: 'story-storage',
        partialize: (state) => ({ 
          storyId: state.storyId,
          title: state.title,
          currentPage: state.currentPage
        })
      }
    )
  )
);
