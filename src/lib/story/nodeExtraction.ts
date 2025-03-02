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
 * Enhanced parser for Ink.js format story into our CustomStory format
 * This handles the specific structure of Ink.js JSON with better support
 * for complex nested structures and flow control
 */
function parseInkJsFormat(storyData: any): CustomStory {
  console.log("[Ink Parsing] Starting Ink.js format parsing");
  
  const customStory: CustomStory = {};
  
  try {
    // Process metadata fields first
    if (storyData.inkVersion) {
      customStory.inkVersion = storyData.inkVersion;
    }
    
    if (storyData.listDefs) {
      customStory.listDefs = storyData.listDefs;
    }
    
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
      
      // Extract story segments with enhanced recognition of structure
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
    }
    
    // Process non-root nodes (knots and stitches)
    const knots = Object.keys(storyData).filter(key => 
      key !== 'inkVersion' && 
      key !== 'listDefs' && 
      key !== 'root' &&
      key !== '#f' && // Metadata container in some Ink versions
      typeof storyData[key] === 'object'
    );
    
    console.log(`[Ink Parsing] Processing ${knots.length} knots and stitches`);
    
    // Process each knot/stitch to extract content
    knots.forEach(knotName => {
      const knotData = storyData[knotName];
      
      // Skip if not a valid container
      if (!knotData || typeof knotData !== 'object') return;
      
      console.log(`[Ink Parsing] Processing knot: ${knotName}`);
      
      // Extract content from the knot
      const knotContent = Array.isArray(knotData) 
        ? extractContentFromArray(knotData)
        : { text: '', choices: [] };
      
      // Create the node with extracted content
      customStory[knotName] = {
        text: knotContent.text,
        choices: knotContent.choices,
        isEnding: knotContent.choices.length === 0
      };
      
      console.log(`[Ink Parsing] Created node for knot ${knotName}:`, {
        textLength: knotContent.text.length,
        choicesCount: knotContent.choices.length
      });
    });
    
  } catch (error) {
    console.error("[Ink Parsing] Error parsing Ink.js format:", error);
  }
  
  // Ensure we have at least one node
  if (Object.keys(customStory).length === 0 || 
      !Object.keys(customStory).some(key => 
        key !== 'inkVersion' && 
        key !== 'listDefs' && 
        customStory[key] && 
        typeof customStory[key] === 'object'
      )) {
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
 * Extract content from a knot/stitch array with improved choice handling
 */
function extractContentFromArray(array: any[]): { text: string, choices: any[] } {
  let text = '';
  const choices: any[] = [];
  
  // Process array elements
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    
    // Handle text elements
    if (typeof element === 'string' && element.startsWith('^')) {
      text += (text ? ' ' : '') + element.substring(1);
    }
    
    // Handle nested arrays (common for choice structures)
    if (Array.isArray(element)) {
      // First, check if this is a choice marker array (usually starts with *)
      const isChoiceArray = element.some(item => 
        typeof item === 'object' && item !== null && 
        (item['*'] || item['+'] || item['-'])
      );
      
      if (isChoiceArray) {
        // Process each choice in the array
        element.forEach(choiceElement => {
          if (typeof choiceElement === 'object' && choiceElement !== null) {
            // Check for choice markers (* for basic choices, + for sticky)
            if (choiceElement['*'] || choiceElement['+']) {
              const marker = choiceElement['*'] ? '*' : '+';
              const choiceContent = choiceElement[marker];
              
              if (Array.isArray(choiceContent)) {
                // Extract choice text and target
                const choiceText = choiceContent.find(item => 
                  typeof item === 'string' && item.startsWith('^')
                );
                
                const divert = choiceContent.find(item => 
                  typeof item === 'object' && item !== null && item['^->']
                );
                
                if (choiceText) {
                  const target = divert ? divert['^->'] : '';
                  choices.push({
                    text: choiceText.substring(1).trim(),
                    nextNode: target,
                    type: marker === '*' ? 'basic' : 'sticky'
                  });
                }
              }
            }
          }
        });
      } else {
        // Check if this is a single choice structure
        const choiceText = element.find(item => 
          typeof item === 'string' && item.startsWith('^')
        );
        
        if (choiceText) {
          // Look for target in the next elements
          let target = '';
          const divert = element.find(item => 
            typeof item === 'object' && item !== null && item['^->']
          );
          
          if (divert) {
            target = divert['^->'];
          }
          
          if (choiceText) {
            choices.push({
              text: choiceText.substring(1).trim(),
              nextNode: target
            });
          }
        } else {
          // Recursively process nested content
          const nestedContent = extractContentFromArray(element);
          if (nestedContent.text) {
            text += (text ? ' ' : '') + nestedContent.text;
          }
          
          // Add any choices found in nested content
          if (nestedContent.choices.length > 0) {
            choices.push(...nestedContent.choices);
          }
        }
      }
    }
    
    // Handle special choice objects directly in the array
    if (typeof element === 'object' && element !== null) {
      // Check for choice markers
      if (element['*'] || element['+']) {
        const marker = element['*'] ? '*' : '+';
        const choiceData = element[marker];
        
        if (Array.isArray(choiceData)) {
          // Process choice content
          const choiceText = choiceData.find(item => 
            typeof item === 'string' && item.startsWith('^')
          );
          
          const divert = choiceData.find(item => 
            typeof item === 'object' && item !== null && item['^->']
          );
          
          if (choiceText) {
            choices.push({
              text: choiceText.substring(1).trim(),
              nextNode: divert ? divert['^->'] : '',
              type: marker === '*' ? 'basic' : 'sticky'
            });
          }
        }
      }
      
      // Handle direct divert objects
      if (element['^->']) {
        const target = element['^->'];
        if (target && target !== '<end>') {
          choices.push({
            text: 'Continue',
            nextNode: target
          });
        }
      }
    }
  }
  
  return { text, choices };
}

