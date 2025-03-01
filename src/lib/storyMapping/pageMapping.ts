
import { CustomStory } from "../storyUtils";

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
 * Validates node mappings against a story structure with improved diagnostics
 * @param storyData The story data to validate against
 * @param nodeToPage The node to page mapping
 * @param pageToNode The page to node mapping
 * @returns True if valid, false otherwise with reasons logged
 */
export const validateNodeMappings = (
  storyData: CustomStory,
  nodeToPage: Record<string, number>,
  pageToNode: Record<number, string>
): boolean => {
  // Check all story nodes have a page mapping
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const storyNodes = Object.keys(storyData).filter(key => !skipKeys.includes(key));
  
  // Check if all story nodes have a mapping
  const unmappedNodes = storyNodes.filter(nodeId => !(nodeId in nodeToPage));
  const hasAllNodes = unmappedNodes.length === 0;
  if (!hasAllNodes) {
    console.warn(`Validation failed: ${unmappedNodes.length} nodes without page mapping`, unmappedNodes);
  }
  
  // Check page mapping is sequential (1, 2, 3...)
  const pages = Object.keys(pageToNode).map(Number).sort((a, b) => a - b);
  const isSequential = pages.every((page, i) => page === i + 1);
  if (!isSequential) {
    console.warn(`Validation failed: Page numbers not sequential`, pages);
  }
  
  // Verify bidirectional mapping (node→page→node matches original node)
  const brokenMappings = Object.entries(nodeToPage).filter(
    ([nodeId, page]) => pageToNode[page] !== nodeId
  );
  const isBidirectional = brokenMappings.length === 0;
  if (!isBidirectional) {
    console.warn(`Validation failed: Inconsistent bidirectional mappings`, brokenMappings);
  }
  
  const isValid = hasAllNodes && isSequential && isBidirectional;
  console.log(`Mapping validation result: ${isValid ? 'Valid' : 'Invalid'}`);
  
  return isValid;
};
