
import { StateCreator } from 'zustand';
import { StoryStore } from './types';
import { fetchCommentCount } from '@/lib/storyUtils';

// Slice for navigation-related state and actions
export const createNavigationSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 
    'currentNode' | 'currentPage' | 'totalPages' | 'currentText' | 'currentChoices' |
    'canContinue' | 'storyHistory' | 'canGoBack' | 'currentStoryPosition' | 'nodeMappings' |
    'setCurrentPage' | 'setCurrentNode' | 'navigateToNode' | 'setCurrentText' | 
    'setCurrentChoices' | 'setCanContinue' | 'addToHistory' | 'clearHistory' | 'goBack' |
    'setCurrentStoryPosition' | 'updateNodeMappings' | 'handlePageChange' | 
    'handleNodeChange' | 'handleContinue' | 'handleChoice' | 'handleRestart'
  >
> = (set, get) => ({
  // Navigation state
  currentNode: 'root',
  currentPage: 1,
  totalPages: 1,
  currentText: '',
  currentChoices: [],
  canContinue: false,
  storyHistory: [],
  canGoBack: false,
  currentStoryPosition: 1,
  nodeMappings: {
    nodeToPage: {},
    pageToNode: {}
  },
  
  // Setters
  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentNode: (node) => set({ currentNode: node }),
  setCurrentText: (text) => set({ currentText: text }),
  setCurrentChoices: (choices) => set({ currentChoices: choices }),
  setCanContinue: (canContinue) => set({ canContinue }),
  setCurrentStoryPosition: (position) => set({ currentStoryPosition: position }),
  
  // Node mapping actions
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
  },
  
  // History management
  addToHistory: (node) => set((state) => ({ 
    storyHistory: [...state.storyHistory, node],
    canGoBack: true
  })),
  
  clearHistory: () => set({ 
    storyHistory: [], 
    canGoBack: false 
  }),
  
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
    }
  },
  
  // Compound navigation actions
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
  }
});

// Helper function to avoid circular dependencies
const generateAndLogNodeMappings = (storyData: any) => {
  // Re-import this here to avoid circular dependencies
  return require('@/lib/storyEditorUtils').generateAndLogNodeMappings(storyData);
};
