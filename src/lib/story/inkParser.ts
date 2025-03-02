import { InkSymbols } from './constants';
import { InkNodeContent, InkChoice, ParsingContext, InkChoicePoint } from './types';

// Token parser interface - used for processing different Ink symbols
interface TokenParser {
  matches: (token: any) => boolean;
  process: (token: any, context: ParsingContext) => void;
}

// Enhanced collection of token parsers for different Ink syntax elements
export const tokenParsers: TokenParser[] = [
  // Text parser - handles basic story text prefixed with ^
  {
    matches: (token) => typeof token === 'string' && token.startsWith(InkSymbols.TEXT),
    process: (token, context) => {
      const text = token.substring(1).trim(); // Remove the ^ prefix
      if (text) {
        // If we're in a choice, add text to the choice
        if (context.inChoice && context.currentChoice) {
          context.currentChoice.text = text;
        } else {
          // Otherwise add to the node text, respecting the buffer
          if (context.textBuffer) {
            context.currentNode.text += (context.currentNode.text ? ' ' : '') + context.textBuffer;
            context.textBuffer = '';
          }
          context.currentNode.text += (context.currentNode.text ? ' ' : '') + text;
        }
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
  
  // Choice start parser - specifically handles * choice markers
  {
    matches: (token) => typeof token === 'string' && (
      token === InkSymbols.CHOICE_BASIC || 
      token === InkSymbols.CHOICE_STICKY ||
      token === InkSymbols.CHOICE_GATHER
    ),
    process: (token, context) => {
      // Start a new choice
      const choiceType = token === InkSymbols.CHOICE_BASIC ? 'basic' : 
                         token === InkSymbols.CHOICE_STICKY ? 'sticky' : 'gather';
      
      context.inChoice = true;
      context.choiceType = choiceType;
      context.currentChoice = { 
        text: '', 
        nextNode: '',
        type: choiceType
      };
      
      // If we're starting a new choice and have one being processed, add it first
      if (context.currentChoice && context.currentChoice.text) {
        context.currentNode.choices.push({...context.currentChoice});
      }
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
  
  // Improved choice content parser - better handles choice text extraction
  {
    matches: (token) => typeof token === 'object' && token !== null && token['*'] !== undefined,
    process: (token, context) => {
      const choiceContent = token['*'];
      if (Array.isArray(choiceContent)) {
        // This is a choice point with content
        context.inChoice = true;
        
        // Process each choice option
        for (let i = 0; i < choiceContent.length; i++) {
          const choiceOption = choiceContent[i];
          
          if (Array.isArray(choiceOption)) {
            // Create a new choice
            context.currentChoice = { 
              text: '', 
              nextNode: ''
            };
            
            // Process the choice option array
            for (let j = 0; j < choiceOption.length; j++) {
              const element = choiceOption[j];
              
              // Extract text (prefixed with ^)
              if (typeof element === 'string' && element.startsWith(InkSymbols.TEXT)) {
                context.currentChoice.text = element.substring(1);
              }
              
              // Extract target (divert object)
              if (typeof element === 'object' && element !== null && element[InkSymbols.NAVIGATION]) {
                context.currentChoice.nextNode = element[InkSymbols.NAVIGATION];
              }
            }
            
            // Add the processed choice if it has text
            if (context.currentChoice.text) {
              context.currentNode.choices.push({...context.currentChoice});
            }
          }
        }
        
        // Reset choice state
        context.inChoice = false;
        context.currentChoice = null;
      }
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
  },
  
  // NEW: Tag parser - handles metadata tags
  {
    matches: (token) => typeof token === 'object' && token !== null && token['#'] !== undefined,
    process: (token, context) => {
      // Store tags in the metadata
      if (!context.currentNode.metadata) {
        context.currentNode.metadata = {};
      }
      if (!context.currentNode.metadata.tags) {
        context.currentNode.metadata.tags = [];
      }
      context.currentNode.metadata.tags.push(token['#']);
    }
  },
  
  // NEW: Variable assignment parser
  {
    matches: (token) => typeof token === 'object' && token !== null && token['VAR='] !== undefined,
    process: (token, context) => {
      // Store variable assignments in metadata
      if (!context.currentNode.metadata) {
        context.currentNode.metadata = {};
      }
      if (!context.currentNode.metadata.variables) {
        context.currentNode.metadata.variables = {};
      }
      
      const varName = Object.keys(token['VAR='])[0];
      const varValue = token['VAR='][varName];
      
      context.currentNode.metadata.variables[varName] = varValue;
    }
  },
  
  // NEW: Glue parser - handles text flow control
  {
    matches: (token) => token === InkSymbols.GLUE,
    process: (token, context) => {
      // Mark that the next text should be glued without whitespace
      context.currentNode.metadata = context.currentNode.metadata || {};
      context.currentNode.metadata.hasGlue = true;
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
  
  // Initialize parsing context with improved tracking
  const context: ParsingContext = {
    currentNode: nodeContent,
    inChoice: false,
    currentChoice: null,
    choiceStack: [],
    textBuffer: ''
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
    
    // Handle Ink's complex object structure with direct text and choices
    if (typeof nodeData.text === 'string') {
      nodeContent.text = nodeData.text;
    }
    
    if (Array.isArray(nodeData.choices)) {
      nodeContent.choices = nodeData.choices.map(choice => ({
        text: typeof choice.text === 'string' ? choice.text : 'Continue',
        nextNode: choice.nextNode || ''
      }));
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

// Enhanced helper function to process array elements with parsers
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
    
    // Handle nested arrays (common in Ink format)
    if (!parsed && Array.isArray(element)) {
      processArrayElements(element, context);
    }
    
    // Special handling for choice objects - this is critical for parsing Ink choice structures
    if (!parsed && typeof element === 'object' && element !== null) {
      // Look for choice indicators in object keys
      const keys = Object.keys(element);
      
      // Check for special choice format where the key itself is a choice marker
      const choiceMarkers = ['*', '+', '-'];
      const choiceKeys = keys.filter(key => choiceMarkers.includes(key));
      
      if (choiceKeys.length > 0) {
        // This is a choice container
        choiceKeys.forEach(marker => {
          const choiceContent = element[marker];
          
          if (Array.isArray(choiceContent)) {
            // Process each choice in the array
            for (let i = 0; i < choiceContent.length; i++) {
              const choice = choiceContent[i];
              
              // Start a new choice
              context.inChoice = true;
              context.currentChoice = { 
                text: '', 
                nextNode: '',
                type: marker === '*' ? 'basic' : marker === '+' ? 'sticky' : 'gather'
              };
              
              // If choice is an array, process it
              if (Array.isArray(choice)) {
                let choiceText = '';
                let targetNode = '';
                
                // Extract choice text and target
                for (let j = 0; j < choice.length; j++) {
                  const item = choice[j];
                  
                  // Handle text items
                  if (typeof item === 'string' && item.startsWith(InkSymbols.TEXT)) {
                    choiceText = item.substring(1);
                  }
                  
                  // Handle diverts
                  if (typeof item === 'object' && item !== null && item[InkSymbols.NAVIGATION]) {
                    targetNode = item[InkSymbols.NAVIGATION];
                  }
                }
                
                // Create and add the choice
                if (choiceText) {
                  context.currentChoice.text = choiceText;
                  if (targetNode) {
                    context.currentChoice.nextNode = targetNode;
                  }
                  
                  // Add the choice to the node
                  context.currentNode.choices.push({...context.currentChoice});
                }
              }
            }
            
            // Reset choice state
            context.inChoice = false;
            context.currentChoice = null;
          }
        });
        
        parsed = true;
      }
      
      // Handle standard object keys for choice content
      if (!parsed) {
        for (const key of keys) {
          if (key !== 'InkSymbols.NAVIGATION' && key !== '#f') {
            // This might be a choice branch or divert
            
            // Direct text content with divert
            if (key.startsWith(InkSymbols.TEXT)) {
              const textContent = key.substring(1).trim();
              
              if (textContent) {
                // If element[key] is a divert or another structured object
                if (typeof element[key] === 'object' && element[key] !== null) {
                  // Check if it contains a divert
                  if (element[key][InkSymbols.NAVIGATION]) {
                    // This is both text and a divert - create a choice
                    context.currentNode.choices.push({
                      text: textContent,
                      nextNode: element[key][InkSymbols.NAVIGATION]
                    });
                  } else {
                    // Regular text with metadata
                    if (context.currentNode.text) context.currentNode.text += ' ';
                    context.currentNode.text += textContent;
                  }
                } else {
                  // Just text
                  if (context.currentNode.text) context.currentNode.text += ' ';
                  context.currentNode.text += textContent;
                }
              }
            }
            // Other structured content - could be a nested choice or divert
            else if (key !== InkSymbols.NAVIGATION && 
                    key !== '#' && 
                    key !== 'VAR=' && 
                    key !== 'temp=' &&
                    !choiceMarkers.includes(key)) {
              
              // Process as potential choice text
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
    }
  }
};
