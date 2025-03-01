
import { CustomStory } from "./storyUtils";

/**
 * Interface representing a node in the story graph
 */
interface StoryNode {
  id: string;
  text: string;
  choices?: Array<{nextNode: string}>;
  visited?: boolean;
}

/**
 * Extracts all nodes from a custom story format
 * @param storyData The story data object
 * @returns Map of node id to node data
 */
export const extractNodes = (storyData: CustomStory): Map<string, StoryNode> => {
  const nodes = new Map<string, StoryNode>();
  
  // Skip non-story keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Extract all valid story nodes
  Object.entries(storyData).forEach(([nodeId, nodeData]) => {
    if (skipKeys.includes(nodeId)) return;
    
    if (typeof nodeData === 'object' && nodeData !== null) {
      const node: StoryNode = {
        id: nodeId,
        text: nodeData.text || '',
        choices: nodeData.choices || []
      };
      nodes.set(nodeId, node);
    }
  });
  
  return nodes;
};

/**
 * Builds a graph of story nodes and their connections
 * @param nodes Map of story nodes
 * @returns Map of node id to array of connected node ids
 */
export const buildNodeGraph = (nodes: Map<string, StoryNode>): Map<string, string[]> => {
  const graph = new Map<string, string[]>();
  
  // Initialize graph with empty arrays for all nodes
  nodes.forEach((_, nodeId) => {
    graph.set(nodeId, []);
  });
  
  // Add edges between nodes based on choices
  nodes.forEach((node, nodeId) => {
    if (node.choices && node.choices.length > 0) {
      node.choices.forEach(choice => {
        if (choice.nextNode && nodes.has(choice.nextNode)) {
          const connections = graph.get(nodeId) || [];
          if (!connections.includes(choice.nextNode)) {
            connections.push(choice.nextNode);
            graph.set(nodeId, connections);
          }
        }
      });
    }
  });
  
  return graph;
};

/**
 * Find the starting node (root) of the story
 * @param storyData The story data
 * @returns The id of the starting node
 */
export const findStartNode = (storyData: CustomStory): string => {
  // Check for explicit start node
  if (storyData.start) return 'start';
  
  // Check for root node
  if (storyData.root) return 'root';
  
  // Default to first node that's not a system node
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const potentialNodes = Object.keys(storyData).filter(key => !skipKeys.includes(key));
  
  return potentialNodes[0] || 'root';
};

/**
 * Performs a breadth-first traversal of the story graph to determine page sequence
 * @param startNode The starting node id
 * @param nodes Map of all story nodes
 * @param graph The node connection graph
 * @returns Array of node ids in traversal order
 */
export const traverseStory = (
  startNode: string, 
  nodes: Map<string, StoryNode>,
  graph: Map<string, string[]>
): string[] => {
  const visited = new Set<string>();
  const sequence: string[] = [];
  const queue: string[] = [startNode];
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    
    if (visited.has(currentNodeId)) continue;
    
    visited.add(currentNodeId);
    sequence.push(currentNodeId);
    
    // Get connected nodes and add them to the queue
    const connections = graph.get(currentNodeId) || [];
    connections.forEach(nextNodeId => {
      if (!visited.has(nextNodeId)) {
        queue.push(nextNodeId);
      }
    });
  }
  
  return sequence;
};

/**
 * Generate page mappings from a sequence of node ids
 * @param sequence Array of node ids in order
 * @returns Object containing nodeToPage and pageToNode mappings
 */
export const generatePageMappings = (sequence: string[]): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
} => {
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  sequence.forEach((nodeId, index) => {
    const pageNumber = index + 1;
    nodeToPage[nodeId] = pageNumber;
    pageToNode[pageNumber] = nodeId;
  });
  
  return { nodeToPage, pageToNode };
};

/**
 * Analyzes a story and generates page mappings
 * @param storyData The story data object
 * @returns Object with node mappings and total pages
 */
export const analyzeStoryStructure = (storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  // Extract all story nodes
  const nodes = extractNodes(storyData);
  
  // Build the node connection graph
  const graph = buildNodeGraph(nodes);
  
  // Find the starting node
  const startNode = findStartNode(storyData);
  
  // Traverse the story to get the sequence
  const sequence = traverseStory(startNode, nodes, graph);
  
  // Generate page mappings
  const { nodeToPage, pageToNode } = generatePageMappings(sequence);
  
  // Calculate total pages
  const totalPages = sequence.length;
  
  return { nodeToPage, pageToNode, totalPages };
};

/**
 * Validates node mappings against a story structure
 * @param storyData The story data to validate against
 * @param nodeToPage The node to page mapping
 * @param pageToNode The page to node mapping
 * @returns True if valid, false otherwise
 */
