
/**
 * Unified interface for node mappings used throughout the application
 */
export interface NodeMappings {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
}

/**
 * Generate a comprehensive node mapping from a story JSON structure
 * This function handles both custom format and ink.js format
 */
export const generateComprehensiveNodeMapping = (storyJson: any): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  if (!storyJson) {
    console.warn("[Node Mapping] No story data provided");
    return {
      nodeToPage: {},
      pageToNode: {},
      totalPages: 0
    };
  }
  
  console.log("[Node Mapping] Analyzing story structure:", {
    hasRoot: !!storyJson.root,
    hasStart: !!storyJson.start,
    topLevelKeys: Object.keys(storyJson).slice(0, 10), // Log first 10 keys to avoid huge logs
    inkVersion: storyJson.inkVersion,
    keysCount: Object.keys(storyJson).length
  });
  
  // Detect if this is our custom story format with start/root node and nextNode properties
  const isCustomFormat = (
    (storyJson.start && typeof storyJson.start === 'object' && storyJson.start.text) || 
    (storyJson.root && typeof storyJson.root === 'object' && storyJson.root.text)
  );
  
  // Detect if this is an ink.js format story (has inkVersion and root array)
  const isInkFormat = storyJson.inkVersion && Array.isArray(storyJson.root);
  
  console.log("[Node Mapping] Format detection:", { 
    isCustomFormat, 
    isInkFormat,
    formatType: isCustomFormat ? "Custom" : (isInkFormat ? "Ink.js" : "Unknown") 
  });
  
  if (isCustomFormat) {
    console.log("[Node Mapping] Using custom format mapping strategy");
    return generateMappingFromCustomFormat(storyJson);
  } else if (isInkFormat) {
    console.log("[Node Mapping] Using Ink.js format mapping strategy");
    return generateMappingFromInkFormat(storyJson);
  }
  
  // Fallback for unknown formats - just map all keys
  console.warn("[Node Mapping] Unknown story format, using fallback mapping");
  return generateFallbackMapping(storyJson);
};

/**
 * Generate node mappings from Ink.js format stories
 * These have a different structure than our custom format
 */
function generateMappingFromInkFormat(storyJson: any): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} {
  console.log("[Node Mapping] Starting Ink.js format mapping");
  
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  let pageCounter = 1;
  
  // Track processed nodes to avoid duplicates
  const processedNodes = new Set<string>();
  
  // First, extract all story fragment nodes from the ink structure
  const storyFragments = extractInkStoryFragments(storyJson);
  
  console.log(`[Node Mapping] Found ${storyFragments.length} story fragments`);
  if (storyFragments.length > 0) {
    console.log("[Node Mapping] Sample fragment:", storyFragments[0]);
  }
  
  // Process each fragment as a page
  storyFragments.forEach((fragment, index) => {
    const fragmentId = fragment.id || `fragment_${index}`;
    if (!processedNodes.has(fragmentId)) {
      nodeToPage[fragmentId] = pageCounter;
      pageToNode[pageCounter] = fragmentId;
      processedNodes.add(fragmentId);
      pageCounter++;
      
      if (pageCounter <= 5 || pageCounter % 50 === 0) {
        console.log(`[Node Mapping] Mapped: Fragment '${fragmentId}' -> Page ${pageCounter-1}`);
      }
    }
  });
  
  const totalPages = pageCounter - 1;
  console.log(`[Node Mapping] Completed Ink.js mapping with ${totalPages} pages`);
  
  return {
    nodeToPage,
    pageToNode,
    totalPages
  };
}

/**
 * Extract story fragments from Ink.js format
 * These are sections of text that represent distinct parts of the story
 */
