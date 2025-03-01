
import { Story } from 'inkjs';
import { supabase } from './supabase';

// Define interfaces for the custom story format
export interface StoryChoice {
  text: string;
  nextNode: string;
}

export interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
}

export interface CustomStory {
  [key: string]: StoryNode;
}

// Map to track story sections for page counting
export const storyNodeToPageMap: Record<string, number> = {
  'root': 1,
  'vault_description': 2,
  'dark_eye_introduction': 3,
  'mages_attempt': 4,
  'kavan_arrival': 5,
  'kavan_determination': 6,
  'dark_eye_awakens': 7,
  'dark_eye_speaks': 8,
  'kavan_response': 9,
  'battle_begins': 10,
  'kavan_struggle': 11,
  'kavan_love': 12,
  'kavan_fight': 13,
  'dark_eye_reaction': 14,
  'dark_eye_withdraws': 15,
  'final_blast': 16,
  'story_ending': 17,
  'start': 1
};

// Reverse map to look up node names from page numbers
export const pageToStoryNodeMap: Record<number, string> = Object.entries(storyNodeToPageMap).reduce(
  (acc, [node, page]) => {
    if (!acc[page] || node !== 'start') {
      acc[page] = node;
    }
    return acc;
  },
  {} as Record<number, string>
);

// Dynamic mapping function that ensures all nodes in story have a page number
export const generateNodeMappings = (storyData: CustomStory) => {
  if (!storyData) return { storyNodeToPageMap, pageToStoryNodeMap };
  
  // Start with a fresh mapping
  const updatedNodeToPageMap: Record<string, number> = {};
  
  // Collect all valid story nodes from the story data
  // (excluding metadata nodes)
  const storyNodes = Object.keys(storyData).filter(key => 
    key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
  );
  
  // Create a sequence of nodes based on their relationships
  const nodeSequence: string[] = [];
  let currentNode = 'root';  // Always start with root
  
  // First, add root node if it exists
  if (storyNodes.includes('root') || storyNodes.includes('start')) {
    currentNode = storyNodes.includes('root') ? 'root' : 'start';
    nodeSequence.push(currentNode);
  }
  
  // Then follow the node chain by looking at each node's choices
  const MAX_NODES = storyNodes.length * 2; // Safety limit to prevent infinite loops
  let count = 0;
  
  while (currentNode && count < MAX_NODES) {
    count++;
    
    const node = storyData[currentNode];
    if (!node) break;
    
    // For node with choices
    if (node.choices && node.choices.length > 0) {
      const nextNode = node.choices[0].nextNode;
      if (nextNode && !nodeSequence.includes(nextNode) && storyData[nextNode]) {
        nodeSequence.push(nextNode);
        currentNode = nextNode;
        continue;
      }
    }
    
    // Try to find the next node by other means if choices didn't work
    // This will look for patterns in Ink JSON structure
    if (storyData[currentNode]) {
      // Function to extract next node name from Ink JSON structure
      const findNextNodeInInkFormat = (nodeName: string): string | null => {
        const node = storyData[nodeName];
        // Check multiple formats that could indicate the next node
        if (typeof node === 'object') {
          // Direct next property
          if (node['->']) return node['->'];
          
          // Array format with -> directive
          if (Array.isArray(node)) {
            for (const item of node) {
              if (item && typeof item === 'object' && item['->']) {
                return item['->'];
              }
            }
          }
        }
        return null;
      };
      
      const nextNode = findNextNodeInInkFormat(currentNode);
      if (nextNode && !nodeSequence.includes(nextNode) && storyData[nextNode]) {
        nodeSequence.push(nextNode);
        currentNode = nextNode;
        continue;
      } else {
        // If we can't find next node, move to next unused node in the list
        const unusedNode = storyNodes.find(n => !nodeSequence.includes(n));
        if (unusedNode) {
          nodeSequence.push(unusedNode);
          currentNode = unusedNode;
          continue;
        }
      }
    }
    
    // If we reach here, we can't find any more valid nodes
    break;
  }
  
  // Now create page numbers based on the sequence
  nodeSequence.forEach((nodeName, index) => {
    updatedNodeToPageMap[nodeName] = index + 1;
  });
  
  // Add any remaining nodes not in the sequence
  let nextPage = nodeSequence.length + 1;
  storyNodes.forEach(nodeName => {
    if (!updatedNodeToPageMap[nodeName]) {
      updatedNodeToPageMap[nodeName] = nextPage++;
    }
  });
  
  // Generate the reverse mapping
  const updatedPageToNodeMap: Record<number, string> = {};
  
  Object.entries(updatedNodeToPageMap).forEach(([nodeName, pageNum]) => {
    updatedPageToNodeMap[pageNum] = nodeName;
  });
  
  console.log("Generated mappings:", {
    nodeToPage: updatedNodeToPageMap,
    pageToNode: updatedPageToNodeMap,
    sequencedNodes: nodeSequence,
    totalNodes: storyNodes.length
  });
  
  return {
    storyNodeToPageMap: updatedNodeToPageMap,
    pageToStoryNodeMap: updatedPageToNodeMap
  };
};

