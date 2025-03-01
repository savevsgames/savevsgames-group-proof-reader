
import { CustomStory } from "../storyUtils";
import { StoryNode } from "../types/storyTypes";
import { extractChoicesFromInkNode, extractTextFromInkNode } from "./utils";

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
 * Helper function to extract nodes from array structures
 */
export function extractArrayNodes(array: any[], basePath: string, customStory: CustomStory, allNodes: string[]): void {
  array.forEach((item, index) => {
    const nodePath = `${basePath}[${index}]`;
    
    // If this looks like content (has text or is an object with content)
    if (typeof item === 'string' && item.startsWith('^')) {
      // Text content
      if (!customStory[nodePath]) {
        customStory[nodePath] = { text: item.substring(1), choices: [] };
      } else {
        customStory[nodePath].text = item.substring(1);
      }
    } else if (typeof item === 'object' && item !== null) {
      // Could be a choice, navigation, or nested content
      if (item['->']) {
        // Navigation target
        const target = item['->'];
        if (!customStory[nodePath]) {
          customStory[nodePath] = { 
            text: '', 
            choices: [{ text: 'Continue', nextNode: target }] 
          };
        } else {
          customStory[nodePath].choices = [{ text: 'Continue', nextNode: target }];
        }
      }
      
      // Recursively process nested arrays
      if (Array.isArray(item)) {
        extractArrayNodes(item, nodePath, customStory, allNodes);
      }
    }
  });
}

/**
 * Extracts array-style nodes from nested Ink structures
 * @param storyData The full story data
 * @returns CustomStory with flattened nodes
 */
export const extractNestedNodes = (storyData: any): CustomStory => {
  const result: CustomStory = {};
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Helper function to process nested arrays
  const processNode = (node: any, path: string = '') => {
    if (!node) return;
    
    // Skip system nodes
    if (skipKeys.includes(path)) return;
    
    // Handle array
    if (Array.isArray(node)) {
      // Extract text content from strings in the array
      let nodeText = '';
      let choices: any[] = [];
      
      node.forEach((item, index) => {
        // If item is string and looks like content
        if (typeof item === 'string') {
          if (item.startsWith('^')) {
            nodeText += item.substring(1) + ' ';
          }
        }
        
        // If item has a pointer to another node
        if (typeof item === 'object' && item && item['->']) {
          choices.push({
            text: 'Continue',
            nextNode: item['->']
          });
        }
        
        // Recursively process nested structures
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        processNode(item, newPath);
      });
      
      // Only add if we found content
      if (nodeText.trim() || choices.length > 0) {
        result[path] = {
          text: nodeText.trim(),
          choices: choices
        };
      }
    } 
    // Handle object
    else if (typeof node === 'object' && node !== null) {
      Object.entries(node).forEach(([key, value]) => {
        // Skip system properties
        if (skipKeys.includes(key)) return;
        
        const newPath = path ? `${path}.${key}` : key;
        
        // If this is a content object with text/choices
        if (key === 'text' || key === 'choices') {
          if (!result[path]) {
            result[path] = { text: '', choices: [] };
          }
          if (key === 'text') {
            result[path].text = value as string;
          } else if (key === 'choices') {
            result[path].choices = value as any[];
          }
        } else {
          // Recursively process the value
          processNode(value, newPath);
        }
      });
    }
  };
  
  // Start processing from the root
  processNode(storyData);
  
  // Add the original nodes from the story data if they're not already added
  Object.entries(storyData).forEach(([key, value]) => {
    if (!skipKeys.includes(key) && !result[key] && typeof value === 'object' && value !== null) {
      const nodeValue = value as Record<string, any>;
      result[key] = {
        text: nodeValue.text || '',
        choices: nodeValue.choices || []
      };
    }
  });
  
  return result;
};

/**
 * Extract all nodes from an Ink.js JSON structure with improved array handling
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
