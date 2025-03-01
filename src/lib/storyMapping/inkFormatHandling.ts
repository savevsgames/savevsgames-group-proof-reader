
import { CustomStory } from "../storyUtils";
import { extractArrayNodes, extractAllNodesFromInkJSON } from "./nodeExtraction";
import { extractChoicesFromInkNode, extractTextFromInkNode, getNestedProperty } from "./utils";

/**
 * Converts an Ink.js story to our custom format with improved array handling
 * @param inkJson The original Ink.js JSON
 * @returns A story in our custom format
 */
export const extractCustomStoryFromInkJSON = (inkJson: any): CustomStory => {
  const customStory: CustomStory = { 
    inkVersion: inkJson.inkVersion 
  };
  
  // Get all nodes including array-style nodes
  const nodeNames = extractAllNodesFromInkJSON(inkJson);
  console.log("Extracted ink nodes:", nodeNames);
  
  // Process root container
  if (inkJson.root) {
    customStory.root = {
      text: extractTextFromInkNode(inkJson.root),
      choices: extractChoicesFromInkNode(inkJson.root, nodeNames)
    };
    
    // Also extract array nodes from root
    if (Array.isArray(inkJson.root)) {
      extractArrayNodes(inkJson.root, 'root', customStory, nodeNames);
    }
  }
  
  // Extract all other standard nodes
  nodeNames
    .filter(name => !name.includes('[') && !name.includes('.')) // Only process standard nodes here
    .forEach(nodeName => {
      const nodeContent = getNestedProperty(inkJson, nodeName);
      if (nodeContent && typeof nodeContent === 'object') {
        customStory[nodeName] = {
          text: extractTextFromInkNode(nodeContent),
          choices: extractChoicesFromInkNode(nodeContent, nodeNames)
        };
        
        // Also extract array nodes
        if (Array.isArray(nodeContent)) {
          extractArrayNodes(nodeContent, nodeName, customStory, nodeNames);
        }
      }
  });
  
  console.log(`Extracted ${Object.keys(customStory).length} total nodes`);
  return customStory;
};
