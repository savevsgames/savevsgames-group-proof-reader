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
  console.log("[Node Mapping] Beginning comprehensive mapping generation");
  console.log("[Node Mapping] Input data type:", typeof storyJson);
  
  if (!storyJson) {
    console.warn("[Node Mapping] No story data provided");
    return {
      nodeToPage: {},
      pageToNode: {},
      totalPages: 0
    };
  }
  
  // Log the data structure for debugging
  console.log("[Node Mapping] Story data keys:", Object.keys(storyJson));
  console.log("[Node Mapping] Has 'root' node:", !!storyJson.root);
  console.log("[Node Mapping] Has 'start' node:", !!storyJson.start);
  
  // Detailed analysis of story structure
  const storyKeys = Object.keys(storyJson);
  const contentKeyCount = storyKeys.filter(key => !['inkVersion', 'listDefs', '#f'].includes(key)).length;
  
  console.log(`[Node Mapping] Story has ${storyKeys.length} total keys, ${contentKeyCount} content keys`);
  
  // Analyze a few sample nodes in detail to understand their structure
  const sampleSize = Math.min(3, storyKeys.length);
  for (let i = 0; i < sampleSize; i++) {
    const key = storyKeys[i];
    const node = storyJson[key];
    
    if (node) {
      console.log(`[Node Mapping] Sample node "${key}":`, {
        type: typeof node,
        isObject: typeof node === 'object' && !Array.isArray(node),
        isArray: Array.isArray(node),
        hasText: typeof node === 'object' && 'text' in node,
        textType: node.text ? typeof node.text : 'N/A',
        textLength: node.text ? node.text.length : 0,
        hasChoices: typeof node === 'object' && 'choices' in node,
        choicesType: node.choices ? (Array.isArray(node.choices) ? 'array' : typeof node.choices) : 'N/A',
        choicesCount: Array.isArray(node.choices) ? node.choices.length : 0
      });
    }
  }
  
  if (storyJson.start) {
    console.log("[Node Mapping] Start node structure:", {
      hasText: !!storyJson.start.text,
      textLength: storyJson.start.text?.length || 0,
      hasChoices: Array.isArray(storyJson.start.choices),
      choicesCount: storyJson.start.choices?.length || 0
    });
  }
  
  if (storyJson.root) {
    console.log("[Node Mapping] Root node structure:", {
      type: typeof storyJson.root,
      isArray: Array.isArray(storyJson.root),
      length: Array.isArray(storyJson.root) ? storyJson.root.length : 0,
      hasText: !!storyJson.root.text,
      textLength: storyJson.root.text?.length || 0
    });
  }
  
  // Skip metadata keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Track all valid story nodes
  const allNodes: string[] = [];
  
  // Recursive function to extract all possible nodes
  const extractNodes = (obj: any, path: string = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    // Add current path as a node if it's not a metadata key
    if (path && !skipKeys.includes(path) && !allNodes.includes(path)) {
      console.log(`[Node Mapping] Adding node path: ${path}`);
      allNodes.push(path);
    }
    
    // Handle arrays by maintaining sequence
    if (Array.isArray(obj)) {
      console.log(`[Node Mapping] Processing array at path: ${path || 'root'}, length: ${obj.length}`);
      obj.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        
        // If item is a string with content, mark it as a node
        if (typeof item === 'string' && item.startsWith('^')) {
          if (!allNodes.includes(newPath)) {
            console.log(`[Node Mapping] Found text node at: ${newPath}`);
            allNodes.push(newPath);
          }
        }
        
        extractNodes(item, newPath);
      });
      return;
    }
    
    // Handle objects
    console.log(`[Node Mapping] Processing object at path: ${path || 'root'}, keys: ${Object.keys(obj).length}`);
    Object.entries(obj).forEach(([key, value]) => {
      if (skipKeys.includes(key)) return;
      
      const newPath = path ? `${path}.${key}` : key;
      
      // Add this path if it's not already included
      if (!allNodes.includes(newPath)) {
        console.log(`[Node Mapping] Adding object node: ${newPath}`);
        allNodes.push(newPath);
      }
      
      extractNodes(value, newPath);
    });
  };
  
  // Start extraction from the root
  console.log("[Node Mapping] Starting node extraction");
  extractNodes(storyJson);
  console.log(`[Node Mapping] Extracted ${allNodes.length} total potential nodes`);
  console.log("[Node Mapping] First 10 nodes:", allNodes.slice(0, 10));
  
  // Filter for nodes that actually have content
  console.log("[Node Mapping] Filtering for content nodes");
  const contentNodes = allNodes.filter(nodePath => {
    const nodeContent = getNestedProperty(storyJson, nodePath);
    
    // Log what we're checking
    console.log(`[Node Mapping] Checking node content for: ${nodePath}`, {
      type: typeof nodeContent,
      isArray: Array.isArray(nodeContent),
      isObject: nodeContent && typeof nodeContent === 'object' && !Array.isArray(nodeContent),
      hasText: nodeContent && typeof nodeContent === 'object' && 'text' in nodeContent,
      hasChoices: nodeContent && typeof nodeContent === 'object' && 'choices' in nodeContent
    });
    
    // Check if this node has text content or contains arrays/objects with content
    const hasContent = (
      (typeof nodeContent === 'string' && nodeContent.startsWith('^')) ||
      (Array.isArray(nodeContent) && nodeContent.some(item => 
        typeof item === 'string' && item.startsWith('^'))) ||
      (nodeContent && typeof nodeContent === 'object' && 
        (nodeContent.text || (nodeContent.choices && nodeContent.choices.length > 0)))
    );
    
    if (hasContent) {
      console.log(`[Node Mapping] Node has content: ${nodePath}`);
    }
    
    return hasContent;
  });
  
  console.log(`[Node Mapping] Found ${contentNodes.length} nodes with actual content`);
  console.log("[Node Mapping] Content nodes:", contentNodes);
  
  // Early exit check with fallback
  if (contentNodes.length === 0) {
    console.warn("[Node Mapping] No content nodes found, using all non-metadata keys as fallback");
    
    // Use all non-metadata keys as a fallback
    const fallbackNodes = Object.keys(storyJson).filter(key => !skipKeys.includes(key));
    
    // If we still have no valid nodes, return empty mappings with page count 0
    if (fallbackNodes.length === 0) {
      console.error("[Node Mapping] No valid nodes found even with fallback");
      return {
        nodeToPage: {},
        pageToNode: {},
        totalPages: 0
      };
    }
    
    console.log(`[Node Mapping] Using ${fallbackNodes.length} fallback nodes`);
    
    // Generate fallback mappings
    const nodeToPage: Record<string, number> = {};
    const pageToNode: Record<number, string> = {};
    
    fallbackNodes.forEach((nodeName, index) => {
      const pageNumber = index + 1;
      nodeToPage[nodeName] = pageNumber;
      pageToNode[pageNumber] = nodeName;
    });
    
    console.log(`[Node Mapping] Created fallback mapping with ${fallbackNodes.length} pages`);
    
    return {
      nodeToPage,
      pageToNode,
      totalPages: fallbackNodes.length
    };
  }
  
  // Sort nodes by type and depth for a more logical reading order
  console.log("[Node Mapping] Sorting nodes");
  const sortedNodes = [
    // Root or start node always comes first
    ...contentNodes.filter(node => node === 'root' || node === 'start'),
    // Then standard nodes (no array indices)
    ...contentNodes.filter(node => 
      !node.includes('[') && node !== 'root' && node !== 'start'
    ),
    // Then array nodes, sorted by array depth and position
    ...contentNodes.filter(node => node.includes('['))
      .sort((a, b) => {
        // Count depth of array nesting
        const aDepth = (a.match(/\[/g) || []).length;
        const bDepth = (b.match(/\[/g) || []).length;
        
        // First sort by depth, then lexicographically
        return aDepth - bDepth || a.localeCompare(b);
      })
  ];
  
  console.log(`[Node Mapping] Ordered ${sortedNodes.length} nodes for sequential pagination`);
  console.log("[Node Mapping] Sorted nodes:", sortedNodes);
  
  // Generate the mappings
  console.log("[Node Mapping] Generating page mappings");
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  sortedNodes.forEach((nodePath, index) => {
    const pageNumber = index + 1;
    nodeToPage[nodePath] = pageNumber;
    pageToNode[pageNumber] = nodePath;
    console.log(`[Node Mapping] Mapped: Node '${nodePath}' -> Page ${pageNumber}`);
  });
  
  console.log(`[Node Mapping] Created mapping with ${Object.keys(nodeToPage).length} nodes and ${sortedNodes.length} pages`);
  
  // Double check that we have at least one page if we found nodes
  if (sortedNodes.length > 0 && Object.keys(nodeToPage).length === 0) {
    console.warn("[Node Mapping] No pages mapped despite having nodes - using fallback");
    
    // Create at least one mapping for the first node
    const firstNode = sortedNodes[0];
    nodeToPage[firstNode] = 1;
    pageToNode[1] = firstNode;
    
    console.log(`[Node Mapping] Created fallback mapping for node "${firstNode}" to page 1`);
    
    return {
      nodeToPage,
      pageToNode,
      totalPages: 1
    };
  }
  
  // Log a preview of the mapping
  const previewCount = Math.min(5, sortedNodes.length);
  console.log(`[Node Mapping] First ${previewCount} mappings:`, 
    sortedNodes.slice(0, previewCount).reduce((acc, node, i) => {
      acc[node] = i + 1;
      return acc;
    }, {} as Record<string, number>)
  );
  
  return {
    nodeToPage,
    pageToNode,
    totalPages: sortedNodes.length
  };
};

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
  
  // Log the path for debugging
  console.log(`[Node Extraction] Getting nested property: ${path}`);
  
  // Handle direct property access
  if (path in obj) {
    console.log(`[Node Extraction] Found direct property: ${path}`);
    return obj[path];
  }
  
  // Special case for root[index] format which is common in ink stories
  if (path.startsWith('root[')) {
    console.log(`[Node Extraction] Handling root array format: ${path}`);
    let current = obj.root;
    const matches = path.substring(4).match(/\[(\d+)\]/g);
    
    if (matches) {
      for (const match of matches) {
        const index = parseInt(match.substring(1, match.length - 1), 10);
        console.log(`[Node Extraction] Accessing array index: ${index}`);
        if (Array.isArray(current) && index < current.length) {
          current = current[index];
        } else {
          console.log(`[Node Extraction] Invalid array index: ${index} for path: ${path}`);
          return undefined;
        }
      }
      console.log(`[Node Extraction] Successfully accessed nested array property: ${path}`);
      return current;
    }
  }
  
  // Handle path with dot notation and array indices
  console.log(`[Node Extraction] Traversing path segments: ${path}`);
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let result = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    console.log(`[Node Extraction] Processing path segment: ${part}`);
    
    // Handle array indices
    if (!isNaN(Number(part))) {
      const index = Number(part);
      console.log(`[Node Extraction] Handling array index: ${index}`);
      if (Array.isArray(result) && index < result.length) {
        result = result[index];
      } else {
        console.log(`[Node Extraction] Invalid array index: ${index} for path segment: ${part}`);
        return undefined;
      }
    } 
    // Handle object properties
    else if (result && typeof result === 'object' && part in result) {
      console.log(`[Node Extraction] Accessing object property: ${part}`);
      result = result[part];
    } else {
      console.log(`[Node Extraction] Property not found: ${part} in path: ${path}`);
      return undefined;
    }
  }
  
  console.log(`[Node Extraction] Successfully retrieved nested property for path: ${path}`);
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
  console.log("[Node Validation] Nodes:", Object.keys(nodeToPage).length);
  console.log("[Node Validation] Pages:", Object.keys(pageToNode).length);
  
  // 1. Check if all mappings are bidirectional
  const bidirectionalIssues = Object.entries(nodeToPage).filter(
    ([node, page]) => pageToNode[page] !== node
  );
  
  if (bidirectionalIssues.length > 0) {
    console.warn("[Node Validation] Found bidirectional mapping issues:", 
      bidirectionalIssues.slice(0, 5));
    return false;
  }
  
  // 2. Check if page numbers are sequential
  const pageNumbers = Object.keys(pageToNode).map(Number).sort((a, b) => a - b);
  console.log("[Node Validation] Page numbers:", pageNumbers);
  
  const isSequential = pageNumbers.every((page, index) => page === index + 1);
  
  if (!isSequential) {
    console.warn("[Node Validation] Page numbers are not sequential:", pageNumbers);
    return false;
  }
  
  // 3. Check if we have a reasonable number of mappings
  const contentNodeEstimate = Object.keys(storyData).filter(
    key => !['inkVersion', 'listDefs', '#f'].includes(key)
  ).length;
  
  console.log("[Node Validation] Estimated content nodes:", contentNodeEstimate);
  console.log("[Node Validation] Mapped nodes:", Object.keys(nodeToPage).length);
  
  if (Object.keys(nodeToPage).length < contentNodeEstimate * 0.5) {
    console.warn("[Node Validation] Mapping coverage seems low:",
      `${Object.keys(nodeToPage).length} mappings for ~${contentNodeEstimate} content nodes`);
    return false;
  }
  
  console.log("[Node Validation] Mapping validation successful");
  return true;
}
