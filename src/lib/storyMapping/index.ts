
import { CustomStory } from "../storyUtils";
import { 
  buildNodeGraph, 
  extractNodes, 
  extractNestedNodes, 
  findStartNode, 
  traverseStory,
  extractAllNodesFromInkJSON
} from "./nodeExtraction";
import { 
  extractCustomStoryFromInkJSON 
} from "./inkFormatHandling";
import { 
  generatePageMappings, 
  validateNodeMappings 
} from "./pageMapping";

/**
 * Interface for node to page mappings
 */
export interface NodeMappings {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
}

/**
 * Analyzes a story and generates page mappings with improved handling
 * @param storyData The story data object
 * @returns Object with node mappings and total pages
 */
export const analyzeStoryStructure = (storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  console.log("Starting story structure analysis...");
  
  // First, extract any nested nodes to ensure we catch all content
  const enrichedStoryData = extractNestedNodes(storyData);
  console.log(`Extracted ${Object.keys(enrichedStoryData).length} nodes including nested content`);
  
  // Extract all story nodes
  const nodes = extractNodes(enrichedStoryData);
  console.log(`Mapped ${nodes.size} story nodes to structured format`);
  
  // Build the node connection graph
  const graph = buildNodeGraph(nodes);
  console.log(`Built connection graph with ${graph.size} nodes`);
  
  // Find the starting node
  const startNode = findStartNode(enrichedStoryData);
  console.log(`Using '${startNode}' as starting node for traversal`);
  
  // Traverse the story to get the sequence
  const sequence = traverseStory(startNode, nodes, graph);
  console.log(`Traversal found ${sequence.length} connected nodes in sequence`);
  
  // If traversal found fewer nodes than total, add disconnected nodes at the end
  const disconnectedNodes = Array.from(nodes.keys()).filter(node => !sequence.includes(node));
  if (disconnectedNodes.length > 0) {
    console.log(`Found ${disconnectedNodes.length} disconnected nodes, adding to end of sequence`);
    sequence.push(...disconnectedNodes);
  }
  
  // Generate page mappings
  const { nodeToPage, pageToNode } = generatePageMappings(sequence);
  
  // Calculate total pages
  const totalPages = sequence.length;
  console.log(`Total pages in story: ${totalPages}`);
  
  return { nodeToPage, pageToNode, totalPages };
};

// Re-export necessary functions from the submodules
export {
  extractAllNodesFromInkJSON,
  extractCustomStoryFromInkJSON,
  validateNodeMappings
};
