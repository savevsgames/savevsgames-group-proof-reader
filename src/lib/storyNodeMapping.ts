
import { CustomStory, NodeMappings, StoryNode } from '@/types';

// Debug tracking array for node creation
const debugNodes: Array<{
  id: string,
  type: string,
  content: string | null,
  hasChoices: boolean,
  nextNodes: string[]
}> = [];

/**
 * Logs a newly created node for debugging, with a limit to prevent console overflow
 */
function logNodeCreation(nodeInfo: {
  id: string,
  type: string,
  content: string | null,
  hasChoices: boolean,
  nextNodes: string[]
}) {
  if (debugNodes.length >= 100) return;
  
  debugNodes.push(nodeInfo);
  console.log(`[NodeMapper] Created node #${debugNodes.length}:`, {
    id: nodeInfo.id,
    type: nodeInfo.type,
    contentPreview: nodeInfo.content ? nodeInfo.content.substring(0, 50) + (nodeInfo.content.length > 50 ? '...' : '') : null,
    hasChoices: nodeInfo.hasChoices,
    nextNodes: nodeInfo.nextNodes
  });
}

/**
 * Clears the debug nodes array
 */
function clearDebugNodes() {
  debugNodes.length = 0;
  console.log("[NodeMapper] Debug node tracking reset");
}

/**
 * Gets the current debug nodes (limited to first 100)
 */
export function getDebugNodes() {
  return [...debugNodes];
}

/**
 * Analyzes a story structure and generates node-to-page mappings
 * by following actual story flow through choices.
 */
export const analyzeStoryStructure = (storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  console.log("[StoryMapper] Starting story structure analysis");
  
  // Reset debug tracking
  clearDebugNodes();
  
  // Initialize mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Validate input
  if (!storyData) {
    console.warn("[StoryMapper] No story data provided");
    return { nodeToPage, pageToNode, totalPages: 0 };
  }
  
  // Check for Ink.js format
  const isInkFormat = storyData.inkVersion && Array.isArray(storyData.root);
  
  if (isInkFormat) {
    console.log("[StoryMapper] Detected Ink.js format, using specialized approach");
    return analyzeInkStoryStructure(storyData);
  }
  
  // ... keep existing code (handling non-Ink formats)
};

/**
 * Specialized analyzer for Ink.js format stories that processes the root array structure
 */
