
import { CustomStory } from './types';
import { supabase } from '../supabase';

// Function to generate mappings based on story data - improved version with logging
export const generateNodeMappings = (storyData: any) => {
  console.log("[Node Mapping] Starting node mapping generation", { dataType: typeof storyData });
  
  if (!storyData) {
    console.warn("[Node Mapping] No story data provided");
    return { 
      storyNodeToPageMap: {}, 
      pageToStoryNodeMap: {},
      totalPages: 0
    };
  }
  
  // Create empty mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Process all nodes from story data, filtering out metadata nodes
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const allNodes = Object.keys(storyData).filter(key => !skipKeys.includes(key));
  
  console.log(`[Node Mapping] Found ${allNodes.length} potential story nodes`);
  
  // Process nested array-style nodes (e.g., root[0][1])
  const arrayStyleNodes = allNodes.filter(node => node.includes('[') && node.includes(']'));
  const standardNodes = allNodes.filter(node => !node.includes('[') && !node.includes(']'));
  
  console.log(`[Node Mapping] Node breakdown:`, {
    standard: standardNodes.length,
    arrayStyle: arrayStyleNodes.length,
    total: allNodes.length
  });
  
  // Add all valid content nodes (those with text or choices)
  const contentNodes = allNodes.filter(nodeName => {
    const node = storyData[nodeName];
    return node && (
      (typeof node === 'object' && (node.text || (node.choices && node.choices.length > 0))) ||
      (typeof node === 'string' && node.trim().length > 0)
    );
  });
  
  console.log(`[Node Mapping] Found ${contentNodes.length} nodes with actual content`);
  
  // Prioritize certain nodes (root first, then standard nodes, then array nodes)
  const prioritizedNodes = [
    // Root node always comes first if it exists
    ...contentNodes.filter(node => node === 'root' || node === 'start'),
    // Then standard nodes
    ...contentNodes.filter(node => !node.includes('[') && node !== 'root' && node !== 'start'),
    // Then array-style nodes, sorted by complexity for readability
    ...contentNodes.filter(node => node.includes('['))
                   .sort((a, b) => {
                     const aDepth = (a.match(/\[/g) || []).length;
                     const bDepth = (b.match(/\[/g) || []).length;
                     return aDepth - bDepth || a.localeCompare(b);
                   })
  ];
  
  console.log(`[Node Mapping] Nodes after prioritization: ${prioritizedNodes.length}`);
  
  // Assign sequential page numbers
  let pageNumber = 1;
  for (const nodeName of prioritizedNodes) {
    nodeToPage[nodeName] = pageNumber;
    pageToNode[pageNumber] = nodeName;
    pageNumber++;
  }
  
  // Calculate total pages
  const totalPages = prioritizedNodes.length;
  
  console.log(`[Node Mapping] Final mapping statistics:`, {
    totalPages,
    mappedNodes: Object.keys(nodeToPage).length,
    rootNodePage: nodeToPage['root'] || 'N/A'
  });
  
  // Log the first few mappings for debugging
  const previewLimit = Math.min(5, Object.keys(nodeToPage).length);
  const mappingPreview = Object.entries(nodeToPage)
    .slice(0, previewLimit)
    .reduce((acc, [node, page]) => {
      acc[node] = page;
      return acc;
    }, {} as Record<string, number>);
  
  console.log(`[Node Mapping] First ${previewLimit} mappings:`, mappingPreview);
  
  // Return the mappings and total page count
  return {
    storyNodeToPageMap: nodeToPage,
    pageToStoryNodeMap: pageToNode,
    totalPages
  };
};

// Helper function to validate the generated mappings
export const validateNodeMappings = (
  storyData: CustomStory,
  nodeToPage: Record<string, number>,
  pageToNode: Record<number, string>
): boolean => {
  console.log("[Mapping Validation] Starting mapping validation");
  
  // Skip known metadata keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const storyNodes = Object.keys(storyData).filter(key => !skipKeys.includes(key));
  
  // Check if all story nodes have a mapping
  const unmappedNodes = storyNodes.filter(nodeId => !(nodeId in nodeToPage));
  const hasAllNodes = unmappedNodes.length === 0;
  
  if (!hasAllNodes) {
    console.warn(`[Mapping Validation] Found ${unmappedNodes.length} unmapped nodes:`, 
      unmappedNodes.slice(0, 5)); // Only show first 5 for brevity
  }
  
  // Check page mapping is sequential (1, 2, 3...)
  const pages = Object.keys(pageToNode).map(Number).sort((a, b) => a - b);
  const isSequential = pages.every((page, i) => page === i + 1);
  
  if (!isSequential) {
    console.warn("[Mapping Validation] Page numbers not sequential:", pages);
  }
  
  // Verify bidirectional mapping (node→page→node matches original node)
  const brokenMappings = Object.entries(nodeToPage).filter(
    ([nodeId, page]) => pageToNode[page] !== nodeId
  );
  const isBidirectional = brokenMappings.length === 0;
  
  if (!isBidirectional) {
    console.warn("[Mapping Validation] Inconsistent bidirectional mappings:", brokenMappings);
  }
  
  const isValid = hasAllNodes && isSequential && isBidirectional;
  console.log(`[Mapping Validation] Validation result: ${isValid ? 'Valid' : 'Invalid'}`);
  
  return isValid;
};

// Add default mappings for backward compatibility
export const storyNodeToPageMap: Record<string, number> = {};
export const pageToStoryNodeMap: Record<number, string> = {};