/**
 * Extract story segments from Ink.js root array with improved choice recognition
 */
function extractStorySegmentsFromRoot(rootArray: any[]): Array<{text: string, choices: any[]}> {
  const segments: Array<{text: string, choices: any[]}> = [];
  
  // Track the current segment being built
  let currentText = '';
  let currentChoices: any[] = [];
  const paragraphBreakThreshold = 100; // Characters before we consider natural paragraph breaks
  
  // Process each element in the root array
  for (let i = 0; i < rootArray.length; i++) {
    const element = rootArray[i];
    
    // Handle array elements (most Ink.js content is in nested arrays)
    if (Array.isArray(element)) {
      // First, check if this is a choice array
      const isChoiceArray = element.some(item => 
        typeof item === 'object' && item !== null && 
        (item['*'] || item['+'] || item['-'])
      );
      
      if (isChoiceArray) {
        // Process choice array differently - create a segment with the current text
        // and add the choices from this array
        if (currentText) {
          const choiceContent = extractChoicesFromArray(element);
          segments.push({ 
            text: currentText, 
            choices: choiceContent.choices 
          });
          console.log(`[Ink Parsing] Created segment with ${choiceContent.choices.length} choices`);
          currentText = '';
          currentChoices = [];
        }
      } else {
        // Extract text and any nested choices
        const { text, choices } = extractContentFromArray(element);
        
        if (text) {
          currentText += (currentText ? ' ' : '') + text;
        }
        
        if (choices.length > 0) {
          currentChoices.push(...choices);
          
          // If we have both text and choices, create a segment
          if (currentText) {
            segments.push({ 
              text: currentText, 
              choices: currentChoices 
            });
            console.log(`[Ink Parsing] Created segment with text and ${choices.length} choices`);
            currentText = '';
            currentChoices = [];
          }
        }
      }
    }
    
    // Check for direct choice objects at the top level
    if (typeof element === 'object' && element !== null) {
      if (element['*'] || element['+']) {
        // If we have accumulated text, create a segment before processing the choice
        if (currentText) {
          segments.push({ 
            text: currentText, 
            choices: []
          });
          currentText = '';
        }
        
        // Process the choice
        const marker = element['*'] ? '*' : '+';
        const choiceData = element[marker];
        
        if (Array.isArray(choiceData)) {
          const choiceContent = extractChoicesFromArray([element]);
          segments.push({ 
            text: "What would you like to do?", // Default prompt text
            choices: choiceContent.choices 
          });
          console.log(`[Ink Parsing] Created choice segment with ${choiceContent.choices.length} choices`);
        }
      }
      
      // Check for direct divert objects
      if (element['^->']) {
        // If we have accumulated text, create a segment before the divert
        if (currentText) {
          segments.push({ 
            text: currentText, 
            choices: [{
              text: 'Continue',
              nextNode: element['^->']
            }]
          });
          console.log(`[Ink Parsing] Created segment before divert: "${currentText.substring(0, 50)}..."`);
          currentText = '';
        }
      }
    }
    
    // Check for natural segment breaks
    if (currentText.length > paragraphBreakThreshold && 
        (currentText.endsWith('.') || currentText.endsWith('!') || currentText.endsWith('?'))) {
      segments.push({ 
        text: currentText, 
        choices: currentChoices.length > 0 ? currentChoices : [{
          text: 'Continue',
          nextNode: 'fragment_' + (segments.length + 1)
        }]
      });
      console.log(`[Ink Parsing] Created segment at natural break: "${currentText.substring(0, 50)}..."`);
      currentText = '';
      currentChoices = [];
    }
  }
  
  // Add any remaining text as a final segment
  if (currentText) {
    segments.push({ 
      text: currentText, 
      choices: currentChoices
    });
    console.log(`[Ink Parsing] Created final segment from remaining text: "${currentText.substring(0, 50)}..."`);
  }
  
  // Ensure we have at least one segment
  if (segments.length === 0) {
    segments.push({ 
      text: "Story content could not be parsed correctly.", 
      choices: []
    });
    console.log("[Ink Parsing] No segments found, created default segment");
  }
  
  // Connect segments that don't have explicit choices
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].choices.length === 0 && i < segments.length - 1) {
      segments[i].choices = [{
        text: 'Continue',
        nextNode: 'fragment_' + (i + 1)
      }];
    }
  }
  
  console.log(`[Ink Parsing] Extracted ${segments.length} total story segments`);
  return segments;
}

/**
 * Helper function to extract choices from a choice array
 */
function extractChoicesFromArray(choiceArray: any[]): { choices: any[] } {
  const choices: any[] = [];
  
  choiceArray.forEach(element => {
    if (typeof element === 'object' && element !== null) {
      // Check for choice markers
      if (element['*'] || element['+']) {
        const marker = element['*'] ? '*' : '+';
        const choiceData = element[marker];
        
        if (Array.isArray(choiceData)) {
          choiceData.forEach(choiceItem => {
            if (Array.isArray(choiceItem)) {
              // Find text and target in the choice item
              const choiceText = choiceItem.find(item => 
                typeof item === 'string' && item.startsWith('^')
              );
              
              const divert = choiceItem.find(item => 
                typeof item === 'object' && item !== null && item['^->']
              );
              
              if (choiceText) {
                choices.push({
                  text: choiceText.substring(1).trim(),
                  nextNode: divert ? divert['^->'] : '',
                  type: marker === '*' ? 'basic' : 'sticky'
                });
                
                console.log(`[Ink Parsing] Extracted choice: "${choiceText.substring(1).trim()}" -> ${divert ? divert['^->'] : '(no target)'}`);
              }
            }
          });
        }
      }
    }
  });
  
  return { choices };
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