function extractInkStoryFragments(storyJson: any): Array<{id: string, text: string, hasChoices: boolean}> {
  // Initialize with an empty array
  const fragments: Array<{id: string, text: string, hasChoices: boolean}> = [];
  
  try {
    // The main story content in Ink.js format is in the root array
    if (storyJson && Array.isArray(storyJson.root)) {
      console.log("[Ink Extraction] Processing root array with", storyJson.root.length, "elements");
      
      // Process the root array recursively
      processInkContentArray(storyJson.root, fragments);
      
      // Also look for named content containers
      const namedContent = getNamedContentBlocks(storyJson);
      for (const [key, content] of Object.entries(namedContent)) {
        if (Array.isArray(content)) {
          console.log(`[Ink Extraction] Processing named content "${key}"`);
          processInkContentArray(content, fragments, key);
        }
      }
    } else {
      console.warn("[Ink Extraction] No valid root array found in Ink story");
    }
  } catch (error) {
    console.error("[Ink Extraction] Error extracting story fragments:", error);
  }
  
  console.log(`[Ink Extraction] Extracted ${fragments.length} total story fragments`);
  return fragments;
}

/**
 * Get named content blocks from an Ink.js story
 * These are typically story branches or sections referenced by name
 */
function getNamedContentBlocks(storyJson: any): Record<string, any> {
  const namedContent: Record<string, any> = {};
  
  // In Ink.js format, named content is stored directly at the root level
  // but we skip metadata keys and other special properties
  const skipKeys = ['inkVersion', 'listDefs', '#f', 'root', 'start'];
  
  for (const key of Object.keys(storyJson)) {
    if (!skipKeys.includes(key) && key.indexOf('.') === -1) {
      namedContent[key] = storyJson[key];
    }
  }
  
  console.log(`[Ink Extraction] Found ${Object.keys(namedContent).length} named content blocks`);
  return namedContent;
}

/**
 * Process an Ink content array to extract story fragments
 * This handles the recursive nature of Ink.js content
 * Importantly, this avoids processing the same content multiple times
 */
function processInkContentArray(
  contentArray: any[], 
  fragments: Array<{id: string, text: string, hasChoices: boolean}>,
  parentId: string = ''
) {
  // Safety check
  if (!Array.isArray(contentArray)) {
    return;
  }
  
  let currentText = '';
  let fragmentId = parentId ? `${parentId}_${fragments.length}` : `fragment_${fragments.length}`;
  let hasChoices = false;
  
  // Process array elements sequentially
  for (let i = 0; i < contentArray.length; i++) {
    const element = contentArray[i];
    
    // Text content (starts with ^)
    if (typeof element === 'string' && element.startsWith('^')) {
      const text = element.substring(1).trim();
      
      // Handle image descriptions in the text (e.g., "IMAGE: [description]")
      if (text.includes('IMAGE:')) {
        // If we already have text, create a fragment
        if (currentText.trim()) {
          fragments.push({
            id: fragmentId,
            text: currentText.trim(),
            hasChoices
          });
          
          // Reset for next fragment
          currentText = '';
          hasChoices = false;
          fragmentId = parentId ? `${parentId}_${fragments.length}` : `fragment_${fragments.length}`;
        }
        
        // Create a separate fragment for the image
        fragments.push({
          id: `image_${fragments.length}`,
          text: text,
          hasChoices: false
        });
      } else {
        // Regular text - append to current fragment
        currentText += (currentText ? ' ' : '') + text;
      }
    }
    // Choice array (options for the reader)
    else if (Array.isArray(element) && element.some(item => 
      typeof item === 'object' && item.hasOwnProperty('^->'))) {
      hasChoices = true;
      
      // Create a fragment with accumulated text and choices
      if (currentText.trim()) {
        fragments.push({
          id: fragmentId,
          text: currentText.trim(),
          hasChoices: true
        });
        
        // Reset for next fragment
        currentText = '';
        hasChoices = false;
        fragmentId = parentId ? `${parentId}_${fragments.length}` : `fragment_${fragments.length}`;
      }
      
      // Process child arrays recursively (may contain nested content)
      const targetPath = element.find(item => 
        typeof item === 'object' && item.hasOwnProperty('^->'))?.["^->"];
        
      if (targetPath) {
        const childId = `choice_${targetPath.replace(/\./g, '_')}`;
        processInkContentArray(element, fragments, childId);
      }
    }
    // Object with a path (^->)
    else if (typeof element === 'object' && element && element["^->"]) {
      // Handle navigation to another part of the story
      const targetPath = element["^->"];
      
      // If we have accumulated text, create a fragment before we navigate
      if (currentText.trim()) {
        fragments.push({
          id: fragmentId,
          text: currentText.trim(),
          hasChoices
        });
        
        // Reset for next fragment
        currentText = '';
        hasChoices = false;
        fragmentId = parentId ? `${parentId}_${fragments.length}` : `fragment_${fragments.length}`;
      }
    }
    // Nested array content
    else if (Array.isArray(element)) {
      const nestedId = `${fragmentId}_nested_${i}`;
      processInkContentArray(element, fragments, nestedId);
    }
  }
  
  // Add any remaining text as a fragment
  if (currentText.trim()) {
    fragments.push({
      id: fragmentId,
      text: currentText.trim(),
      hasChoices
    });
  }
}

