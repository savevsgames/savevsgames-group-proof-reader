
import { CustomStory } from '@/types';
import { parseInkNode } from './inkParser';

// Function to extract a full story from Ink JSON with improved flow tracking
export const parseFullInkStory = (storyData: any): CustomStory => {
  console.log("[Story Parsing] Starting full story parsing");
  
  if (!storyData) {
    console.warn("[Story Parsing] No story data provided");
    return {};
  }
  
  const customStory: CustomStory = {};
  
  // Extract all node names first
  const nodeNames = extractStoryNodeNames(storyData);
  console.log(`[Story Parsing] Found ${nodeNames.length} potential story nodes`);
  
  // Process each node, starting with root/start
  const startNodeName = storyData.start ? 'start' : 'root';
  
  // Process nodes in a breadth-first manner to ensure proper flow
  const processedNodes = new Set<string>();
  const nodeQueue = [startNodeName];
  
  console.log(`[Story Parsing] Starting story traversal from ${startNodeName}`);
  
  while (nodeQueue.length > 0) {
    const currentNodeName = nodeQueue.shift() as string;
    
    // Skip already processed nodes
    if (processedNodes.has(currentNodeName)) {
      continue;
    }
    
    // Get the node data
    const nodeData = storyData[currentNodeName];
    
    // Skip invalid nodes
    if (!nodeData || typeof nodeData !== 'object') {
      console.warn(`[Story Parsing] Invalid node: ${currentNodeName}`);
      continue;
    }
    
    // Mark node as processed
    processedNodes.add(currentNodeName);
    
    // Extract text and choices from the node
    let nodeText = nodeData.text || '';
    let nodeChoices = nodeData.choices || [];
    let isEnding = !!nodeData.isEnding;
    
    // Create the node in our custom format
    customStory[currentNodeName] = {
      text: nodeText,
      choices: nodeChoices,
      isEnding
    };
    
    console.log(`[Story Parsing] Processed node ${currentNodeName} (isEnding: ${isEnding})`);
    
    // Queue up the next nodes from choices
    if (Array.isArray(nodeChoices)) {
      nodeChoices.forEach(choice => {
        if (choice && choice.nextNode && !processedNodes.has(choice.nextNode)) {
          nodeQueue.push(choice.nextNode);
          console.log(`[Story Parsing] Queued next node: ${choice.nextNode}`);
        }
      });
    }
  }
  
  console.log(`[Story Parsing] Completed parsing with ${Object.keys(customStory).length} nodes`);
  
  return customStory;
};

// Function to extract valid story node names
export const extractStoryNodeNames = (storyData: any): string[] => {
  console.log("[Node Extraction] Extracting story node names");
  
  if (!storyData) {
    console.warn("[Node Extraction] No story data provided");
    return [];
  }
  
  // Skip metadata keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Get all keys that represent actual story nodes (with text and choices)
  const nodeNames = Object.keys(storyData).filter(key => {
    if (skipKeys.includes(key)) return false;
    
    const node = storyData[key];
    return (
      node && 
      typeof node === 'object' && 
      !Array.isArray(node) && 
      (typeof node.text === 'string' || Array.isArray(node.choices))
    );
  });
  
  console.log(`[Node Extraction] Found ${nodeNames.length} story nodes`);
  console.log("[Node Extraction] Node names:", nodeNames);
  
  return nodeNames;
};

// Function to extract all story nodes from the nested Ink JSON structure (legacy method)
export const extractAllNodesFromInkJSON = (storyData: any): string[] => {
  console.log("[Node Extraction] Using legacy node extraction method");
  
  if (!storyData) {
    console.warn("[Node Extraction] No story data provided");
    return [];
  }
  
  // Use the new method for consistency
  return extractStoryNodeNames(storyData);
};

// Helper to recursively extract nodes - legacy support
export const extractNodesRecursively = (inkJSON: any, customStory: CustomStory, nodeName: string) => {
  console.log(`[Recursive Extraction] Processing node: ${nodeName}`);
  
  if (!inkJSON[nodeName]) {
    console.warn(`[Recursive Extraction] Node "${nodeName}" not found in ink JSON`);
    return;
  }
  
  try {
    const parsedNode = parseInkNode(inkJSON, nodeName);
    
    customStory[nodeName] = {
      text: parsedNode.text || '',
      choices: parsedNode.choices || [],
      isEnding: parsedNode.isEnding
    };
    
    console.log(`[Recursive Extraction] Added node "${nodeName}" to story`);
    
    // Extract any linked nodes
    if (parsedNode.nextNode && !customStory[parsedNode.nextNode]) {
      console.log(`[Recursive Extraction] Following link to node: ${parsedNode.nextNode}`);
      extractNodesRecursively(inkJSON, customStory, parsedNode.nextNode);
    }
    
    // Extract nodes from choices
    for (const choice of parsedNode.choices) {
      if (choice.nextNode && !customStory[choice.nextNode]) {
        console.log(`[Recursive Extraction] Following choice to node: ${choice.nextNode}`);
        extractNodesRecursively(inkJSON, customStory, choice.nextNode);
      }
    }
  } catch (e) {
    console.error(`[Recursive Extraction] Error extracting node ${nodeName}:`, e);
  }
};
