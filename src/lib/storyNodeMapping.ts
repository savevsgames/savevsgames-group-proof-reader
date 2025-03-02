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
  
  // ... keep existing code (handling non-Ink formats)
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

  // Log more details about the third element which often contains the actual story
  if (rootArray[2]) {
    const thirdEl = rootArray[2];
    if (typeof thirdEl === 'object' && thirdEl !== null) {
      console.log("[InkMapper] Third element keys:", Object.keys(thirdEl));
      
      // Examine the structure specifically for the "start" key which often contains story content
      if (thirdEl.start && Array.isArray(thirdEl.start)) {
        console.log("[InkMapper] Found 'start' node in third element with length:", thirdEl.start.length);
        console.log("[InkMapper] Start node preview:", 
          JSON.stringify(thirdEl.start).substring(0, 150));
      }
    }
  }
  
  // Create initial node structures with flow tracking
  const storySegments = extractStorySegmentsFromInk(rootArray, storyData);
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
  
  // Set the start node to the first fragment
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
 * Extracts story segments from Ink.js root array and story objects
 * Properly handles both Ink array format and structured story content
 */
function extractStorySegmentsFromInk(rootArray: any[], storyData: CustomStory): Array<{
  id: number,
  text: string,
  nextSegment: number | null
}> {
  console.log("[InkMapper] Extracting story segments from Ink root array and story objects");
  
  const segments: Array<{
    id: number,
    text: string,
    nextSegment: number | null
  }> = [];
  
  // Helper function to extract text content from string
  const extractTextContent = (str: string): string | null => {
    if (typeof str !== 'string') return null;
    
    // Text content in Ink.js format starts with ^ character
    if (str.startsWith('^')) {
      return str.substring(1).trim();
    }
    return null;
  };
  
  // STEP 1: Process the main root array first
  // This handles simple array of text content (most common format)
  for (let i = 0; i < rootArray.length; i++) {
    const element = rootArray[i];
    
    if (Array.isArray(element)) {
      // Look for text elements in this array (they start with ^)
      let segmentText = '';
      
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        
        if (typeof item === 'string') {
          const textContent = extractTextContent(item);
          if (textContent) {
            if (segmentText) segmentText += ' ';
            segmentText += textContent;
          }
        }
        // Handle nested arrays of text
        else if (Array.isArray(item)) {
          for (const subItem of item) {
            const textContent = extractTextContent(subItem);
            if (textContent) {
              if (segmentText) segmentText += ' ';
              segmentText += textContent;
            }
          }
        }
      }
      
      if (segmentText) {
        segments.push({
          id: segments.length,
          text: segmentText,
          nextSegment: segments.length + 1 < rootArray.length ? segments.length + 1 : null
        });
        console.log(`[InkMapper] Created segment from array element ${i}:`, {
          textPreview: segmentText.substring(0, 50) + (segmentText.length > 50 ? '...' : '')
        });
      }
    }
    
    // STEP 2: Handle special case for object elements which often contain story nodes
    else if (element && typeof element === 'object') {
      // Process all keys in this object that might contain story content
      Object.keys(element).forEach(key => {
        // Skip special metadata keys
        if (key === '#f' || key === 'inkVersion' || key === 'listDefs') return;
        
        const nodeContent = element[key];
        
        // Handle arrays of story content (most common for node content)
        if (Array.isArray(nodeContent)) {
          let nodeText = '';
          
          // Recursive function to extract text from nested arrays
          const processArrayContent = (arr: any[]): void => {
            for (const item of arr) {
              if (typeof item === 'string') {
                const textContent = extractTextContent(item);
                if (textContent) {
                  if (nodeText) nodeText += ' ';
                  nodeText += textContent;
                }
              } 
              else if (Array.isArray(item)) {
                processArrayContent(item);
              }
            }
          };
          
          processArrayContent(nodeContent);
          
          if (nodeText) {
            segments.push({
              id: segments.length,
              text: nodeText,
              nextSegment: segments.length + 1 < rootArray.length ? segments.length + 1 : null
            });
            console.log(`[InkMapper] Created segment from object key "${key}":`, {
              textPreview: nodeText.substring(0, 50) + (nodeText.length > 50 ? '...' : '')
            });
          }
        }
      });
    }
  }
  
  // STEP 3: Special handling for 'start' node in the storyData object
  // This is important for many Ink.js stories that store content in the storyData.start
  if (storyData && storyData.start) {
    if (typeof storyData.start === 'object' && storyData.start !== null) {
      if (Array.isArray(storyData.start)) {
        let startNodeText = '';
        
        // Extract text from start node array
        for (const item of storyData.start) {
          if (typeof item === 'string') {
            const textContent = extractTextContent(item);
            if (textContent) {
              if (startNodeText) startNodeText += ' ';
              startNodeText += textContent;
            }
          }
        }
        
        if (startNodeText) {
          segments.push({
            id: segments.length,
            text: startNodeText,
            nextSegment: null // Typically the end of content
          });
          console.log(`[InkMapper] Created segment from storyData.start array:`, {
            textPreview: startNodeText.substring(0, 50) + (startNodeText.length > 50 ? '...' : '')
          });
        }
      }
      else if (typeof storyData.start.text === 'string') {
        segments.push({
          id: segments.length,
          text: storyData.start.text,
          nextSegment: null
        });
        console.log(`[InkMapper] Created segment from storyData.start.text:`, {
          textPreview: storyData.start.text.substring(0, 50) + (storyData.start.text.length > 50 ? '...' : '')
        });
      }
    }
  }
  
  // Ensure we have at least one segment
  if (segments.length === 0) {
    console.warn("[InkMapper] No segments found, creating default segment");
    segments.push({
      id: 0,
      text: "Story content could not be parsed correctly.",
      nextSegment: null
    });
  }
  
  // STEP 4: Link segments properly
  if (segments.length > 0) {
    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].nextSegment = i + 1;
    }
    segments[segments.length - 1].nextSegment = null; // Last segment has no next
  }
  
  console.log(`[InkMapper] Extracted ${segments.length} total story segments`);
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
