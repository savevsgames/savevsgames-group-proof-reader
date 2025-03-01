import { InkSymbols } from './constants';
import { InkNodeContent, InkChoice, ParsingContext } from './types';

// Token parser interface - used for processing different Ink symbols
interface TokenParser {
  matches: (token: any) => boolean;
  process: (token: any, context: ParsingContext) => void;
}

// Collection of token parsers for different Ink syntax elements
export const tokenParsers: TokenParser[] = [
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
export const processArrayElements = (elements: any[], context: ParsingContext) => {
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