function analyzeInkStoryStructure(storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} {
  console.log("[InkMapper] Starting specialized Ink.js structure analysis with detailed page extraction");
  
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Get the root array which contains the story
  const rootArray = storyData.root;
  
  if (!Array.isArray(rootArray)) {
    console.warn("[InkMapper] Root is not an array - invalid Ink.js format");
    return { nodeToPage, pageToNode, totalPages: 0 };
  }
  
  console.log("[InkMapper] Root array structure:", {
    length: rootArray.length,
    firstElement: rootArray[0] ? JSON.stringify(rootArray[0]).substring(0, 100) : 'null',
    secondElement: rootArray[1] ? JSON.stringify(rootArray[1]).substring(0, 100) : 'null',
    thirdElement: rootArray[2] ? JSON.stringify(rootArray[2]).substring(0, 100) : 'null'
  });

  // Log more details about the third element which often contains the actual story
  if (rootArray[2]) {
    const thirdEl = rootArray[2];
    if (typeof thirdEl === 'object' && thirdEl !== null) {
      console.log("[InkMapper] Third element keys:", Object.keys(thirdEl));
      
      // Examine the structure specifically for the "start" key which often contains story content
      if (thirdEl.start && Array.isArray(thirdEl.start)) {
        console.log("[InkMapper] Found 'start' node in third element with length:", thirdEl.start.length);
        console.log("[InkMapper] Start node preview:", 
          JSON.stringify(thirdEl.start.slice(0, 2)).substring(0, 150));
        
        // Detailed inspection of first few items to understand structure
        if (thirdEl.start.length > 0) {
          for (let i = 0; i < Math.min(3, thirdEl.start.length); i++) {
            const item = thirdEl.start[i];
            console.log(`[InkMapper] Start node item ${i}:`, {
              type: typeof item,
              isArray: Array.isArray(item),
              preview: typeof item === 'string' ? item : JSON.stringify(item).substring(0, 100),
              hasMarkers: typeof item === 'string' && (
                item.includes('^') || 
                item.includes('ev') || 
                item.includes('str')
              )
            });
          }
        }
      }
    }
  }
  
  // Create initial node structures with flow tracking
  const storySegments = extractStorySegmentsFromInk(rootArray, storyData);
  console.log(`[InkMapper] Extracted ${storySegments.length} story segments from Ink root`);
  
  // Debug: show first 5 segments in detail
  const sampleSegments = storySegments.slice(0, 5);
  console.log("[InkMapper] Sample segments (first 5):", 
    sampleSegments.map((segment, idx) => ({
      id: segment.id,
      textPreview: segment.text.substring(0, 50) + (segment.text.length > 50 ? '...' : ''),
      choiceText: segment.choiceText,
      nextSegment: segment.nextSegment,
      segmentType: segment.text.includes("IMAGE:") ? "image" : 
                   segment.text.includes("?") ? "question" : "narrative",
      position: idx
    }))
  );

  // Convert segments to nodes and track them in custom story format
  const customStory: CustomStory = {};
  storySegments.forEach((segment, index) => {
    // Use fragment IDs for node keys
    const nodeKey = `fragment_${index}`;
    
    // Create the story node
    customStory[nodeKey] = {
      text: segment.text,
      choices: segment.nextSegment !== null ? [{
        text: segment.choiceText || "Continue",
        nextNode: `fragment_${segment.nextSegment}`
      }] : [],
      isEnding: segment.nextSegment === null
    };
    
    // Log node creation for debugging
    logNodeCreation({
      id: nodeKey,
      type: segment.text.includes("IMAGE:") ? "image_segment" : "ink_segment",
      content: segment.text,
      hasChoices: segment.nextSegment !== null,
      nextNodes: segment.nextSegment !== null ? [`fragment_${segment.nextSegment}`] : []
    });

    // Create the page mapping
    const page = index + 1;
    nodeToPage[nodeKey] = page;
    pageToNode[page] = nodeKey;
    
    console.log(`[InkMapper] Mapped segment ${index} to page ${page} with node key ${nodeKey}`, {
      textPreview: segment.text.substring(0, 50) + (segment.text.length > 50 ? '...' : ''),
      segmentType: segment.text.includes("IMAGE:") ? "image" : "narrative",
      choiceText: segment.choiceText,
      hasNextPage: segment.nextSegment !== null,
      nextPage: segment.nextSegment !== null ? segment.nextSegment + 1 : null
    });
  });
  
  // Also inject the extracted story into the main object for use by the rest of the system
  Object.keys(customStory).forEach(key => {
    storyData[key] = customStory[key];
  });
  
  // Set the start node to the first fragment
  if (Object.keys(customStory).length > 0) {
    storyData['start'] = customStory['fragment_0'];
    console.log("[InkMapper] Set fragment_0 as the start node");
  }
  
  const totalPages = storySegments.length;
  console.log(`[InkMapper] Completed mapping with ${totalPages} total pages`);
  
  return {
    nodeToPage,
    pageToNode,
    totalPages: totalPages > 0 ? totalPages : 1 // Ensure at least 1 page
  };
}

/**
 * Extracts story segments from Ink.js root array and story objects
 * Properly handles both Ink array format and structured story content,
 * with special handling for images and choices
 */
