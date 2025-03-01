
/**
 * Utility functions for story node mapping
 */

/**
 * Handles array-style node IDs by normalizing them to a consistent format
 * @param nodeId The node ID that might contain array notation
 * @returns Normalized node ID
 */
export const normalizeNodeId = (nodeId: string): string => {
  // Remove array indices from node IDs (e.g., root[0][1] -> root)
  // This helps with mapping complex nested structures
  return nodeId.replace(/\[\d+\]/g, '');
};

/**
 * Helper to get a nested property from an object using a path string
 */
export function getNestedProperty(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    // Handle array indexing
    if (part.includes('[') && part.includes(']')) {
      const [name, indexStr] = part.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      
      current = current[name]?.[index];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

// Import necessary type
import { CustomStory } from "../storyUtils";

/**
 * Extract text content from an Ink node with improved handling
 */
export function extractTextFromInkNode(node: any): string {
  if (!node) return '';
  
  // If the node is an array, look for text entries
  if (Array.isArray(node)) {
    return node
      .filter(item => typeof item === 'string' && !item.startsWith('^->') && !item.startsWith('ev'))
      .map(item => typeof item === 'string' ? item.replace(/^\^/, '') : '')
      .join(' ')
      .trim();
  }
  
  // If the node has a '_' property that's an array, process that
  if (node['_'] && Array.isArray(node['_'])) {
    return extractTextFromInkNode(node['_']);
  }
  
  return '';
}

/**
 * Extract choices from an Ink node with improved detection
 */
export function extractChoicesFromInkNode(node: any, allNodes: string[]): { text: string, nextNode: string }[] {
  const choices: { text: string, nextNode: string }[] = [];
  
  // Helper to find pointers to other nodes
  const findPointers = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        // Look for strings with format '^->' which are pointers to other nodes
        if (typeof item === 'string' && item.startsWith('^->')) {
          const targetNode = item.replace('^->', '').trim();
          if (allNodes.includes(targetNode)) {
            // Find the preceding text (choice text)
            const choiceIndex = obj.indexOf(item) - 2;
            if (choiceIndex >= 0 && typeof obj[choiceIndex] === 'string') {
              let choiceText = obj[choiceIndex].replace(/^str\^/, '').replace(/\/str$/, '');
              choices.push({ text: choiceText, nextNode: targetNode });
            } else {
              // If we can't find choice text, use a default
              choices.push({ text: 'Continue', nextNode: targetNode });
            }
          }
        } else if (typeof item === 'object' && item && item['->']) {
          // Direct navigation object
          const targetNode = item['->'];
          if (allNodes.includes(targetNode) || targetNode === 'root') {
            choices.push({ text: 'Continue', nextNode: targetNode });
          }
        } else {
          findPointers(item);
        }
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (key === '->') {
          // Direct navigation property
          const targetNode = value as string;
          if (allNodes.includes(targetNode) || targetNode === 'root') {
            choices.push({ text: 'Continue', nextNode: targetNode });
          }
        } else {
          findPointers(value);
        }
      });
    }
  };
  
  findPointers(node);
  
  return choices;
}
