
import { CustomStory } from './types';
import { parseInkNode } from './inkParser';

// Function to extract a full story from Ink JSON
export const parseFullInkStory = (storyData: any): CustomStory => {
  if (!storyData) return {};
  
  // Get all nodes using our new function
  const storyNodes = extractAllNodesFromInkJSON(storyData);
  console.log("Extracted all nodes from Ink JSON:", storyNodes);
  
  const customStory: CustomStory = {};
  
  // First, handle the root node specially
  if (storyData.root) {
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
  }
  
  // Now process the nested nodes that are inside the last element of root array
  if (storyData.root && Array.isArray(storyData.root) && storyData.root.length > 2) {
    const nestedNodesContainer = storyData.root[storyData.root.length - 1];
    
    if (typeof nestedNodesContainer === 'object' && nestedNodesContainer !== null) {
      // Process each nested node
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
              }
              // Check for navigation
              else if (typeof element === 'object' && element && element['->']) {
                nextNode = element['->'];
              }
              // Check for ending
              else if (element === 'end') {
                isEnding = true;
              }
            }
          }
          
          // Create the node in our custom format
          customStory[nodeName] = {
            text: nodeText.trim(),
            choices: nextNode ? [{ text: 'Continue', nextNode }] : [],
            isEnding
          };
        }
      }
    }
  }
  
  console.log("Parsed full Ink story into custom format:", customStory);
  console.log("Total nodes in custom story:", Object.keys(customStory).length);
  
  return customStory;
};

// THIS IS THE NEW FUNCTION ADDED TO PARSE NESTED NODES FROM THE INK JSON
// This function extracts all story nodes from the nested Ink JSON structure
export const extractAllNodesFromInkJSON = (storyData: any): string[] => {
  if (!storyData) return [];
  
  // Start with the known first-level nodes (excluding metadata)
  const directNodes = Object.keys(storyData).filter(key => 
    key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
  );
  
  // Check if there's a root node containing other nodes
  if (storyData.root && Array.isArray(storyData.root) && storyData.root.length > 2) {
    // The last element in the root array might be an object containing other nodes
    const lastElement = storyData.root[storyData.root.length - 1];
    
    if (typeof lastElement === 'object' && lastElement !== null) {
      // Filter out metadata and function properties
      const nestedNodes = Object.keys(lastElement).filter(key =>
        key !== '#f' && !key.startsWith('#')
      );
      
      // If we found nested nodes, return them along with the root node
      if (nestedNodes.length > 0) {
        return [...directNodes, ...nestedNodes];
      }
    }
  }
  
  // Return direct nodes if no nested nodes found
  return directNodes;
};

// Helper to recursively extract nodes - legacy support
export const extractNodesRecursively = (inkJSON: any, customStory: CustomStory, nodeName: string) => {
  if (!inkJSON[nodeName]) return;
  
  try {
    const parsedNode = parseInkNode(inkJSON, nodeName);
    
    customStory[nodeName] = {
      text: parsedNode.text || '',
      choices: parsedNode.choices || [],
      isEnding: parsedNode.isEnding
    };
    
    // Extract any linked nodes
    if (parsedNode.nextNode && !customStory[parsedNode.nextNode]) {
      extractNodesRecursively(inkJSON, customStory, parsedNode.nextNode);
    }
    
    // Extract nodes from choices
    for (const choice of parsedNode.choices) {
      if (choice.nextNode && !customStory[choice.nextNode]) {
        extractNodesRecursively(inkJSON, customStory, choice.nextNode);
      }
    }
  } catch (e) {
    console.error(`Error extracting node ${nodeName}:`, e);
  }
};