/**
 * Generate node mappings by following the story flow through nextNode links
 * This follows the proper narrative flow of the story
 */
function generateMappingFromCustomFormat(storyJson: any): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} {
  console.log("[Node Mapping] Generating mapping from custom story format");
  
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  let pageCounter = 1;
  
  // Start with the beginning node (either 'start' or 'root')
  const startNodeName = storyJson.start ? 'start' : 'root';
  
  // Track nodes we've already processed to avoid infinite loops
  const processedNodes = new Set<string>();
  
  // Queue for breadth-first traversal of the story graph
  const nodeQueue: string[] = [startNodeName];
  
  console.log("[Node Mapping] Starting story traversal from:", startNodeName);
  
  // Process the story flow by following nextNode links
  while (nodeQueue.length > 0) {
    const currentNodeName = nodeQueue.shift() as string;
    
    // Skip if we've already processed this node
    if (processedNodes.has(currentNodeName)) {
      continue;
    }
    
    // Get the node data
    const nodeData = storyJson[currentNodeName];
    
    // Skip invalid nodes
    if (!nodeData || typeof nodeData !== 'object') {
      console.warn(`[Node Mapping] Invalid node: ${currentNodeName}`);
      continue;
    }
    
    // Process the current node
    console.log(`[Node Mapping] Processing node: ${currentNodeName}`, {
      hasText: typeof nodeData.text === 'string',
      choicesCount: Array.isArray(nodeData.choices) ? nodeData.choices.length : 0,
      isEnding: !!nodeData.isEnding
    });
    
    // Mark node as processed
    processedNodes.add(currentNodeName);
    
    // Assign a page number to this node
    nodeToPage[currentNodeName] = pageCounter;
    pageToNode[pageCounter] = currentNodeName;
    pageCounter++;
    
    console.log(`[Node Mapping] Mapped: Node '${currentNodeName}' -> Page ${pageCounter-1}`);
    
    // Queue up the next nodes from choices
    if (Array.isArray(nodeData.choices)) {
      nodeData.choices.forEach(choice => {
        if (choice && choice.nextNode && !processedNodes.has(choice.nextNode)) {
          console.log(`[Node Mapping] Queuing choice next node: ${choice.nextNode}`);
          nodeQueue.push(choice.nextNode);
        }
      });
    }
  }
  
  const totalPages = pageCounter - 1;
  console.log(`[Node Mapping] Completed story mapping with ${totalPages} pages`);
  
  return {
    nodeToPage,
    pageToNode,
    totalPages
  };
}

/**
 * Fallback mapping strategy for unknown formats
 */
