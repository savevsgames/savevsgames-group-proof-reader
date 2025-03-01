
import { CustomStory } from './types';
import { parseInkNode } from './inkParser';

// Function to extract a full story from Ink JSON with improved logging
export const parseFullInkStory = (storyData: any): CustomStory => {
  console.log("[Story Parsing] Starting full Ink story parsing");
  
  if (!storyData) {
    console.warn("[Story Parsing] No story data provided");
    return {};
  }
  
  // Get all nodes using our node extraction function
  console.log("[Story Parsing] Extracting all nodes from Ink JSON");
  const storyNodes = extractAllNodesFromInkJSON(storyData);
  console.log(`[Story Parsing] Extracted ${storyNodes.length} nodes from Ink JSON`);
  
  const customStory: CustomStory = {};
  
  // First, handle the root node specially
  if (storyData.root) {
    console.log("[Story Parsing] Processing root node");
    // Extract text from the root node (usually in the first array element)
    let rootText = "";
    if (Array.isArray(storyData.root) && storyData.root.length > 0) {
      // Find text elements (strings starting with ^)
      for (const element of storyData.root) {
        if (typeof element === 'string' && element.startsWith('^')) {
          rootText += element.substring(1) + '\n';
        }
      }
    }
    
    // Find navigation from root (usually a -> element)
    let rootNextNode = null;
    if (Array.isArray(storyData.root)) {
      for (const element of storyData.root) {
        if (typeof element === 'object' && element && element['->']) {
          rootNextNode = element['->'];
          break;
        }
      }
    }
    
    // Create the root node in our custom format
    customStory['root'] = {
      text: rootText.trim(),
      choices: rootNextNode ? [{ text: 'Continue', nextNode: rootNextNode }] : []
    };
    
    console.log("[Story Parsing] Root node processed", {
      textLength: rootText.length,
      hasNextNode: !!rootNextNode
    });
  }
  
  // Now process the nested nodes that are inside the last element of root array
  if (storyData.root && Array.isArray(storyData.root) && storyData.root.length > 2) {
    console.log("[Story Parsing] Processing nested nodes in root array");
    const nestedNodesContainer = storyData.root[storyData.root.length - 1];
    
    if (typeof nestedNodesContainer === 'object' && nestedNodesContainer !== null) {
      // Process each nested node
      let processedCount = 0;
      let textNodesCount = 0;
      let choiceNodesCount = 0;
      let endingNodesCount = 0;
      
      for (const nodeName of storyNodes) {
        // Skip the root node as we've already processed it
        if (nodeName === 'root') continue;
        
        // Get the node data from the nested container
        const nodeData = nestedNodesContainer[nodeName];
        
        if (nodeData) {
          // Extract text - typically the first element in the array if it's an array
          let nodeText = "";
          let nextNode = null;
          let isEnding = false;
          
          if (Array.isArray(nodeData)) {
            // Process text elements
            for (const element of nodeData) {
              if (typeof element === 'string' && element.startsWith('^')) {
                nodeText += element.substring(1) + '\n';
                textNodesCount++;
              }
              // Check for navigation
              else if (typeof element === 'object' && element && element['->']) {
                nextNode = element['->'];
                choiceNodesCount++;
              }
              // Check for ending
              else if (element === 'end') {
                isEnding = true;
                endingNodesCount++;
              }
            }
          }
          
          // Create the node in our custom format
          customStory[nodeName] = {
            text: nodeText.trim(),
            choices: nextNode ? [{ text: 'Continue', nextNode }] : [],
            isEnding
          };
          
          processedCount++;
        }
      }
      
      console.log(`[Story Parsing] Processed ${processedCount} nested nodes`, {
        withText: textNodesCount,
        withChoices: choiceNodesCount,
        withEndings: endingNodesCount
      });
    }
  }
  
  console.log(`[Story Parsing] Completed parsing. Total nodes: ${Object.keys(customStory).length}`);
  
  return customStory;
};

// Function to extract all story nodes from the nested Ink JSON structure with improved logging
export const extractAllNodesFromInkJSON = (storyData: any): string[] => {
  console.log("[Node Extraction] Starting node extraction from Ink JSON");
  
  if (!storyData) {
    console.warn("[Node Extraction] No story data provided");
    return [];
  }
  
  // Start with the known first-level nodes (excluding metadata)
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const directNodes = Object.keys(storyData).filter(key => !skipKeys.includes(key));
  
  console.log(`[Node Extraction] Found ${directNodes.length} direct nodes`);
  
  let nestedNodes: string[] = [];
  
  // Check if there's a root node containing other nodes
  if (storyData.root && Array.isArray(storyData.root) && storyData.root.length > 2) {
    console.log("[Node Extraction] Analyzing root array for nested nodes");
    
    // The last element in the root array might be an object containing other nodes
    const lastElement = storyData.root[storyData.root.length - 1];
    
    if (typeof lastElement === 'object' && lastElement !== null) {
      // Filter out metadata and function properties
      nestedNodes = Object.keys(lastElement).filter(key =>
        key !== '#f' && !key.startsWith('#')
      );
      
      console.log(`[Node Extraction] Found ${nestedNodes.length} nested nodes in root array`);
    }
  }
  
  // Also look for array-style nodes like root[0][1]
  let arrayStyleNodes: string[] = [];
  
  // Helper function to recursively extract array-style nodes
  const extractArrayNodes = (obj: any, path: string = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        
        // If this item has content, add it as a node
        if (typeof item === 'string' && item.startsWith('^')) {
          arrayStyleNodes.push(newPath);
        }
        
        extractArrayNodes(item, newPath);
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        // Skip metadata keys
        if (skipKeys.includes(key)) return;
        
        const newPath = path ? `${path}.${key}` : key;
        extractArrayNodes(value, newPath);
      });
    }
  };
  
  extractArrayNodes(storyData.root, 'root');
  console.log(`[Node Extraction] Found ${arrayStyleNodes.length} array-style nodes`);
  
  // Combine all node types into a single list, removing duplicates
  const allNodes = [...new Set([...directNodes, ...nestedNodes, ...arrayStyleNodes])];
  
  console.log(`[Node Extraction] Total unique nodes found: ${allNodes.length}`);
  
  return allNodes;
};

// Helper to recursively extract nodes - legacy support with improved logging
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
    
    console.log(`[Recursive Extraction] Added node "${nodeName}" to story`, {
      textLength: parsedNode.text?.length || 0,
      choicesCount: parsedNode.choices?.length || 0,
      isEnding: parsedNode.isEnding
    });
    
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
