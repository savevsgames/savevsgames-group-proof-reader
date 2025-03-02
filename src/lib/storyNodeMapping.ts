import { CustomStory, NodeMappings, StoryNode } from '@/types';

// Debug tracking array for node creation
const debugNodes: Array<{
  id: string,
  type: string,
  content: string | null,
  hasChoices: boolean,
  nextNodes: string[]
}> = [];

/**
 * Logs a newly created node for debugging, with a limit to prevent console overflow
 */
function logNodeCreation(nodeInfo: {
  id: string,
  type: string,
  content: string | null,
  hasChoices: boolean,
  nextNodes: string[]
}) {
  if (debugNodes.length >= 100) return;
  
  debugNodes.push(nodeInfo);
  console.log(`[NodeMapper] Created node #${debugNodes.length}:`, {
    id: nodeInfo.id,
    type: nodeInfo.type,
    contentPreview: nodeInfo.content ? nodeInfo.content.substring(0, 50) + (nodeInfo.content.length > 50 ? '...' : '') : null,
    hasChoices: nodeInfo.hasChoices,
    nextNodes: nodeInfo.nextNodes
  });
}

/**
 * Clears the debug nodes array
 */
function clearDebugNodes() {
  debugNodes.length = 0;
  console.log("[NodeMapper] Debug node tracking reset");
}

/**
 * Gets the current debug nodes (limited to first 100)
 */