function extractStorySegmentsFromInk(rootArray: any[], storyData: CustomStory): Array<{
  id: number,
  text: string,
  choiceText: string | null,
  nextSegment: number | null
}> {
  console.log("[InkMapper] Extracting story segments from Ink root array with improved parsing");
  
  const segments: Array<{
    id: number,
    text: string,
    choiceText: string | null,
    nextSegment: number | null
  }> = [];
  
  // Track extraction processing
  const extractionLog: Array<{
    source: string,
    type: string,
    content: string,
    hasChoice: boolean,
    choiceText: string | null
  }> = [];
  
  // Helper function to log extraction events (limited to first 20)
  const logExtraction = (info: {
    source: string,
    type: string,
    content: string,
    hasChoice: boolean,
    choiceText: string | null
  }) => {
    if (extractionLog.length < 20) {
      extractionLog.push(info);
      console.log(`[InkMapper] Extracted ${info.type}:`, {
        source: info.source,
        contentPreview: info.content.substring(0, 50) + (info.content.length > 50 ? '...' : ''),
        hasChoice: info.hasChoice,
        choiceText: info.choiceText
      });
    }
  };
  
  // Helper function to safely extract text content from string with detailed logging
  const extractTextContent = (str: string, source: string): { text: string, isImage: boolean } | null => {
    if (typeof str !== 'string') return null;
    
    // Text content in Ink.js format starts with ^ character
    if (str.startsWith('^')) {
      const text = str.substring(1).trim();
      const isImage = text.startsWith('IMAGE:');
      
      // Log the extraction with details
      console.log(`[InkMapper] Extracted text from ${source}:`, {
        type: isImage ? 'image' : 'narrative',
        textLength: text.length,
        textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        markers: str.match(/[\^\\n\s]+/g)?.join('') || 'none'
      });
      
      return { 
        text: text, 
        isImage: isImage 
      };
    }
    return null;
  };
  
  // Helper to extract choice text
  const extractChoiceText = (elements: any[], startIndex: number): string | null => {
    // Look for the choice pattern: "ev", "str", "^ChoiceText", "/str", "/ev"
    for (let i = startIndex; i < elements.length - 2; i++) {
      if (elements[i] === 'ev' && 
          elements[i+1] === 'str' && 
          typeof elements[i+2] === 'string' && 
          elements[i+2].startsWith('^')) {
        
        const choiceText = elements[i+2].substring(1).trim();
        console.log(`[InkMapper] Found choice text at position ${i}:`, choiceText);
        return choiceText;
      }
    }
    return null;
  };
  
  // Process story content that's stored in nested structures
  const processNestedContent = (container: any, sourcePath: string) => {
    // If this is an object with keys, look for story branches
    if (container && typeof container === 'object' && !Array.isArray(container)) {
      // For each key in the object that might contain story content
      Object.keys(container).forEach(key => {
        // Skip special metadata keys
        if (['inkVersion', 'listDefs', '#f'].includes(key)) return;
        
        const nestedContent = container[key];
        
        if (Array.isArray(nestedContent)) {
          console.log(`[InkMapper] Processing nested array at ${sourcePath}.${key} with ${nestedContent.length} items`);
          
          // Process each segment of the nested array
          let currentText = '';
          let choiceText: string | null = null;
          
          for (let i = 0; i < nestedContent.length; i++) {
            const item = nestedContent[i];
            
            // Handle text items
            if (typeof item === 'string') {
              // Check for text content
              const extractedContent = extractTextContent(item, `${sourcePath}.${key}[${i}]`);
              if (extractedContent) {
                // If this is an image, it should be its own segment
                if (extractedContent.isImage && currentText) {
                  // Save previous segment first
                  segments.push({
                    id: segments.length,
                    text: currentText,
                    choiceText: null, // Will be set when connecting segments
                    nextSegment: null // Will be set later
                  });
                  
                  logExtraction({
                    source: `${sourcePath}.${key}[${i}]`,
                    type: 'text_segment',
                    content: currentText,
                    hasChoice: false,
                    choiceText: null
                  });
                  
                  currentText = '';
                }
                
                // Add to current text with proper spacing
                if (currentText && !extractedContent.isImage) currentText += ' ';
                currentText += extractedContent.text;
                
                // Log the extraction
                logExtraction({
                  source: `${sourcePath}.${key}[${i}]`,
                  type: extractedContent.isImage ? 'image' : 'text',
                  content: extractedContent.text,
                  hasChoice: false,
                  choiceText: null
                });
                
                // If this is an image or ends with terminal punctuation, consider it a natural break
                if (extractedContent.isImage || 
                    extractedContent.text.endsWith('.') || 
                    extractedContent.text.endsWith('!') || 
                    extractedContent.text.endsWith('?')) {
                  
                  segments.push({
                    id: segments.length,
                    text: currentText,
                    choiceText: null, // Will be set when connecting segments
                    nextSegment: null // Will be set later
                  });
                  
                  logExtraction({
                    source: `${sourcePath}.${key}[${i}]`,
                    type: 'complete_segment',
                    content: currentText,
                    hasChoice: false,
                    choiceText: null
                  });
                  
                  currentText = '';
                }
              }
              // Look for choice markers
              else if (item === 'ev') {
                // This might be the start of a choice
                choiceText = extractChoiceText(nestedContent, i);
                if (choiceText) {
                  logExtraction({
                    source: `${sourcePath}.${key}[${i}]`,
                    type: 'choice',
                    content: choiceText,
                    hasChoice: true,
                    choiceText: choiceText
                  });
                }
              }
            }
            // Handle nested arrays recursively
            else if (Array.isArray(item)) {
              console.log(`[InkMapper] Found nested array at ${sourcePath}.${key}[${i}] with ${item.length} items`);
              
              // Process the nested array items
              for (let j = 0; j < item.length; j++) {
                const subItem = item[j];
                
                if (typeof subItem === 'string') {
                  const extractedContent = extractTextContent(subItem, `${sourcePath}.${key}[${i}][${j}]`);
                  
                  if (extractedContent) {
                    // If this is an image and we already have text, create a segment first
                    if (extractedContent.isImage && currentText) {
                      segments.push({
                        id: segments.length,
                        text: currentText,
                        choiceText: null,
                        nextSegment: null
                      });
                      
                      logExtraction({
                        source: `${sourcePath}.${key}[${i}][${j}]`,
                        type: 'text_segment_before_image',
                        content: currentText,
                        hasChoice: false,
                        choiceText: null
                      });
                      
                      currentText = '';
                    }
                    
                    // Add to current text with spacing
                    if (currentText && !extractedContent.isImage) currentText += ' ';
                    currentText += extractedContent.text;
                    
                    // Log extraction
                    logExtraction({
                      source: `${sourcePath}.${key}[${i}][${j}]`,
                      type: extractedContent.isImage ? 'nested_image' : 'nested_text',
                      content: extractedContent.text,
                      hasChoice: false,
                      choiceText: null
                    });
                    
                    // Create separate segments for images and natural breaks
                    if (extractedContent.isImage || 
                        extractedContent.text.endsWith('.') || 
                        extractedContent.text.endsWith('!') || 
                        extractedContent.text.endsWith('?')) {
                      
                      segments.push({
                        id: segments.length,
                        text: currentText,
                        choiceText: null,
                        nextSegment: null
                      });
                      
                      logExtraction({
                        source: `${sourcePath}.${key}[${i}][${j}]`,
                        type: 'complete_nested_segment',
                        content: currentText,
                        hasChoice: false,
                        choiceText: null
                      });
                      
                      currentText = '';
                    }
                  }
                  // Check for choice markers in nested array
                  else if (subItem === 'ev') {
                    choiceText = extractChoiceText(item, j);
                    if (choiceText) {
                      logExtraction({
                        source: `${sourcePath}.${key}[${i}][${j}]`,
                        type: 'nested_choice',
                        content: choiceText,
                        hasChoice: true,
                        choiceText: choiceText
                      });
                    }
                  }
                }
              }
            }
            // Handle flow control object (nextNode indicator)
            else if (typeof item === 'object' && item !== null && item['^->']) {
              const targetNode = item['^->'];
              console.log(`[InkMapper] Found flow control at ${sourcePath}.${key}[${i}] to:`, targetNode);
              
              // If we have accumulated text, create a segment
              if (currentText) {
                segments.push({
                  id: segments.length,
                  text: currentText,
                  choiceText: choiceText,
                  nextSegment: null // Will be linked later
                });
                
                logExtraction({
                  source: `${sourcePath}.${key}[${i}]`,
                  type: 'flow_segment',
                  content: currentText,
                  hasChoice: choiceText !== null,
                  choiceText: choiceText
                });
                
                currentText = '';
                choiceText = null;
              }
            }
          }
          
          // Add any remaining text as a final segment
          if (currentText) {
            segments.push({
              id: segments.length,
              text: currentText,
              choiceText: choiceText,
              nextSegment: null
            });
            
            logExtraction({
              source: `${sourcePath}.${key}`,
              type: 'final_segment',
              content: currentText,
              hasChoice: choiceText !== null,
              choiceText: choiceText
            });
          }
        }
        // Recursively process nested objects
        else if (typeof nestedContent === 'object' && nestedContent !== null) {
          processNestedContent(nestedContent, `${sourcePath}.${key}`);
        }
      });
    }
  };
  
  // STEP 1: Process the main root array in sequence and extract story segments
  // This parses the first level of the story structure
  console.log("[InkMapper] Processing root array structure with improved sequence tracking");
  
  for (let i = 0; i < rootArray.length; i++) {
    const element = rootArray[i];
    
    // Handle nested story content in the root array
    if (Array.isArray(element)) {
      console.log(`[InkMapper] Processing root array element ${i} (array with ${element.length} items)`);
      
      let currentSegment = {
        text: '',
        choiceText: null as string | null
      };
      
      // Analyze the array contents
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        
        // Extract text content (narrative or image)
        if (typeof item === 'string') {
          const extractedContent = extractTextContent(item, `root[${i}][${j}]`);
          
          if (extractedContent) {
            // Handle image markers - always create a separate segment
            if (extractedContent.isImage && currentSegment.text) {
              // Save the current segment before starting the image
              segments.push({
                id: segments.length,
                text: currentSegment.text,
                choiceText: null,
                nextSegment: null // Will be set later
              });
              
              logExtraction({
                source: `root[${i}][${j}]`,
                type: 'text_segment_before_image',
                content: currentSegment.text,
                hasChoice: false,
                choiceText: null
              });
              
              // Reset for the new segment
              currentSegment.text = '';
            }
            
            // Add the extracted content to the current segment
            if (currentSegment.text && !extractedContent.isImage) currentSegment.text += ' ';
            currentSegment.text += extractedContent.text;
            
            // Log the extraction
            logExtraction({
              source: `root[${i}][${j}]`,
              type: extractedContent.isImage ? 'image' : 'text',
              content: extractedContent.text,
              hasChoice: false,
              choiceText: null
            });
            
            // Create a segment if this is an image or ends a sentence
            const isEndOfSentence = extractedContent.text.endsWith('.') || 
                                   extractedContent.text.endsWith('!') || 
                                   extractedContent.text.endsWith('?');
                                   
            if (extractedContent.isImage || isEndOfSentence) {
              segments.push({
                id: segments.length,
                text: currentSegment.text,
                choiceText: null, // Will be set with the next choice
                nextSegment: null // Will be set later
              });
              
              logExtraction({
                source: `root[${i}][${j}]`,
                type: extractedContent.isImage ? 'image_segment' : 'complete_sentence',
                content: currentSegment.text, 
                hasChoice: false,
                choiceText: null
              });
              
              // Reset for the next segment
              currentSegment.text = '';
            }
          }
          // Look for choice markers
          else if (item === 'ev') {
            currentSegment.choiceText = extractChoiceText(element, j);
            
            if (currentSegment.choiceText) {
              logExtraction({
                source: `root[${i}][${j}]`,
                type: 'choice',
                content: currentSegment.choiceText,
                hasChoice: true,
                choiceText: currentSegment.choiceText
              });
            }
          }
        }
        // Handle flow control object (nextNode indicator)
        else if (typeof item === 'object' && item !== null && item['^->']) {
          const targetNode = item['^->'];
          console.log(`[InkMapper] Found flow control in root[${i}][${j}] to:`, targetNode);
          
          // If we have text, create a segment
          if (currentSegment.text) {
            segments.push({
              id: segments.length,
              text: currentSegment.text,
              choiceText: currentSegment.choiceText,
              nextSegment: null // Will connect in next step
            });
            
            logExtraction({
              source: `root[${i}][${j}]`,
              type: 'flow_segment',
              content: currentSegment.text,
              hasChoice: currentSegment.choiceText !== null,
              choiceText: currentSegment.choiceText
            });
            
            // Reset for the next segment
            currentSegment = {
              text: '',
              choiceText: null
            };
          }
        }
      }
      
      // Add any remaining text as a final segment for this array
      if (currentSegment.text) {
        segments.push({
          id: segments.length,
          text: currentSegment.text,
          choiceText: currentSegment.choiceText,
          nextSegment: null
        });
        
        logExtraction({
          source: `root[${i}]`,
          type: 'final_array_segment',
          content: currentSegment.text,
          hasChoice: currentSegment.choiceText !== null,
          choiceText: currentSegment.choiceText
        });
      }
    }
    
    // STEP 2: Handle object elements which contain story nodes and branches
    else if (element && typeof element === 'object') {
      console.log(`[InkMapper] Processing root object element ${i} with keys:`, Object.keys(element));
      processNestedContent(element, `root[${i}]`);
    }
  }
  
  // STEP 3: Process the story content in storyData.start if it exists (common in Ink stories)
  if (storyData && storyData.start) {
    console.log("[InkMapper] Processing storyData.start node");
    
    if (Array.isArray(storyData.start)) {
      console.log(`[InkMapper] Processing storyData.start array with ${storyData.start.length} items`);
      
      let startSegmentText = '';
      let startChoiceText = null;
      
      for (const item of storyData.start) {
        if (typeof item === 'string') {
          const extractedContent = extractTextContent(item, 'storyData.start');
          
          if (extractedContent) {
            if (startSegmentText) startSegmentText += ' ';
            startSegmentText += extractedContent.text;
            
            logExtraction({
              source: 'storyData.start',
              type: extractedContent.isImage ? 'start_image' : 'start_text',
              content: extractedContent.text,
              hasChoice: false,
              choiceText: null
            });
          }
          else if (item === 'ev') {
            startChoiceText = extractChoiceText(storyData.start, storyData.start.indexOf(item));
            
            if (startChoiceText) {
              logExtraction({
                source: 'storyData.start',
                type: 'start_choice',
                content: startChoiceText,
                hasChoice: true,
                choiceText: startChoiceText
              });
            }
          }
        }
      }
      
      if (startSegmentText) {
        segments.push({
          id: segments.length,
          text: startSegmentText,
          choiceText: startChoiceText,
          nextSegment: null
        });
        
        logExtraction({
          source: 'storyData.start',
          type: 'start_segment',
          content: startSegmentText,
          hasChoice: startChoiceText !== null,
          choiceText: startChoiceText
        });
      }
    }
    else if (typeof storyData.start === 'object' && storyData.start !== null && typeof storyData.start.text === 'string') {
      // Handle simple object format
      segments.push({
        id: segments.length,
        text: storyData.start.text,
        choiceText: null,
        nextSegment: null
      });
      
      logExtraction({
        source: 'storyData.start.text',
        type: 'start_text_object',
        content: storyData.start.text,
        hasChoice: false,
        choiceText: null
      });
    }
  }
  
  // Ensure we have at least one segment
  if (segments.length === 0) {
    console.warn("[InkMapper] No segments found, creating default segment");
    segments.push({
      id: 0,
      text: "Story content could not be parsed correctly.",
      choiceText: null,
      nextSegment: null
    });
  }
  
  // STEP 4: Link segments in sequence for proper navigation
  console.log("[InkMapper] Linking segments in sequence for proper story flow");
  
  for (let i = 0; i < segments.length - 1; i++) {
    segments[i].nextSegment = i + 1;
    
    // If this segment has a choice text and the next segment doesn't, 
    // transfer the choice text to maintain proper display
    if (segments[i].choiceText === null && i + 1 < segments.length) {
      segments[i].choiceText = "Continue";
    }
  }
  
  // Last segment has no next
  if (segments.length > 0) {
    segments[segments.length - 1].nextSegment = null;
  }
  
  // Log final segment structure
  console.log(`[InkMapper] Final segment structure with ${segments.length} segments`);
  console.log("[InkMapper] Segment connectivity sample:", segments.slice(0, 3).map(s => ({
    id: s.id,
    textPreview: s.text.substring(0, 30) + "...",
    choiceText: s.choiceText,
    nextSegment: s.nextSegment
  })));
  
  return segments;
}

