
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
