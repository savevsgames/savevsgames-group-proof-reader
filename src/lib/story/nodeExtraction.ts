import { CustomStory } from '@/types';
import { parseInkNode } from './inkParser';

// Function to extract a full story from Ink JSON with improved flow tracking
export const parseFullInkStory = (storyData: any): CustomStory => {
  console.log("[Story Parsing] Starting full story parsing");
  
  if (!storyData) {
    console.warn("[Story Parsing] No story data provided");
    return {};
  }
  
  // Log the structure of the incoming data to help debug
  console.log("[Story Parsing] Story data structure:", {
    inkVersion: storyData.inkVersion,
    hasRoot: !!storyData.root,
    hasStart: !!storyData.start,
    topLevelKeysCount: Object.keys(storyData).length,
    // Show some sample top-level keys
    sampleKeys: Object.keys(storyData).slice(0, 10)
  });
  
  // Detect if this is Ink.js format (has inkVersion property and root array)
  const isInkFormat = storyData.inkVersion && Array.isArray(storyData.root);
  
  if (isInkFormat) {
    console.log("[Story Parsing] Detected Ink.js format, using specialized parser");
    return parseInkJsFormat(storyData);
  }
  
  // Handle our custom format with start/root node
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
    
    console.log(`[Story Parsing] Processed node ${currentNodeName}`, {
      textLength: nodeText.length,
      choicesCount: nodeChoices.length,
      isEnding
    });
    
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

/**
 * Parse an Ink.js format story into our CustomStory format
 * This handles the specific structure of Ink.js JSON
 */
function parseInkJsFormat(storyData: any): CustomStory {
  console.log("[Ink Parsing] Starting Ink.js format parsing");
  
  const customStory: CustomStory = {};
  
  try {
    // Process the root array to extract text content
    if (Array.isArray(storyData.root)) {
      console.log("[Ink Parsing] Processing root array with", storyData.root.length, "elements");
      
      // Extract story fragments from the root array
      const storyFragments = extractInkStoryFragments(storyData);
      console.log(`[Ink Parsing] Extracted ${storyFragments.length} story fragments`);
      
      // Convert fragments to our custom story format
      storyFragments.forEach((fragment, index) => {
        // We'll use fragment IDs as node keys
        const nodeKey = fragment.id || `fragment_${index}`;
        
        // Process text for potential image descriptions
        let text = fragment.text;
        let images = [];
        
        // Extract image descriptions (marked with IMAGE: prefix)
        if (text.includes('IMAGE:')) {
          const imageMatch = text.match(/IMAGE:\s*\[(.*?)\]/);
          if (imageMatch && imageMatch[1]) {
            images.push({ description: imageMatch[1] });
            // Optionally keep the image text in the content
          }
        }
        
        // Create the story node
        customStory[nodeKey] = {
          text: text,
          choices: [], // Will be populated based on structure
          images: images.length > 0 ? images : undefined,
          isEnding: !fragment.hasChoices && index === storyFragments.length - 1
        };
        
        console.log(`[Ink Parsing] Created node ${nodeKey}`, {
          textLength: text.length,
          hasImages: images.length > 0,
          isEnding: !fragment.hasChoices && index === storyFragments.length - 1
        });
        
        // Link fragments linearly if not the last one
        if (index < storyFragments.length - 1) {
          const nextNodeKey = storyFragments[index + 1].id || `fragment_${index + 1}`;
          customStory[nodeKey].choices = [{
            text: "Continue",
            nextNode: nextNodeKey
          }];
        }
      });
      
      // If we have at least one fragment, set the first one as the start node
      if (storyFragments.length > 0) {
        const firstNodeKey = storyFragments[0].id || 'fragment_0';
        customStory.start = customStory[firstNodeKey];
        console.log(`[Ink Parsing] Set start node to ${firstNodeKey}`);
      }
    } else {
      console.warn("[Ink Parsing] No valid root array found in Ink story");
    }
  } catch (error) {
    console.error("[Ink Parsing] Error parsing Ink.js format:", error);
  }
  
  console.log(`[Ink Parsing] Completed with ${Object.keys(customStory).length} nodes`);
  return customStory;
}

/**
 * Extract story fragments from an Ink.js format story
 */
function extractInkStoryFragments(storyData: any): Array<{id: string, text: string, hasChoices: boolean}> {
  // Initialize with an empty array
  const fragments: Array<{id: string, text: string, hasChoices: boolean}> = [];
  
  try {
    // The main story content in Ink.js format is in the root array
    if (storyData && Array.isArray(storyData.root)) {
      console.log("[Ink Extraction] Processing root array with", storyData.root.length, "elements");
      
      // Track text being built up
      let currentText = '';
      let fragmentCount = 0;
      let hasChoices = false;
      
      // Process each element in the root array
      storyData.root.forEach((element, index) => {
        // Text elements start with ^
        if (typeof element === 'string' && element.startsWith('^')) {
          const text = element.substring(1).trim();
          
          // Check for natural fragment boundaries (like paragraph breaks, image markers, etc.)
          const isNewFragment = text.includes('IMAGE:') || 
                               (currentText.length > 0 && (text.startsWith('CHAPTER') || text.startsWith('Chapter')));
          
          if (isNewFragment && currentText.length > 0) {
            // Save the current fragment
            fragments.push({
              id: `fragment_${fragmentCount}`,
              text: currentText.trim(),
              hasChoices
            });
            
            // Reset for the next fragment
            fragmentCount++;
            currentText = '';
            hasChoices = false;
          }
          
          // Add this text
          currentText += (currentText ? ' ' : '') + text;
        }
        // Choice arrays
        else if (Array.isArray(element)) {
          hasChoices = true;
          
          // End the current fragment if we have text
          if (currentText.length > 0) {
            fragments.push({
              id: `fragment_${fragmentCount}`,
              text: currentText.trim(),
              hasChoices: true
            });
            
            // Reset for the next fragment
            fragmentCount++;
            currentText = '';
            hasChoices = false;
          }
        }
        // End of the root array, save any remaining fragment
        else if (index === storyData.root.length - 1 && currentText.length > 0) {
          fragments.push({
            id: `fragment_${fragmentCount}`,
            text: currentText.trim(),
            hasChoices
          });
        }
      });
      
      // Handle named content sections
      Object.keys(storyData).forEach(key => {
        // Skip standard Ink.js properties
        if (['inkVersion', 'listDefs', '#f', 'root'].includes(key)) {
          return;
        }
        
        // If it's a section with content
        if (Array.isArray(storyData[key])) {
          let sectionText = '';
          storyData[key].forEach(element => {
            if (typeof element === 'string' && element.startsWith('^')) {
              sectionText += (sectionText ? ' ' : '') + element.substring(1).trim();
            }
          });
          
          if (sectionText.length > 0) {
            fragments.push({
              id: key,
              text: sectionText.trim(),
              hasChoices: false
            });
          }
        }
      });
    }
  } catch (error) {
    console.error("[Ink Extraction] Error extracting story fragments:", error);
  }
  
  // If no fragments were found, create a default fragment to avoid empty stories
  if (fragments.length === 0) {
    fragments.push({
      id: 'fragment_default',
      text: 'Story content could not be parsed correctly.',
      hasChoices: false
    });
  }
  
  console.log(`[Ink Extraction] Extracted ${fragments.length} total story fragments`);
  return fragments;
}

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
  if (nodeNames.length <= 10) {
    console.log("[Node Extraction] Node names:", nodeNames);
  } else {
    console.log("[Node Extraction] First 10 node names:", nodeNames.slice(0, 10));
  }
  
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
