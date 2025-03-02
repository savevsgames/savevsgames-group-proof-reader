
import { Story } from 'inkjs';
import { CustomStory } from './types';
import { parseFullInkStory } from './nodeExtraction';

// Enhanced helper function to extract a custom story format from ink JSON
export const extractCustomStoryFromInkJSON = (inkJSON: any): CustomStory => {
  try {
    console.log("[Conversion] Starting extraction from Ink JSON");
    
    // Validate the input
    if (!inkJSON) {
      console.error("[Conversion] Invalid Ink JSON provided");
      return {
        root: {
          text: "Failed to parse story: Invalid input.",
          choices: []
        }
      };
    }
    
    // Check if this looks like Ink format
    const isInkFormat = inkJSON && (
      inkJSON.inkVersion || 
      (Array.isArray(inkJSON.root) && inkJSON.root.length > 0)
    );
    
    console.log(`[Conversion] Source appears to be ${isInkFormat ? 'Ink format' : 'custom format'}`);
    
    // Use our enhanced parser with better format detection
    return parseFullInkStory(inkJSON);
  } catch (e) {
    console.error("Error extracting custom story from Ink JSON:", e);
    return {
      root: {
        text: "Failed to parse story format.",
        choices: []
      }
    };
  }
};

// Enhanced function to convert JSON story format to Ink format
export const convertJSONToInk = (storyData: CustomStory): string => {
  try {
    if (!storyData) {
      return '// No story data available';
    }

    let inkContent = '// Generated Ink script from JSON story format\n\n';
    
    // Track processed nodes to avoid duplicates
    const processedNodes = new Set<string>();
    
    // Process the story starting from the root node
    const processNode = (nodeKey: string, depth: number = 0): void => {
      if (processedNodes.has(nodeKey)) return;
      
      // Skip metadata nodes
      if (nodeKey === 'inkVersion' || nodeKey === 'listDefs') return;
      
      const node = storyData[nodeKey];
      if (!node) {
        inkContent += `// Warning: Node "${nodeKey}" referenced but not found in story data\n\n`;
        return;
      }
      
      // Mark this node as processed
      processedNodes.add(nodeKey);
      
      // Add a knot declaration for non-root nodes
      if (nodeKey !== 'root') {
        inkContent += `=== ${nodeKey} ===\n`;
      }
      
      // Add the node text
      inkContent += `${node.text}\n\n`;
      
      // Add choices if any
      if (node.choices && node.choices.length > 0) {
        node.choices.forEach(choice => {
          // Add asterisks based on depth for proper nesting
          const indentation = '    '.repeat(depth);
          const asterisks = '*'.repeat(Math.min(depth + 1, 3)); // Max 3 asterisks in Ink
          
          inkContent += `${indentation}${asterisks} ${choice.text}\n`;
          
          if (choice.nextNode) {
            if (processedNodes.has(choice.nextNode)) {
              // If we've already processed this node, just divert to it
              inkContent += `${indentation}    -> ${choice.nextNode}\n`;
            } else {
              // Process inline for simple continuation
              const nextNode = storyData[choice.nextNode];
              if (nextNode && nextNode.choices?.length === 0) {
                inkContent += `${indentation}    ${nextNode.text}\n`;
                processedNodes.add(choice.nextNode);
                inkContent += `${indentation}    -> END\n`;
              } else {
                // Otherwise divert to the node and process it separately
                inkContent += `${indentation}    -> ${choice.nextNode}\n`;
              }
            }
          } else if (node.isEnding) {
            inkContent += `${indentation}    -> END\n`;
          }
        });
        inkContent += '\n';
      } else if (node.isEnding) {
        // Handle ending node
        inkContent += '-> END\n\n';
      } else {
        // No choices but not an ending - could be a non-interactive passage
        inkContent += '// No choices defined for this node\n\n';
      }
    };
    
    // First, detect if we have a root or start node
    const startNodeName = storyData.start ? 'start' : 'root';
    
    // Start with the identified start node
    if (storyData[startNodeName]) {
      processNode(startNodeName);
    } else {
      // If no clear start node, try to find a viable starting point
      const validNodes = Object.keys(storyData).filter(key => 
        key !== 'inkVersion' && 
        key !== 'listDefs' && 
        typeof storyData[key] === 'object' && 
        !Array.isArray(storyData[key]) &&
        (storyData[key].text !== undefined || storyData[key].choices !== undefined)
      );
      
      if (validNodes.length > 0) {
        // Use the first valid node as the start
        processNode(validNodes[0]);
      } else {
        inkContent += "// Warning: No valid story nodes found\n\n";
      }
    }
    
    // Process any remaining nodes that weren't reached through the start node
    Object.keys(storyData).forEach(nodeKey => {
      // Skip metadata nodes
      if (nodeKey === 'inkVersion' || nodeKey === 'listDefs') return;
      
      if (!processedNodes.has(nodeKey)) {
        processNode(nodeKey);
      }
    });
    
    return inkContent;
  } catch (e) {
    console.error('Error in convertJSONToInk:', e);
    return `// Error converting JSON to Ink format: ${e instanceof Error ? e.message : String(e)}\n// Please check your story structure.`;
  }
};

// Parse Ink content to preview using inkjs
export const parseInkContent = (inkContent: string): { story: Story | null; error: string | null } => {
  try {
    // Create a new Story instance
    const story = new Story(inkContent);
    return { story, error: null };
  } catch (e) {
    console.error('Error parsing Ink content:', e);
    return { 
      story: null, 
      error: `Failed to parse Ink content: ${e instanceof Error ? e.message : String(e)}` 
    };
  }
};