export const validateNodeMappings = (
  storyData: CustomStory,
  nodeToPage: Record<string, number>,
  pageToNode: Record<number, string>
): boolean => {
  // Check all story nodes have a page mapping
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const storyNodes = Object.keys(storyData).filter(key => !skipKeys.includes(key));
  
  const hasAllNodes = storyNodes.every(nodeId => nodeId in nodeToPage);
  
  // Check page mapping is consistent
  const pages = Object.keys(pageToNode).map(Number);
  const isSequential = pages.every((page, i) => page === i + 1);
  
  // Verify bidirectional mapping
  const isBidirectional = Object.entries(nodeToPage).every(
    ([nodeId, page]) => pageToNode[page] === nodeId
  );
  
  return hasAllNodes && isSequential && isBidirectional;
};

/**
 * Extract all nodes from an Ink.js JSON structure
 * @param inkJson The Ink.js story JSON
 * @returns Array of node IDs found in the story
 */
export const extractAllNodesFromInkJSON = (inkJson: any): string[] => {
  const nodes: string[] = [];
  const visited = new Set<string>();
  
  // Skip these system keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Recursive function to extract nodes
  const extractNodes = (obj: any, path: string = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    // If this is a named object (likely a node)
    if (path && !skipKeys.includes(path) && !visited.has(path)) {
      visited.add(path);
      nodes.push(path);
    }
    
    // Process array items
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        extractNodes(item, `${path}[${index}]`);
      });
      return;
    }
    
    // Process object properties
    Object.entries(obj).forEach(([key, value]) => {
      // Skip special Ink metadata keys
      if (skipKeys.includes(key)) return;
      
      const newPath = path ? `${path}.${key}` : key;
      
      // If it's a named node in the story structure
      if (
        typeof value === 'object' && 
        value !== null && 
        !Array.isArray(value) && 
        Object.keys(value).length > 0 &&
        !skipKeys.includes(key)
      ) {
        visited.add(key);
        nodes.push(key);
      }
      
      extractNodes(value, newPath);
    });
  };
  
  extractNodes(inkJson);
  
  return nodes;
};

/**
 * Converts an Ink.js story to our custom format
 * @param inkJson The original Ink.js JSON
 * @returns A story in our custom format
 */
export const extractCustomStoryFromInkJSON = (inkJson: any): CustomStory => {
  const customStory: CustomStory = { 
    inkVersion: inkJson.inkVersion 
  };
  
  // Get all nodes
  const nodeNames = extractAllNodesFromInkJSON(inkJson);
  console.log("Converted ink nodes:", nodeNames);
  
  // Start with the root container
  if (inkJson.root) {
    customStory.root = {
      text: extractTextFromInkNode(inkJson.root),
      choices: extractChoicesFromInkNode(inkJson.root, nodeNames)
    };
  }
  
  // Extract all other nodes
  nodeNames.forEach(nodeName => {
    const nodeContent = getNestedProperty(inkJson, nodeName);
    if (nodeContent && typeof nodeContent === 'object') {
      customStory[nodeName] = {
        text: extractTextFromInkNode(nodeContent),
        choices: extractChoicesFromInkNode(nodeContent, nodeNames)
      };
    }
  });
  
  return customStory;
};

/**
 * Helper to get a nested property from an object using a path string
 */
function getNestedProperty(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    // Handle array indexing
    if (part.includes('[') && part.includes(']')) {
      const [name, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      
      current = current[name]?.[index];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

/**
 * Extract text content from an Ink node
 */
function extractTextFromInkNode(node: any): string {
  if (!node) return '';
  
  // If the node is an array, look for text entries
  if (Array.isArray(node)) {
    return node
      .filter(item => typeof item === 'string' && !item.startsWith('^->') && !item.startsWith('ev'))
      .map(item => typeof item === 'string' ? item.replace(/^\^/, '') : '')
      .join(' ')
      .trim();
  }
  
  // If the node has a '_' property that's an array, process that
  if (node['_'] && Array.isArray(node['_'])) {
    return extractTextFromInkNode(node['_']);
  }
  
  return '';
}

/**
 * Extract choices from an Ink node
 */
function extractChoicesFromInkNode(node: any, allNodes: string[]): { text: string, nextNode: string }[] {
  const choices: { text: string, nextNode: string }[] = [];
  
  // Helper to find pointers to other nodes
  const findPointers = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        // Look for strings with format '^->' which are pointers to other nodes
        if (typeof item === 'string' && item.startsWith('^->')) {
          const targetNode = item.replace('^->', '').trim();
          if (allNodes.includes(targetNode)) {
            // Find the preceding text (choice text)
            const choiceIndex = obj.indexOf(item) - 2;
            if (choiceIndex >= 0 && typeof obj[choiceIndex] === 'string') {
              let choiceText = obj[choiceIndex].replace(/^str\^/, '').replace(/\/str$/, '');
              choices.push({ text: choiceText, nextNode: targetNode });
            }
          }
        } else {
          findPointers(item);
        }
      });
    } else {
      Object.values(obj).forEach(value => findPointers(value));
    }
  };
  
  findPointers(node);
  
  return choices;
}

