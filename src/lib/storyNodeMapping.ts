
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
  
  if (!storyJson) {
    console.warn("[Node Mapping] No story data provided");
    return {
      nodeToPage: {},
      pageToNode: {},
      totalPages: 0
    };
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
      allNodes.push(path);
    }
    
    // Handle arrays by maintaining sequence
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        
        // If item is a string with content, mark it as a node
        if (typeof item === 'string' && item.startsWith('^')) {
          if (!allNodes.includes(newPath)) {
            allNodes.push(newPath);
          }
        }
        
        extractNodes(item, newPath);
      });
      return;
    }
    
    // Handle objects
    Object.entries(obj).forEach(([key, value]) => {
      if (skipKeys.includes(key)) return;
      
      const newPath = path ? `${path}.${key}` : key;
      
      // Add this path if it's not already included
      if (!allNodes.includes(newPath)) {
        allNodes.push(newPath);
      }
      
      extractNodes(value, newPath);
    });
  };
  
  // Start extraction from the root
  extractNodes(storyJson);
  console.log(`[Node Mapping] Extracted ${allNodes.length} total potential nodes`);
  
  // Filter for nodes that actually have content
  const contentNodes = allNodes.filter(nodePath => {
    const nodeContent = getNestedProperty(storyJson, nodePath);
    
    // Check if this node has text content or contains arrays/objects with content
    return (
      (typeof nodeContent === 'string' && nodeContent.startsWith('^')) ||
      (Array.isArray(nodeContent) && nodeContent.some(item => 
        typeof item === 'string' && item.startsWith('^'))) ||
      (nodeContent && typeof nodeContent === 'object' && 
        (nodeContent.text || (nodeContent.choices && nodeContent.choices.length > 0)))
    );
  });
  
  console.log(`[Node Mapping] Found ${contentNodes.length} nodes with actual content`);
  
  // Sort nodes by type and depth for a more logical reading order
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
  
  // Generate the mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  sortedNodes.forEach((nodePath, index) => {
    const pageNumber = index + 1;
    nodeToPage[nodePath] = pageNumber;
    pageToNode[pageNumber] = nodePath;
  });
  
  console.log(`[Node Mapping] Created mapping with ${Object.keys(nodeToPage).length} nodes`);
  
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
  return generateComprehensiveNodeMapping(storyJson);
};

/**
 * Helper function to get a nested property from an object using a path string
 * Handles both dot notation (obj.prop) and array notation (obj[0])
 */
export function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Handle direct property access
  if (path in obj) return obj[path];
  
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
    console.warn("[Node Validation] Found bidirectional mapping issues:", 
      bidirectionalIssues.slice(0, 5));
    return false;
  }
  
  // 2. Check if page numbers are sequential
  const pageNumbers = Object.keys(pageToNode).map(Number).sort((a, b) => a - b);
  const isSequential = pageNumbers.every((page, index) => page === index + 1);
  
  if (!isSequential) {
    console.warn("[Node Validation] Page numbers are not sequential:", pageNumbers);
    return false;
  }
  
  // 3. Check if we have a reasonable number of mappings
  const contentNodeEstimate = Object.keys(storyData).filter(
    key => !['inkVersion', 'listDefs', '#f'].includes(key)
  ).length;
  
  if (Object.keys(nodeToPage).length < contentNodeEstimate * 0.5) {
    console.warn("[Node Validation] Mapping coverage seems low:",
      `${Object.keys(nodeToPage).length} mappings for ~${contentNodeEstimate} content nodes`);
    return false;
  }
  
  console.log("[Node Validation] Mapping validation successful");
  return true;
}