/**
 * Helper function to find unmapped but valid story nodes
 */
function findUnmappedNodes(
  storyData: CustomStory, 
  skipKeys: string[], 
  visitedNodes?: Set<string>
): string[] {
  const result: string[] = [];
  
  Object.keys(storyData).forEach(key => {
    // Skip metadata keys and already visited nodes
    if (skipKeys.includes(key) || (visitedNodes && visitedNodes.has(key))) {
      return;
    }
    
    const node = storyData[key];
    if (isValidStoryNode(node)) {
      result.push(key);
    }
  });
  
  return result;
}

/**
 * Validate that a node has the correct structure to be a story node
 */
function isValidStoryNode(node: any): node is StoryNode {
  return (
    node && 
    typeof node === 'object' && 
    !Array.isArray(node) && 
    (typeof node.text === 'string' || Array.isArray(node.choices))
  );
}

/**
 * Determine the starting node for a story
 */
export function determineStartNode(storyData: CustomStory): string {
  // No data case
  if (!storyData) return 'root';
  
  // Check for explicit start node
  if (storyData.start && typeof storyData.start === 'object' && 
      (typeof storyData.start.text === 'string' || storyData.start.text === '')) {
    return 'start';
  }
  
  // Check for root node
  if (storyData.root && typeof storyData.root === 'object' && 
      (typeof storyData.root.text === 'string' || storyData.root.text === '')) {
    return 'root';
  }
  
  // Ink.js special format case
  if (storyData.inkVersion && Array.isArray(storyData.root)) {
    // For Ink.js, we'll use a special fragment naming convention
    return 'fragment_0';
  }
  
  // Look for fragment_0 specifically (our created node for Ink.js stories)
  if (storyData['fragment_0'] && typeof storyData['fragment_0'] === 'object' &&
      typeof storyData['fragment_0'].text === 'string') {
    return 'fragment_0';
  }
  
  // Last resort: find first valid content node
  for (const key of Object.keys(storyData)) {
    // Skip metadata keys
    if (['inkVersion', 'listDefs', '#f'].includes(key)) continue;
    
    const node = storyData[key];
    if (node && typeof node === 'object' && !Array.isArray(node) &&
        (typeof node.text === 'string' || Array.isArray(node.choices))) {
      return key;
    }
  }
  
  // Nothing found - fallback to 'root'
  return 'root';
}

