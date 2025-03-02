
import { StateCreator } from 'zustand';
import { StoryStore } from '@/types/story-types.definitions';
import { shallow } from 'zustand/shallow';

// Slice for navigation-related state and actions with improved update logic
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
  
  // Setters with improved validation and state comparison
  setCurrentPage: (page) => {
    // Validate input more thoroughly
    if (
      !page || 
      typeof page !== 'number' || 
      page < 1 || 
      page > get().totalPages || 
      page === get().currentPage
    ) {
      return;
    }
    
    // Single update to avoid cascading renders
    set({ currentPage: page });
  },
  
  setCurrentNode: (node) => {
    // Handle validation and reference equality check
    if (!node || typeof node !== 'string' || get().currentNode === node) return;
    set({ currentNode: node });
  },
  
  setCurrentText: (text) => {
    // Skip update if text hasn't changed
    if (get().currentText === text) return;
    set({ currentText: text });
  },
  
  setCurrentChoices: (choices) => {
    // Deep comparison to prevent unnecessary updates
    const currentChoices = get().currentChoices;
    if (shallow(currentChoices, choices)) return;
    
    set({ currentChoices: choices });
  },
  
  setCanContinue: (canContinue) => {
    if (get().canContinue === canContinue) return;
    set({ canContinue });
  },
  
  setCurrentStoryPosition: (position) => {
    if (!position || typeof position !== 'number' || position < 1 || get().currentStoryPosition === position) return;
    set({ currentStoryPosition: position });
  },
  
  // Node mapping actions with added validation
  updateNodeMappings: () => {
    const { storyData } = get();
    if (!storyData) return;
    
    console.log("[StoryStore] Updating node mappings");
    
    // Use a debounced approach to prevent rapid updates
    const requestId = Date.now();
    (get() as any)._lastNodeMappingRequestId = requestId;
    
    setTimeout(() => {
      // Only process if this is still the latest request
      if ((get() as any)._lastNodeMappingRequestId !== requestId) return;
      
      const { nodeMappings, totalPages } = generateAndLogNodeMappings(get().storyData!);
      
      // Compare current values before updating
      const currentNodeMappingsKeys = Object.keys(get().nodeMappings.nodeToPage || {}).length;
      const newNodeMappingsKeys = Object.keys(nodeMappings.nodeToPage).length;
      const currentTotalPages = get().totalPages;
      
      // Only update if there's a meaningful change
      if (currentNodeMappingsKeys !== newNodeMappingsKeys || currentTotalPages !== totalPages) {
        console.log(`[StoryStore] Generated ${newNodeMappingsKeys} node mappings over ${totalPages} pages`);
        set({ nodeMappings, totalPages });
      } else {
        console.log("[StoryStore] Node mappings unchanged, skipping update");
      }
    }, 250);
  },
  
  // Navigation with improved validation
  navigateToNode: (nodeName) => {
    const { storyData, currentNode, nodeMappings } = get();
    
    // Enhanced validation
    if (
      !storyData || 
      !nodeName || 
      !storyData[nodeName] || 
      currentNode === nodeName
    ) {
      console.error(`[StoryStore] Node "${nodeName}" not found in story data or already on this node`);
      return;
    }
    
    // Add current node to history
    get().addToHistory(currentNode);
    
    // Set the new node and update content in a single batch update
    const nodeData = storyData[nodeName];
    const targetPage = nodeMappings.nodeToPage[nodeName] || 1;
    
    // Batch state updates to reduce re-renders
    set({
      currentNode: nodeName,
      currentText: nodeData.text,
      currentChoices: nodeData.choices || [],
      currentPage: targetPage,
      currentStoryPosition: targetPage
    });
  },
  
  // History management with improved validation
  addToHistory: (node) => {
    const { storyHistory } = get();
    
    // Enhanced validation
    if (
      !node || 
      (storyHistory.length > 0 && storyHistory[storyHistory.length - 1] === node)
    ) {
      return;
    }
    
    set((state) => ({ 
      storyHistory: [...state.storyHistory, node],
      canGoBack: true
    }));
  },
  
  clearHistory: () => set({ 
    storyHistory: [], 
    canGoBack: false 
  }),
  
  goBack: () => {
    const { storyHistory, storyData } = get();
    
    // Enhanced validation
    if (storyHistory.length === 0 || !storyData) return;
    
    const newHistory = [...storyHistory];
    const prevNode = newHistory.pop() as string;
    
    // Enhanced validation for previous node
    if (!prevNode || !storyData[prevNode]) {
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
    
    // Enhanced validation
    if (
      !storyId || 
      !newPage || 
      typeof newPage !== 'number' || 
      newPage === currentPage || 
      newPage < 1 || 
      newPage > totalPages ||
      !nodeMappings ||
      !nodeMappings.pageToNode ||
      !storyData
    ) {
      console.log(`[StoryStore] Invalid page navigation: current=${currentPage}, target=${newPage}, max=${totalPages}`);
      return;
    }
    
    console.log(`[StoryStore] Navigating to page ${newPage} (current: ${currentPage})`);
    
    // Get the target node for this page
    const targetNode = nodeMappings.pageToNode[newPage];
    
    // Enhanced validation for target node
    if (!targetNode || !storyData[targetNode]) {
      console.error(`[StoryStore] No valid node mapping found for page ${newPage}`);
      return;
    }
    
    // Add current node to history before changing
    get().addToHistory(get().currentNode);
    
    // Extract node data
    const nodeData = storyData[targetNode];
    
    // Batch update to reduce re-renders
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
    
    // Enhanced validation
    if (
      !storyData || 
      !nodeName || 
      !storyData[nodeName] || 
      currentNode === nodeName
    ) {
      console.error(`[StoryStore] Node "${nodeName}" not found in story data or already on this node`);
      return;
    }
    
    console.log(`[StoryStore] Changing to node: ${nodeName}`);
    
    // Add current node to history
    get().addToHistory(currentNode);
    
    // Set new node data in a single batch update
    const nodeData = storyData[nodeName];
    const page = nodeMappings.nodeToPage[nodeName] || 1;
    
    // Batch all updates
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
    
    // Enhanced validation
    if (!currentChoices || currentChoices.length !== 1) return;
    
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
    
    // Enhanced validation
    if (
      !storyData || 
      !currentChoices || 
      typeof index !== 'number' || 
      index < 0 || 
      index >= currentChoices.length
    ) {
      return;
    }
    
    const choice = currentChoices[index];
    
    // Enhanced validation for choice
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
    
    // Enhanced validation
    if (!storyData) return;
    
    console.log("[StoryStore] Restarting story");
    
    // Find start node
    const startNode = storyData.start ? 'start' : 'root';
    
    // Enhanced validation for start node
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
