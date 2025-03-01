
import { StateCreator } from 'zustand';
import { StoryStore } from './types';

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
    const { storyData, currentNode, nodeMappings } = get();
    if (!storyData || !storyData[nodeName]) {
      console.error(`[StoryStore] Node "${nodeName}" not found in story data`);
      return;
    }
    
    // Add current node to history
    get().addToHistory(currentNode);
    
    // Set the new node and update content
    const nodeData = storyData[nodeName];
    
    // Batch state updates to reduce re-renders
    set({
      currentNode: nodeName,
      currentText: nodeData.text,
      currentChoices: nodeData.choices || [],
      currentPage: nodeMappings.nodeToPage[nodeName] || 1,
      currentStoryPosition: nodeMappings.nodeToPage[nodeName] || 1
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
    
    if (!storyData[prevNode]) {
      console.error(`[StoryStore] Previous node "${prevNode}" not found in story data`);
      set({
        storyHistory: newHistory,
        canGoBack: newHistory.length > 0
      });
      return;
    }
    
    const prevNodeData = storyData[prevNode];
    const { nodeMappings } = get();
    const prevPage = nodeMappings.nodeToPage[prevNode] || Math.max(get().currentPage - 1, 1);
    
    // Batch update to reduce re-renders
    set({
      storyHistory: newHistory,
      canGoBack: newHistory.length > 0,
      currentNode: prevNode,
      currentText: prevNodeData.text,
      currentChoices: prevNodeData.choices || [],
      currentPage: prevPage,
      currentStoryPosition: prevPage
    });
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
    
    if (!targetNode || !storyData || !storyData[targetNode]) {
      console.error(`[StoryStore] No valid node mapping found for page ${newPage}`);
      return;
    }
    
    // Add current node to history before changing
    get().addToHistory(get().currentNode);
    
    // Set new node data in a single batch update
    const nodeData = storyData[targetNode];
    set({
      currentNode: targetNode,
      currentText: nodeData.text,
      currentChoices: nodeData.choices || [],
      currentPage: newPage,
      currentStoryPosition: newPage
    });
  },
  
  handleNodeChange: async (nodeName) => {
    const { storyData, currentNode, nodeMappings } = get();
    
    if (!storyData || !storyData[nodeName]) {
      console.error(`[StoryStore] Node "${nodeName}" not found in story data`);
      return;
    }
    
    console.log(`[StoryStore] Changing to node: ${nodeName}`);
    
    // Add current node to history
    get().addToHistory(currentNode);
    
    // Set new node data in a single batch update
    const nodeData = storyData[nodeName];
    const page = nodeMappings.nodeToPage[nodeName] || 1;
    
    set({
      currentNode: nodeName,
      currentText: nodeData.text,
      currentChoices: nodeData.choices || [],
      currentPage: page,
      currentStoryPosition: page
    });
  },
  
  handleContinue: async () => {
    const { currentChoices } = get();
    
    if (currentChoices.length !== 1) return;
    
    // For single choice (continue), use the first choice
    await get().handleChoice(0);
  },
  
  handleChoice: async (index) => {
    const { 
      currentChoices, 
      storyData, 
      currentNode,
      nodeMappings
    } = get();
    
    if (!storyData || index < 0 || index >= currentChoices.length) {
      return;
    }
    
    const choice = currentChoices[index];
    
    if (!choice || !choice.nextNode || !storyData[choice.nextNode]) {
      console.error("[StoryStore] Invalid choice or nextNode not found in story data");
      return;
    }
    
    // Add current node to history before navigating
    get().addToHistory(currentNode);
    
    const nextNode = choice.nextNode;
    const nextNodeData = storyData[nextNode];
    const nextPage = nodeMappings.nodeToPage[nextNode] || Math.min(get().currentPage + 1, get().totalPages);
    
    // Single batch update
    set({
      currentNode: nextNode,
      currentText: nextNodeData.text,
      currentChoices: nextNodeData.choices || [],
      currentPage: nextPage,
      currentStoryPosition: nextPage
    });
  },
  
  handleRestart: async () => {
    const { storyData } = get();
    
    if (!storyData) return;
    
    console.log("[StoryStore] Restarting story");
    
    // Find start node
    const startNode = storyData.start ? 'start' : 'root';
    if (!storyData[startNode]) {
      console.error(`[StoryStore] Start node "${startNode}" not found`);
      return;
    }
    
    const startNodeData = storyData[startNode];
    
    // Batch all updates in a single state change
    set({
      storyHistory: [], 
      canGoBack: false,
      currentPage: 1,
      currentStoryPosition: 1,
      currentNode: startNode,
      currentText: startNodeData.text,
      currentChoices: startNodeData.choices || []
    });
  }
});

// Helper function to avoid circular dependencies
const generateAndLogNodeMappings = (storyData: any) => {
  // Re-import this here to avoid circular dependencies
  return require('@/lib/storyEditorUtils').generateAndLogNodeMappings(storyData);
};