/**
 * Verify node mappings for completeness and consistency
 */
export const validateNodeMappings = (
  storyData: CustomStory, 
  nodeMappings: NodeMappings
): boolean => {
  if (!storyData || !nodeMappings) return false;
  
  const { nodeToPage, pageToNode } = nodeMappings;
  
  // Check if we have mappings at all
  if (Object.keys(nodeToPage).length === 0 || Object.keys(pageToNode).length === 0) {
    console.warn("[StoryMapper] Empty mappings detected");
    return false;
  }
  
  // Check for start node mapping
  const startNode = determineStartNode(storyData);
  if (!nodeToPage[startNode]) {
    console.warn(`[StoryMapper] Start node "${startNode}" not mapped`);
    return false;
  }
  
  // Check bidirectional consistency
  for (const [node, page] of Object.entries(nodeToPage)) {
    // Node to page to node should get back the same node
    const mappedBack = pageToNode[page];
    if (mappedBack !== node) {
      console.warn(`[StoryMapper] Inconsistent mapping for node "${node}" and page ${page}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Generate comprehensive node mappings with improved flow tracking
 */
export const generateComprehensiveNodeMapping = (storyData: CustomStory): {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
  totalPages: number;
} => {
  // Use the advanced story structure analysis
  const result = analyzeStoryStructure(storyData);
  
  // Validate the mappings
  const isValid = validateNodeMappings(storyData, {
    nodeToPage: result.nodeToPage,
    pageToNode: result.pageToNode
  });
  
  if (!isValid) {
    console.warn("[StoryMapper] Generated invalid mappings, attempting fallback method");
    
    // Simple fallback for invalid mappings
    const nodeToPage: Record<string, number> = {};
    const pageToNode: Record<number, string> = {};
    
    // Use basic enumeration
    const validNodes = Object.keys(storyData).filter(key => {
      if (['inkVersion', 'listDefs', '#f'].includes(key)) return false;
      
      const node = storyData[key];
      return (
        node && 
        typeof node === 'object' && 
        !Array.isArray(node) && 
        (typeof node.text === 'string' || Array.isArray(node.choices))
      );
    });
    
    validNodes.forEach((node, index) => {
      const page = index + 1;
      nodeToPage[node] = page;
      pageToNode[page] = node;
    });
    
    console.log(`[StoryMapper] Fallback mapping generated ${validNodes.length} pages`);
    
    return {
      nodeToPage,
      pageToNode,
      totalPages: validNodes.length
    };
  }
  
  return result;
};

// Make sure to explicitly export the NodeMappings interface
export type { NodeMappings };