// Fetch story content from URL
export const fetchStoryContent = async (storyUrl: string) => {
  const response = await fetch(storyUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch story content: ${response.statusText}`);
  }
  
  return await response.json();
};

// Helper function to extract a custom story format from ink JSON
export const extractCustomStoryFromInkJSON = (inkJSON: any): CustomStory => {
  try {
    const customStory: CustomStory = {};
    
    // Extract the root node text
    if (inkJSON.root && Array.isArray(inkJSON.root) && inkJSON.root.length > 0) {
      // Extract text from the root array
      let rootText = "";
      for (const item of inkJSON.root) {
        if (typeof item === 'string' && item.startsWith('^')) {
          rootText += item.substring(1) + " ";
        }
      }
      
      customStory.root = {
        text: rootText.trim() || "Story begins...",
        choices: [{
          text: "Continue",
          nextNode: "vault_description"
        }]
      };
      
      // Process all story nodes that aren't special properties
      for (const nodeName in inkJSON) {
        if (nodeName !== 'root' && nodeName !== 'inkVersion' && nodeName !== 'listDefs' && nodeName !== '#f') {
          extractNodesRecursively(inkJSON, customStory, nodeName);
        }
      }
    }
    
    return customStory;
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

// Helper to recursively extract nodes
export const extractNodesRecursively = (inkJSON: any, customStory: CustomStory, nodeName: string) => {
  if (!inkJSON[nodeName]) return;
  
  try {
    let nodeText = "";
    let nextNode = "";
    let isEnding = false;
    
    // Process the node content
    if (Array.isArray(inkJSON[nodeName])) {
      for (const item of inkJSON[nodeName]) {
        if (typeof item === 'string') {
          // Direct text content
          if (item.startsWith('^')) {
            nodeText += item.substring(1) + " ";
          } else if (item === 'end') {
            isEnding = true;
          }
        } else if (item && typeof item === 'object') {
          // Check for next node reference
          if (item['->']) {
            nextNode = item['->'];
          }
        }
      }
    }
    
    // Create node entry
    customStory[nodeName] = {
      text: nodeText.trim() || "Continue the story...",
      choices: nextNode ? [{
        text: "Continue",
        nextNode: nextNode
      }] : [],
      isEnding: isEnding
    };
    
    // If we found a next node, recursively process it if not already processed
    if (nextNode && !customStory[nextNode] && nextNode !== 'end') {
      extractNodesRecursively(inkJSON, customStory, nextNode);
    }
  } catch (e) {
    console.error(`Error extracting node ${nodeName}:`, e);
  }
};

// Fetch comment count for a position - updated to use page number
export const fetchCommentCount = async (storyId: string, position: number) => {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('story_id', storyId)
    .eq('story_position', position);
  
  if (error) {
    throw error;
  }
  
  return count || 0;
};

// Fetch comments for a specific story position
export const fetchComments = async (storyId: string, position: number) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(username)
      `)
      .eq('story_id', storyId)
      .eq('story_position', position)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Failed to fetch comments');
  }
};

// Fetch book details from database
export const fetchBookDetails = async (storyId: string) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', storyId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch book details: ${error.message}`);
  }

  if (!data) {
    throw new Error('Book not found');
  }

  return data;
};

// Convert JSON story format to Ink format
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
              if (nextNode && nextNode.choices.length === 0) {
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
    
    // Start with the root node
    processNode('root');
    
    // Process any remaining nodes that weren't reached through the root
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
