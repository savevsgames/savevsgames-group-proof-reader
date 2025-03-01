
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

// Definition of Ink symbols for parsing
export const InkSymbols = {
  TEXT: '^',
  NAVIGATION: '->',
  EVAL_START: 'ev',
  EVAL_END: '/ev',
  STRING_START: 'str',
  STRING_END: '/str',
  END: 'end',
  DONE: 'done',
  NEW_LINE: '\n'
};

// Interface for parsed Ink node content
export interface InkNodeContent {
  text: string;
  choices: InkChoice[];
  nextNode?: string;
  isEnding?: boolean;
  metadata?: Record<string, any>;
}

export interface InkChoice {
  text: string;
  nextNode: string;
}

// Token parser interface - used for processing different Ink symbols
interface TokenParser {
  matches: (token: any) => boolean;
  process: (token: any, context: ParsingContext) => void;
}

// Context object to track state during parsing
interface ParsingContext {
  currentNode: InkNodeContent;
  inChoice: boolean;
  currentChoice: InkChoice | null;
  choiceStack: any[];
}

// Map to track story node sequence for page counting - fixed order
// This is our source of truth for page ordering
export const storyNodeSequence: string[] = [
  'root',
  'vault_description',
  'dark_eye_introduction',
  'mages_attempt',
  'kavan_arrival',
  'kavan_determination',
  'dark_eye_awakens',
  'dark_eye_speaks',
  'kavan_response',
  'battle_begins',
  'kavan_struggle',
  'kavan_love',
  'kavan_fight',
  'dark_eye_reaction',
  'dark_eye_withdraws',
  'final_blast',
  'story_ending'
];

// Generate node-to-page and page-to-node mappings based on the sequence
export const storyNodeToPageMap: Record<string, number> = 
  storyNodeSequence.reduce((acc, node, index) => {
    acc[node] = index + 1; // Page numbers start from 1
    return acc;
  }, {} as Record<string, number>);

// Reverse map to look up node names from page numbers
export const pageToStoryNodeMap: Record<number, string> = 
  storyNodeSequence.reduce((acc, node, index) => {
    acc[index + 1] = node; // Page numbers start from 1
    return acc;
  }, {} as Record<number, string>);

// Collection of token parsers for different Ink syntax elements
const tokenParsers: TokenParser[] = [
  // Text parser - handles basic story text prefixed with ^
  {
    matches: (token) => typeof token === 'string' && token.startsWith(InkSymbols.TEXT),
    process: (token, context) => {
      const text = token.substring(1).trim(); // Remove the ^ prefix
      if (text) {
        context.currentNode.text += (context.currentNode.text ? ' ' : '') + text;
      }
    }
  },
  
  // Navigation parser - handles -> directives
  {
    matches: (token) => typeof token === 'object' && token !== null && token[InkSymbols.NAVIGATION] !== undefined,
    process: (token, context) => {
      const nextNode = token[InkSymbols.NAVIGATION];
      if (context.inChoice && context.currentChoice) {
        // If we're in a choice, set the choice's nextNode
        context.currentChoice.nextNode = nextNode;
      } else {
        // Otherwise set the node's nextNode
        context.currentNode.nextNode = nextNode;
      }
    }
  },
  
  // New line parser - handles line breaks
  {
    matches: (token) => token === InkSymbols.NEW_LINE,
    process: (token, context) => {
      // New lines in text are significant, add them to maintain formatting
      if (context.currentNode.text) {
        context.currentNode.text += '\n';
      }
    }
  },
  
  // End parser - marks end of story paths
  {
    matches: (token) => token === InkSymbols.END,
    process: (token, context) => {
      context.currentNode.isEnding = true;
    }
  },
  
  // Choice parser for complex choice structures
  {
    matches: (token) => typeof token === 'object' && Array.isArray(token) && token.length >= 2 
      && typeof token[0] === 'string' && token[0] === InkSymbols.EVAL_START,
    process: (token, context) => {
      // Start of a potential choice sequence
      context.inChoice = true;
      context.choiceStack.push(token);
    }
  },
  
  // String parser for choice text
  {
    matches: (token) => typeof token === 'object' && typeof token['s'] === 'object' 
      && Array.isArray(token['s']) && typeof token['s'][0] === 'string',
    process: (token, context) => {
      // Extract choice text from the s array
      const choiceText = token['s'][0];
      if (choiceText.startsWith(InkSymbols.TEXT)) {
        // If this is a text node inside a choice
        if (context.inChoice && context.currentChoice) {
          context.currentChoice.text = choiceText.substring(1).trim();
        }
      }
    }
  }
];

