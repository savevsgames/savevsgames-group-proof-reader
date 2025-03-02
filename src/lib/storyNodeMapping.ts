
import { CustomStory, NodeMappings, StoryNode } from '@/types';

/**
 * Analyzes a story structure and generates node-to-page mappings
 * by following actual story flow through choices.
 */
export const analyzeStoryStructure = (storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  console.log("[StoryMapper] Starting story structure analysis");
  
  // Initialize mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Validate input
  if (!storyData) {
    console.warn("[StoryMapper] No story data provided");
    return { nodeToPage, pageToNode, totalPages: 0 };
  }
  
  // Skip metadata nodes
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Find start node
  let startNodeName = determineStartNode(storyData);
  console.log(`[StoryMapper] Determined start node: ${startNodeName}`);
  
  // Track visited nodes to handle cycles
  const visitedNodes = new Set<string>();
  
  // Queue for breadth-first traversal
  const nodeQueue: { nodeName: string; page: number }[] = [{ 
    nodeName: startNodeName, 
    page: 1 
  }];
  
  // Assign first page
  nodeToPage[startNodeName] = 1;
  pageToNode[1] = startNodeName;
  let currentPage = 1;
  
  // Breadth-first traversal of story nodes following choices
  while (nodeQueue.length > 0) {
    const { nodeName } = nodeQueue.shift()!;
    
    // Skip if already processed or invalid
    if (visitedNodes.has(nodeName) || 
        skipKeys.includes(nodeName) || 
        !storyData[nodeName]) {
      continue;
    }
    
    visitedNodes.add(nodeName);
    
    // Get node data
    const node = storyData[nodeName];
    if (!isValidStoryNode(node)) {
      console.warn(`[StoryMapper] Invalid node structure at "${nodeName}"`);
      continue;
    }
    
    // Process choices to find next nodes
    if (node.choices && Array.isArray(node.choices)) {
      node.choices.forEach(choice => {
        if (choice && choice.nextNode && !visitedNodes.has(choice.nextNode)) {
          // If this node exists and hasn't been mapped yet
          if (storyData[choice.nextNode] && !nodeToPage[choice.nextNode]) {
            currentPage++;
            nodeToPage[choice.nextNode] = currentPage;
            pageToNode[currentPage] = choice.nextNode;
            
            // Add to traversal queue
            nodeQueue.push({ 
              nodeName: choice.nextNode, 
              page: currentPage 
            });
            
            console.log(`[StoryMapper] Node "${choice.nextNode}" mapped to page ${currentPage}`);
          }
        }
      });
    }
    
    // Special case for Ink.js format nodes
    if (storyData.inkVersion && !node.choices && !node.isEnding) {
      // Try to find a logical next node
      const possibleNextNodes = findUnmappedNodes(storyData, skipKeys);
      
      if (possibleNextNodes.length > 0) {
        const nextNode = possibleNextNodes[0];
        currentPage++;
        nodeToPage[nextNode] = currentPage;
        pageToNode[currentPage] = nextNode;
        nodeQueue.push({ nodeName: nextNode, page: currentPage });
        console.log(`[StoryMapper] Found continuation node "${nextNode}" mapped to page ${currentPage}`);
      }
    }
  }
  
  // Ensure all valid story nodes are mapped
  // Find any unmapped nodes and assign pages
  const unmappedNodes = findUnmappedNodes(storyData, skipKeys, visitedNodes);
  
  unmappedNodes.forEach(nodeName => {
    currentPage++;
    nodeToPage[nodeName] = currentPage;
    pageToNode[currentPage] = nodeName;
    console.log(`[StoryMapper] Mapped orphaned node "${nodeName}" to page ${currentPage}`);
  });
  
  const totalMappedPages = Object.keys(pageToNode).length;
  console.log(`[StoryMapper] Completed mapping with ${totalMappedPages} total pages`);
  
  return { 
    nodeToPage, 
    pageToNode, 
    totalPages: totalMappedPages 
  };
};

/**
 * Helper function to find unmapped but valid story nodes
 */
function findUnmappedNodes(
  storyData: CustomStory, 
  skipKeys: string[], 
  visitedNodes?: Set<string>
): string[] {
  const result: string[] = [];
  
  Object.keys(storyData).forEach(key => {
    // Skip metadata keys and already visited nodes
    if (skipKeys.includes(key) || (visitedNodes && visitedNodes.has(key))) {
      return;
    }
    
    const node = storyData[key];
    if (isValidStoryNode(node)) {
      result.push(key);
    }
  });
  
  return result;
}

/**
 * Validate that a node has the correct structure to be a story node
 */
function isValidStoryNode(node: any): node is StoryNode {
  return (
    node && 
    typeof node === 'object' && 
    !Array.isArray(node) && 
    (typeof node.text === 'string' || Array.isArray(node.choices))
  );
}

/**
 * Determine the starting node for a story
 */
export function determineStartNode(storyData: CustomStory): string {
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

/**
 * Verify node mappings for completeness and consistency
 */
export const validateNodeMappings = (
  storyData: CustomStory, 
  nodeMappings: NodeMappings
): boolean => {
  if (!storyData || !nodeMappings) return false;
  
  const { nodeToPage, pageToNode } = nodeMappings;
  
  // Check if we have mappings at all
  if (Object.keys(nodeToPage).length === 0 || Object.keys(pageToNode).length === 0) {
    console.warn("[StoryMapper] Empty mappings detected");
    return false;
  }
  
  // Check for start node mapping
  const startNode = determineStartNode(storyData);
  if (!nodeToPage[startNode]) {
    console.warn(`[StoryMapper] Start node "${startNode}" not mapped`);
    return false;
  }
  
  // Check bidirectional consistency
  for (const [node, page] of Object.entries(nodeToPage)) {
    // Node to page to node should get back the same node
    const mappedBack = pageToNode[page];
    if (mappedBack !== node) {
      console.warn(`[StoryMapper] Inconsistent mapping for node "${node}" and page ${page}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Generate comprehensive node mappings with improved flow tracking
 */
export const generateComprehensiveNodeMapping = (storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  // Use the advanced story structure analysis
  const result = analyzeStoryStructure(storyData);
  
  // Validate the mappings
  const isValid = validateNodeMappings(storyData, {
    nodeToPage: result.nodeToPage,
    pageToNode: result.pageToNode
  });
  
  if (!isValid) {
    console.warn("[StoryMapper] Generated invalid mappings, attempting fallback method");
    
    // Simple fallback for invalid mappings
    const nodeToPage: Record<string, number> = {};
    const pageToNode: Record<number, string> = {};
    
    // Use basic enumeration
    const validNodes = Object.keys(storyData).filter(key => {
      if (['inkVersion', 'listDefs', '#f'].includes(key)) return false;
      
      const node = storyData[key];
      return (
        node && 
        typeof node === 'object' && 
        !Array.isArray(node) && 
        (typeof node.text === 'string' || Array.isArray(node.choices))
      );
    });
    
    validNodes.forEach((node, index) => {
      const page = index + 1;
      nodeToPage[node] = page;
      pageToNode[page] = node;
    });
    
    console.log(`[StoryMapper] Fallback mapping generated ${validNodes.length} pages`);
    
    return {
      nodeToPage,
      pageToNode,
      totalPages: validNodes.length
    };
  }
  
  return result;
};