function generateFallbackMapping(storyJson: any): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} {
  console.log("[Node Mapping] Using fallback mapping for unknown format");
  
  // Skip metadata keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Get all story content nodes
  const contentNodes = Object.keys(storyJson).filter(key => {
    if (skipKeys.includes(key)) return false;
    
    // Only include nodes that actually have content (text and choices)
    const node = storyJson[key];
    return (
      node && 
      typeof node === 'object' && 
      !Array.isArray(node) && 
      (typeof node.text === 'string' || Array.isArray(node.choices))
    );
  });
  
  console.log(`[Node Mapping] Found ${contentNodes.length} content nodes through fallback method`);
  
  if (contentNodes.length === 0) {
    console.warn("[Node Mapping] No valid content nodes found");
    return {
      nodeToPage: {},
      pageToNode: {},
      totalPages: 0
    };
  }
  
  // Generate mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  contentNodes.forEach((nodeName, index) => {
    const pageNumber = index + 1;
    nodeToPage[nodeName] = pageNumber;
    pageToNode[pageNumber] = nodeName;
  });
  
  return {
    nodeToPage,
    pageToNode,
    totalPages: contentNodes.length
  };
}

/**
 * Analyzes a story's structure to generate node-to-page mappings
 * This is exposed for the JsonEditor component to use
 */
export const analyzeStoryStructure = (storyJson: any): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  console.log("[Story Analysis] Analyzing story structure");
  
  // Use the comprehensive mapping generator for consistency
  const result = generateComprehensiveNodeMapping(storyJson);
  console.log("[Story Analysis] Generated mapping with:", {
    nodeCount: Object.keys(result.nodeToPage).length,
    pageCount: result.totalPages
  });
  return result;
};

/**
 * Helper function to get a nested property from an object using a path string
 * Handles both dot notation (obj.prop) and array notation (obj[0])
 */
export function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Handle direct property access
  if (path in obj) {
    return obj[path];
  }
  
  // Special case for root[index] format which is common in ink stories
  if (path.startsWith('root[')) {
    let current = obj.root;
    const matches = path.substring(4).match(/\[(\d+)\]/g);
    
    if (matches) {
      for (const match of matches) {
        const index = parseInt(match.substring(1, match.length - 1), 10);
        if (Array.isArray(current) && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      }
      return current;
    }
  }
  
  // Handle path with dot notation and array indices
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let result = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Handle array indices
    if (!isNaN(Number(part))) {
      const index = Number(part);
      if (Array.isArray(result) && index < result.length) {
        result = result[index];
      } else {
        return undefined;
      }
    } 
    // Handle object properties
    else if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      return undefined;
    }
  }
  
  return result;
}

/**
 * Validate node mappings to ensure they cover all content nodes and are sequential
 */
export function validateNodeMappings(
  storyData: any,
  nodeToPage: Record<string, number>,
  pageToNode: Record<number, string>
): boolean {
  console.log("[Node Validation] Validating node mappings");
  
  // 1. Check if all mappings are bidirectional
  const bidirectionalIssues = Object.entries(nodeToPage).filter(
    ([node, page]) => pageToNode[page] !== node
  );
  
  if (bidirectionalIssues.length > 0) {
    console.warn("[Node Validation] Found bidirectional mapping issues");
    return false;
  }
  
  // 2. Check if page numbers are sequential
  const pageNumbers = Object.keys(pageToNode).map(Number).sort((a, b) => a - b);
  
  const isSequential = pageNumbers.every((page, index) => page === index + 1);
  
  if (!isSequential) {
    console.warn("[Node Validation] Page numbers are not sequential");
    return false;
  }
  
  // 3. Check if we have a reasonable number of mappings
  const contentNodeEstimate = Object.keys(storyData).filter(
    key => !['inkVersion', 'listDefs', '#f'].includes(key)
  ).length;
  
  if (Object.keys(nodeToPage).length < contentNodeEstimate * 0.5) {
    console.warn("[Node Validation] Mapping coverage seems low");
    return false;
  }
  
  console.log("[Node Validation] Mapping validation successful");
  return true;
}