// Main parsing function to extract node content from Ink JSON
export const parseInkNode = (storyData: any, nodeName: string): InkNodeContent => {
  // Default structure for node content
  const nodeContent: InkNodeContent = {
    text: '',
    choices: [],
    nextNode: undefined,
    isEnding: false,
    metadata: {}
  };
  
  // Return empty content if node doesn't exist
  if (!storyData || !storyData[nodeName]) {
    return nodeContent;
  }
  
  // Initialize parsing context
  const context: ParsingContext = {
    currentNode: nodeContent,
    inChoice: false,
    currentChoice: null,
    choiceStack: []
  };
  
  const nodeData = storyData[nodeName];
  
  // If node is an array, process each element
  if (Array.isArray(nodeData)) {
    processArrayElements(nodeData, context);
  } 
  // If node is an object with specific properties
  else if (typeof nodeData === 'object') {
    // Some Ink formats use different object structures
    if (Array.isArray(nodeData.content)) {
      processArrayElements(nodeData.content, context);
    }
  }
  
  // If we have a direct link to next node but no choices yet,
  // create a "Continue" choice for better UX
  if (nodeContent.nextNode && nodeContent.choices.length === 0) {
    nodeContent.choices.push({
      text: 'Continue',
      nextNode: nodeContent.nextNode
    });
  }
  
  return nodeContent;
};

// Helper function to process array elements with parsers
const processArrayElements = (elements: any[], context: ParsingContext) => {
  for (const element of elements) {
    // Try each parser in sequence
    let parsed = false;
    
    for (const parser of tokenParsers) {
      if (parser.matches(element)) {
        parser.process(element, context);
        parsed = true;
        break;
      }
    }
    
    // If element is an array, recursively process it
    if (!parsed && Array.isArray(element)) {
      processArrayElements(element, context);
    }
    
    // If element has a special structure for choices
    if (!parsed && typeof element === 'object' && element !== null) {
      // Look for choice indicators
      const keys = Object.keys(element);
      for (const key of keys) {
        if (key !== 'InkSymbols.NAVIGATION' && key !== '#f') {
          // This might be a choice branch
          context.currentChoice = { text: key, nextNode: '' };
          
          // Process the choice content
          if (typeof element[key] === 'object' && element[key] !== null) {
            if (Array.isArray(element[key])) {
              // Set context to process this choice
              context.inChoice = true;
              processArrayElements(element[key], context);
              context.inChoice = false;
            }
          }
          
          // Add the choice if it has both text and nextNode
          if (context.currentChoice.text && context.currentChoice.nextNode) {
            context.currentNode.choices.push({ ...context.currentChoice });
          }
        }
      }
    }
  }
};

// Function to generate mappings based on story data
export const generateNodeMappings = (storyData: any) => {
  if (!storyData) {
    // Return default mappings if no data
    return { 
      storyNodeToPageMap, 
      pageToStoryNodeMap,
      totalPages: storyNodeSequence.length 
    };
  }
  
  // Create empty mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // First, try to find all the nodes in our sequence
  let totalPages = 0;
  let pageNumber = 1;
  
  // Process nodes in our defined sequence first
  for (const nodeName of storyNodeSequence) {
    if (storyData[nodeName]) {
      nodeToPage[nodeName] = pageNumber;
      pageToNode[pageNumber] = nodeName;
      pageNumber++;
      totalPages++;
    }
  }
  
  // Now add any additional nodes that might not be in our sequence
  const allNodes = Object.keys(storyData).filter(key => 
    key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
  );
  
  for (const nodeName of allNodes) {
    if (!nodeToPage[nodeName]) {
      nodeToPage[nodeName] = pageNumber;
      pageToNode[pageNumber] = nodeName;
      pageNumber++;
      totalPages++;
    }
  }
  
  console.log("Generated mappings:", { nodeToPage, pageToNode, totalPages });
  
  return {
    storyNodeToPageMap: nodeToPage,
    pageToStoryNodeMap: pageToNode,
    totalPages
  };
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
