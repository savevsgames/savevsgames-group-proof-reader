
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
      
      // Track created nodes for debugging (limited to 100)
      const createdNodes: Array<{id: string, text: string}> = [];
      const logNode = (id: string, text: string) => {
        if (createdNodes.length < 100) {
          createdNodes.push({id, text});
          console.log(`[Ink Parsing] Created node ${id}:`, {
            textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
        }
      };
      
      // Extract story segments for better pagination
      const storySegments = extractStorySegmentsFromRoot(storyData.root);
      console.log(`[Ink Parsing] Extracted ${storySegments.length} segments from root array`);
      
      // Create nodes from segments with proper flow connections
      storySegments.forEach((segment, index) => {
        const nodeKey = `fragment_${index}`;
        
        // Create node with next segment as a "Continue" choice if not the last one
        const hasNextSegment = index < storySegments.length - 1;
        const choices = hasNextSegment ? [{
          text: "Continue",
          nextNode: `fragment_${index + 1}`
        }] : [];
        
        customStory[nodeKey] = {
          text: segment.text,
          choices: choices,
          isEnding: !hasNextSegment
        };
        
        logNode(nodeKey, segment.text);
      });
      
      console.log(`[Ink Parsing] Created ${Object.keys(customStory).length} nodes from ${storySegments.length} segments`);
      
      // If we have at least one node, mark the first one as the start
      if (storySegments.length > 0) {
        customStory['start'] = customStory['fragment_0'];
        console.log("[Ink Parsing] Set first segment as the start node");
      }
    } else {
      console.warn("[Ink Parsing] No valid root array found");
    }
  } catch (error) {
    console.error("[Ink Parsing] Error parsing Ink.js format:", error);
  }
  
  // Ensure we have at least one node
  if (Object.keys(customStory).length === 0) {
    customStory['fragment_0'] = {
      text: "Story content could not be parsed correctly.",
      choices: [],
      isEnding: true
    };
    console.log("[Ink Parsing] Created default node due to parsing failure");
  }
  
  console.log(`[Ink Parsing] Completed with ${Object.keys(customStory).length} total nodes`);
  return customStory;
}

/**
 * Extract story segments from Ink.js root array with improved text extraction
 */
function extractStorySegmentsFromRoot(rootArray: any[]): Array<{text: string}> {
  const segments: Array<{text: string}> = [];
  
  // Track the current segment being built
  let currentText = '';
  const paragraphBreakThreshold = 100; // Characters before we consider natural paragraph breaks
  
  // Process each element in the root array
  for (let i = 0; i < rootArray.length; i++) {
    const element = rootArray[i];
    
    // Handle array elements (most Ink.js content is in nested arrays)
    if (Array.isArray(element)) {
      // Extract any text elements (they start with ^)
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        
        if (typeof item === 'string' && item.startsWith('^')) {
          // Extract the text without the ^ marker
          const textContent = item.substring(1).trim();
          
          // Add to current text with a space
          if (currentText) currentText += ' ';
          currentText += textContent;
          
          // Check for natural segment breaks (like paragraph endings)
          const hasSegmentBreak = textContent.endsWith('.') || 
                                 textContent.endsWith('!') || 
                                 textContent.endsWith('?');
                                 
          // Create a new segment if we have enough text and a natural break
          // or if we're at the end of the current array
          if (currentText.length > paragraphBreakThreshold && hasSegmentBreak) {
            segments.push({ text: currentText });
            console.log(`[Ink Parsing] Created segment at natural break: "${currentText.substring(0, 50)}..."`);
            currentText = '';
          }
        }
      }
      
      // Check for flow control or choice markers at the end of an array section
      const hasFlowControl = element.some(item => 
        (typeof item === 'object' && item !== null && item['^->']) || 
        (typeof item === 'string' && item === 'ev')
      );
      
      // If we have flow control and accumulated text, create a segment
      if (hasFlowControl && currentText) {
        segments.push({ text: currentText });
        console.log(`[Ink Parsing] Created segment at flow control: "${currentText.substring(0, 50)}..."`);
        currentText = '';
      }
    }
  }
  
  // Add any remaining text as a final segment
  if (currentText) {
    segments.push({ text: currentText });
    console.log(`[Ink Parsing] Created final segment from remaining text: "${currentText.substring(0, 50)}..."`);
  }
  
  // Ensure we have at least one segment
  if (segments.length === 0) {
    segments.push({ text: "Story content could not be parsed correctly." });
    console.log("[Ink Parsing] No segments found, created default segment");
  }
  
  console.log(`[Ink Parsing] Extracted ${segments.length} total story segments`);
  return segments;
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