export function getDebugNodes() {
  return [...debugNodes];
}

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
  
  // Reset debug tracking
  clearDebugNodes();
  
  // Initialize mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Validate input
  if (!storyData) {
    console.warn("[StoryMapper] No story data provided");
    return { nodeToPage, pageToNode, totalPages: 0 };
  }
  
  // Check for Ink.js format
  const isInkFormat = storyData.inkVersion && Array.isArray(storyData.root);
  
  if (isInkFormat) {
    console.log("[StoryMapper] Detected Ink.js format, using specialized approach");
    return analyzeInkStoryStructure(storyData);
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
 * Specialized analyzer for Ink.js format stories that processes the root array structure
 */
function analyzeInkStoryStructure(storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} {
  console.log("[InkMapper] Starting specialized Ink.js structure analysis with detailed page extraction");
  
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Get the root array which contains the story
  const rootArray = storyData.root;
  
  if (!Array.isArray(rootArray)) {
    console.warn("[InkMapper] Root is not an array - invalid Ink.js format");
    return { nodeToPage, pageToNode, totalPages: 0 };
  }
  
  console.log("[InkMapper] Root array structure:", {
    length: rootArray.length,
    firstElement: rootArray[0] ? JSON.stringify(rootArray[0]).substring(0, 100) : 'null',
    secondElement: rootArray[1] ? JSON.stringify(rootArray[1]).substring(0, 100) : 'null',
    thirdElement: rootArray[2] ? JSON.stringify(rootArray[2]).substring(0, 100) : 'null'
  });
  
  // Create initial node structures with flow tracking
  const storySegments = extractStorySegmentsFromInk(rootArray);
  console.log(`[InkMapper] Extracted ${storySegments.length} story segments from Ink root`);
  
  // Debug: show first 3 segments in detail
  const sampleSegments = storySegments.slice(0, 3);
  console.log("[InkMapper] Sample segments (first 3):", 
    sampleSegments.map(segment => ({
      id: segment.id,
      textPreview: segment.text.substring(0, 50) + (segment.text.length > 50 ? '...' : ''),
      nextSegment: segment.nextSegment,
      segmentType: segment.text.includes("?") ? "question" : "narrative"
    }))
  );

  // Convert segments to nodes and track them in custom story format
  const customStory: CustomStory = {};
  storySegments.forEach((segment, index) => {
    // Use fragment IDs for node keys
    const nodeKey = `fragment_${index}`;
    
    // Create the story node
    customStory[nodeKey] = {
      text: segment.text,
      choices: segment.nextSegment !== null ? [{
        text: "Continue",
        nextNode: `fragment_${segment.nextSegment}`
      }] : [],
      isEnding: segment.nextSegment === null
    };
    
    // Log node creation for debugging
    logNodeCreation({
      id: nodeKey,
      type: "ink_segment",
      content: segment.text,
      hasChoices: segment.nextSegment !== null,
      nextNodes: segment.nextSegment !== null ? [`fragment_${segment.nextSegment}`] : []
    });

    // Create the page mapping
    const page = index + 1;
    nodeToPage[nodeKey] = page;
    pageToNode[page] = nodeKey;
    
    console.log(`[InkMapper] Mapped segment ${index} to page ${page} with node key ${nodeKey}`, {
      textPreview: segment.text.substring(0, 50) + (segment.text.length > 50 ? '...' : ''),
      hasNextPage: segment.nextSegment !== null,
      nextPage: segment.nextSegment !== null ? segment.nextSegment + 1 : null
    });
  });
  
  // Also inject the extracted story into the main object for use by the rest of the system
  Object.keys(customStory).forEach(key => {
    storyData[key] = customStory[key];
  });
  
  // Set the initial node as the start node
  if (Object.keys(customStory).length > 0) {
    storyData['start'] = customStory['fragment_0'];
    console.log("[InkMapper] Set fragment_0 as the start node");
  }
  
  const totalPages = storySegments.length;
  console.log(`[InkMapper] Completed mapping with ${totalPages} total pages`);
  
  return {
    nodeToPage,
    pageToNode,
    totalPages: totalPages > 0 ? totalPages : 1 // Ensure at least 1 page
  };
}

/**
 * Extracts story segments from Ink.js root array
 * Properly handles text content without incorrectly adding "IMAGE:" prefixes
 */
function extractStorySegmentsFromInk(rootArray: any[]): Array<{
  id: number,
  text: string,
  nextSegment: number | null
}> {
  console.log("[InkMapper] Extracting story segments from Ink root array");
  
  const segments: Array<{
    id: number,
    text: string,
    nextSegment: number | null
  }> = [];
  
  // This function processes text content from Ink.js format
  const processTextContent = (item: any): string | null => {
    if (typeof item !== 'string') return null;
    
    // Text content in Ink.js format starts with ^ character
    if (item.startsWith('^')) {
      // Remove the ^ prefix and return the clean text
      return item.substring(1).trim();
    }
    
    return null;
  };
  
  let segmentCount = 0;
  
  // Process the root array to extract text segments
  for (let i = 0; i < rootArray.length; i++) {
    const element = rootArray[i];
    
    // Skip null or undefined elements
    if (!element) continue;
    
    // Process array elements (main content structure in Ink.js)
    if (Array.isArray(element)) {
      // Extract all text content from this element
      let segmentText = '';
      
      // Iterate through the array looking for text content
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        
        // Skip flow control elements
        if (item === '\n' || item === 'ev' || item === '/ev' || item === 'done') {
          continue;
        }
        
        // Direct text content
        if (typeof item === 'string') {
          const textContent = processTextContent(item);
          if (textContent) {
            if (segmentText) segmentText += ' ';
            segmentText += textContent;
          }
        }
        
        // Nested arrays (common in Ink.js format)
        else if (Array.isArray(item)) {
          for (let k = 0; k < item.length; k++) {
            const subItem = item[k];
            const textContent = processTextContent(subItem);
            if (textContent) {
              if (segmentText) segmentText += ' ';
              segmentText += textContent;
            }
          }
        }
      }
      
      // If we found text content, create a new segment
      if (segmentText.trim()) {
        segments.push({
          id: segmentCount,
          text: segmentText.trim(),
          nextSegment: segmentCount + 1 < rootArray.length ? segmentCount + 1 : null
        });
        
        console.log(`[InkMapper] Created segment ${segmentCount}:`, {
          textPreview: segmentText.substring(0, 50) + (segmentText.length > 50 ? '...' : '')
        });
        
        segmentCount++;
      }
    }
    
    // Check if the element is an object with flow markers indicating the end of a segment
    else if (typeof element === 'object' && element !== null) {
      // Some Ink.js formats have flow control in separate objects
      const hasFlowControl = element['^->'] !== undefined;
      
      if (hasFlowControl) {
        console.log(`[InkMapper] Found flow control marker at position ${i}`);
        // We don't need to do anything special here, just log it
      }
    }
  }
  
  // If we have no segments, create a default one
  if (segments.length === 0) {
    console.log("[InkMapper] No segments found, creating default segment");
    segments.push({
      id: 0,
      text: "Story content could not be parsed correctly.",
      nextSegment: null
    });
  }
  
  // Set the last segment's nextSegment to null to mark the end
  if (segments.length > 0) {
    segments[segments.length - 1].nextSegment = null;
  }
  
  // Final linking - make sure all segments are properly connected
  for (let i = 0; i < segments.length - 1; i++) {
    segments[i].nextSegment = i + 1;
  }
  
  console.log(`[InkMapper] Extracted ${segments.length} total segments`);
  return segments;
}

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
  
  // Look for fragment_0 specifically (our created node for Ink.js stories)
  if (storyData['fragment_0'] && typeof storyData['fragment_0'] === 'object' &&
      typeof storyData['fragment_0'].text === 'string') {
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

// Make sure to explicitly export the NodeMappings interface
export type { NodeMappings };
