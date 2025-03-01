
import { fetchCommentCount } from "@/lib/storyUtils";
import { NavigationState } from "./types";

/**
 * Initializes a custom story format with the provided data
 */
export const initializeCustomStory = (
  storyData: any,
  setCurrentNode: (node: string) => void,
  setCurrentText: (text: string) => void,
  setCurrentChoices: (choices: any[]) => void
): void => {
  const startNode = storyData.start ? 'start' : 'root';
  setCurrentNode(startNode);
  
  const startNodeData = storyData[startNode];
  if (startNodeData && startNodeData.text) {
    setCurrentText(startNodeData.text);
    setCurrentChoices(startNodeData.choices || []);
  } else {
    setCurrentText("Story begins...");
    setCurrentChoices([]);
  }
};

/**
 * Handle choice selection in a custom story format
 */
export const handleCustomChoice = async (
  nextNode: string,
  storyData: any,
  storyId: string | undefined,
  currentNode: string,
  currentPage: number,
  nodeMappings: any,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentNode: (node: string) => void,
    setCurrentText: (text: string) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!storyData || !storyId) return;

  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentNode,
    setCurrentText,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;

  setStoryHistory(prev => [...prev, currentNode]);
  setCanGoBack(true);

  const nextStoryNode = storyData[nextNode];
  if (nextStoryNode) {
    setCurrentNode(nextNode);
    setCurrentText(nextStoryNode.text);
    setCurrentChoices(nextStoryNode.choices || []);
    
    // Update page using node mappings
    const nextPage = nodeMappings.nodeToPage[nextNode];
    
    if (nextPage) {
      console.log(`Choice navigation: node ${nextNode} maps to page ${nextPage}`);
      setCurrentPage(nextPage);
      setCurrentStoryPosition(nextPage);
    } else {
      console.warn(`No page mapping for node ${nextNode}, using incremental page`);
      const newPage = Math.min(currentPage + 1, Object.keys(nodeMappings.pageToNode).length);
      setCurrentPage(newPage);
      setCurrentStoryPosition(newPage);
    }
    
    const count = await fetchCommentCount(storyId, currentPage);
    setCommentCount(count);
  } else {
    console.error(`Node "${nextNode}" not found in story`);
  }
};

/**
 * Handle going back in a custom story
 */
export const handleCustomBack = async (
  storyHistory: string[],
  storyData: any,
  storyId: string | undefined,
  currentPage: number,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentNode: (node: string) => void,
    setCurrentText: (text: string) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!storyId || storyHistory.length === 0 || !storyData) return;

  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentNode,
    setCurrentText,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;

  const newHistory = [...storyHistory];
  const prevNode = newHistory.pop() as string;
  
  // Fix: Use a function to update state instead of passing an array directly
  setStoryHistory(prev => newHistory);
  setCanGoBack(newHistory.length > 0);
  
  // Determine previous page
  const prevPage = Math.max(currentPage - 1, 1);
  console.log(`Back navigation: Page ${currentPage} → ${prevPage}`);
  
  setCurrentPage(prevPage);
  setCurrentStoryPosition(prevPage);
  
  if (storyData[prevNode]) {
    setCurrentNode(prevNode);
    
    const textContent = storyData[prevNode].text;
    setCurrentText(textContent + " ");
    setTimeout(() => setCurrentText(textContent), 10);
    
    setCurrentChoices(storyData[prevNode].choices || []);
    
    const count = await fetchCommentCount(storyId, prevPage);
    setCommentCount(count);
  } else {
    console.error(`Back navigation error: Node "${prevNode}" not found`);
  }
};

/**
 * Restart a custom story
 */
export const restartCustomStory = async (
  storyData: any,
  storyId: string | undefined,
  setters: {
    setStoryHistory: (history: string[] | ((prev: string[]) => string[])) => void,
    setCanGoBack: (canGoBack: boolean) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCurrentNode: (node: string) => void,
    setCurrentText: (text: string) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!storyId || !storyData) return;
  
  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentPage,
    setCurrentStoryPosition,
    setCurrentNode,
    setCurrentText,
    setCurrentChoices,
    setCommentCount
  } = setters;
  
  // Fix: Use a function to update state
  setStoryHistory(() => []);
  setCanGoBack(false);
  
  // Always reset to page 1
  setCurrentPage(1);
  setCurrentStoryPosition(1);
  
  const startNode = storyData.start ? 'start' : 'root';
  setCurrentNode(startNode);
  
  const startNodeData = storyData[startNode];
  if (startNodeData && startNodeData.text) {
    setCurrentText(startNodeData.text);
    setCurrentChoices(startNodeData.choices || []);
  } else {
    setCurrentText("Story begins...");
    setCurrentChoices([]);
  }

  const count = await fetchCommentCount(storyId, 1);
  setCommentCount(count);
};

/**
 * Handle page change in a custom story
 */
export const handleCustomPageChange = async (
  newPage: number,
  currentPage: number,
  currentNode: string,
  totalPages: number,
  nodeMappings: any,
  storyData: any,
  storyId: string | undefined,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentNode: (node: string) => void,
    setCurrentText: (text: string) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!storyId || newPage === currentPage || newPage < 1 || newPage > totalPages || !storyData) return;
  
  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentNode,
    setCurrentText,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;
  
  console.log(`Navigating to page ${newPage} (current: ${currentPage})`);
  
  // Get the target node for this page
  const targetNode = nodeMappings.pageToNode[newPage];
  
  if (!targetNode) {
    console.error(`No node mapping found for page ${newPage}`);
    return;
  }
  
  // Save current state for back navigation
  setStoryHistory(prev => [...prev, currentNode]);
  setCanGoBack(true);
  
  if (storyData[targetNode]) {
    console.log(`Found node ${targetNode} for page ${newPage}`);
    
    setCurrentNode(targetNode);
    setCurrentText(storyData[targetNode].text);
    setCurrentChoices(storyData[targetNode].choices || []);
    
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
    
    const count = await fetchCommentCount(storyId, newPage);
    setCommentCount(count);
  } else {
    console.error(`Node "${targetNode}" not found in story data`);
  }
};
