
import { CustomStory, NodeMappings } from '@/types';
import { supabase } from '@/lib/supabase';
import { analyzeStoryStructure, getDebugNodes } from './storyNodeMapping';

// Extract story content from database record with improved format detection
export const extractStoryContent = async (data: any): Promise<CustomStory | null> => {
  try {
    console.log("[Story Extraction] Starting story content extraction", {
      hasStoryContent: !!data.story_content,
      hasStoryUrl: !!data.story_url,
      title: data.title
    });
    
    if (data.story_content) {
      // Direct content in database
      console.log("[Story Extraction] Using direct story content from database");
      
      // Validate the story structure before returning
      if (typeof data.story_content !== 'object') {
        console.warn("[Story Extraction] Story content is not a valid object");
        return null;
      }
      
      // Log story format information to help diagnose issues
      const format = detectStoryFormat(data.story_content);
      console.log("[Story Extraction] Story format detection:", format);
      
      return data.story_content;
    } else if (data.story_url) {
      // External content via URL
      console.log("[Story Extraction] Fetching story from URL:", data.story_url);
      
      try {
        const response = await fetch(data.story_url);
        if (!response.ok) {
          console.error("[Story Extraction] Failed to fetch story:", response.statusText);
          return null;
        }
        
        const storyData = await response.json();
        
        // Validate and log the fetched story format
        if (typeof storyData !== 'object') {
          console.warn("[Story Extraction] Fetched story is not a valid object");
          return null;
        }
        
        // Log story format information
        const format = detectStoryFormat(storyData);
        console.log("[Story Extraction] Fetched story format detection:", format);
        
        // For Ink.js format, log additional structure information
        if (format.isInkFormat) {
          console.log("[Story Extraction] Ink.js format details:", {
            rootArrayLength: Array.isArray(storyData.root) ? storyData.root.length : 'not an array',
            inkVersion: storyData.inkVersion,
            // Sample the first few elements of the root array for debugging
            rootSample: Array.isArray(storyData.root) 
              ? storyData.root.slice(0, 3).map(item => JSON.stringify(item).substring(0, 100)) 
              : 'N/A'
          });
        }
        
        return storyData;
      } catch (error) {
        console.error("[Story Extraction] Error fetching from URL:", error);
        return null;
      }
    }
    
    // No content available
    console.warn("[Story Extraction] No story content or URL available");
    return null;
  } catch (error) {
    console.error("[Story Extraction] Error extracting story content:", error);
    return null;
  }
};

// Helper function to detect and log the story format
function detectStoryFormat(storyData: any): {
  formatType: string;
  nodeCount: number;
  hasRoot: boolean;
  hasStart: boolean;
  isInkFormat: boolean;
} {
  if (!storyData) {
    return {
      formatType: "Invalid",
      nodeCount: 0,
      hasRoot: false,
      hasStart: false,
      isInkFormat: false
    };
  }
  
  // Count content nodes
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  const contentNodes = Object.keys(storyData).filter(key => {
    if (skipKeys.includes(key)) return false;
    
    const node = storyData[key];
    return (
      node && 
      typeof node === 'object' && 
      !Array.isArray(node) && 
      (typeof node.text === 'string' || Array.isArray(node.choices))
    );
  });
  
  // Check for Ink.js format
  const isInkFormat = storyData.inkVersion && Array.isArray(storyData.root);
  
  // Check for our custom format
  const hasStartNode = storyData.start && typeof storyData.start === 'object' && storyData.start.text;
  const hasRootNode = storyData.root && typeof storyData.root === 'object' && storyData.root.text;
  
  // Determine format type
  let formatType;
  if (isInkFormat) {
    formatType = "Ink.js";
  } else if (hasStartNode || hasRootNode) {
    formatType = "Custom";
  } else if (contentNodes.length > 0) {
    formatType = "Unknown (with content nodes)";
  } else {
    formatType = "Unknown";
  }
  
  return {
    formatType,
    nodeCount: contentNodes.length,
    hasRoot: !!storyData.root,
    hasStart: !!storyData.start,
    isInkFormat
  };
}

// Generate node-to-page mappings with improved story flow tracking
export const generateAndLogNodeMappings = (storyData: CustomStory): {
  nodeMappings: NodeMappings;
  totalPages: number;
} => {
  console.log("[Story Editor] Generating node mappings");
  
  if (!storyData) {
    console.warn("[Story Editor] No story data provided for mapping");
    return {
      nodeMappings: { nodeToPage: {}, pageToNode: {} },
      totalPages: 0
    };
  }
  
  try {
    // Log story structure information before mapping
    const format = detectStoryFormat(storyData);
    console.log("[Story Editor] Story format for mapping:", format);
    
    // If this is an Ink.js format story, log additional details about the root array
    if (format.isInkFormat && Array.isArray(storyData.root)) {
      console.log("[Story Editor] Ink.js root array details:", {
        length: storyData.root.length,
        // Log first 3 elements of root array to help visualize the structure
        sample: storyData.root.slice(0, 3).map(item => {
          if (Array.isArray(item)) {
            return `Array(${item.length}): [${item.slice(0, 2).map(e => JSON.stringify(e).substring(0, 30) + '...').join(', ')}]`;
          }
          return JSON.stringify(item).substring(0, 30) + '...';
        })
      });
    }
    
    // Use the comprehensive analysis from storyNodeMapping
    const { nodeToPage, pageToNode, totalPages } = analyzeStoryStructure(storyData);
    
    console.log(`[Story Editor] Generated mappings with ${Object.keys(nodeToPage).length} nodes and ${totalPages} pages`);
    
    const mappings: NodeMappings = {
      nodeToPage,
      pageToNode
    };
    
    // Debug output - show some of the mappings
    if (Object.keys(nodeToPage).length > 0) {
      // Show up to 10 node mappings
      const nodesToShow = Math.min(10, Object.keys(nodeToPage).length);
      const mappingSample = Object.keys(nodeToPage).slice(0, nodesToShow);
      
      console.log(`[Story Editor] Sample of ${nodesToShow} node mappings:`, 
        mappingSample.map(node => `${node} -> Page ${nodeToPage[node]}`));
    }
    
    // Log some page to node mappings as well
    if (totalPages > 0) {
      const pagesToShow = Math.min(10, totalPages);
      const pageMappings = Array.from({ length: pagesToShow }, (_, i) => i + 1)
        .map(page => `Page ${page} -> ${pageToNode[page] || 'undefined'}`);
      
      console.log(`[Story Editor] Sample of ${pagesToShow} page mappings:`, pageMappings);
      
      // Specifically log the first 3 pages in detail
      if (totalPages >= 3) {
        console.log("[Story Editor] First 3 pages detail:");
        for (let i = 1; i <= 3; i++) {
          const nodeKey = pageToNode[i];
          if (nodeKey && storyData[nodeKey]) {
            const node = storyData[nodeKey];
            console.log(`Page ${i} (${nodeKey}):`, {
              textPreview: typeof node.text === 'string' ? 
                (node.text.substring(0, 50) + (node.text.length > 50 ? '...' : '')) : 'No text',
              hasChoices: Array.isArray(node.choices) && node.choices.length > 0,
              choiceCount: Array.isArray(node.choices) ? node.choices.length : 0,
              isEnding: !!node.isEnding
            });
          } else {
            console.log(`Page ${i}: No node mapped or invalid node reference`);
          }
        }
      }
    }
    
    // Log the debug nodes created during mapping
    const debugNodes = getDebugNodes();
    if (debugNodes.length > 0) {
      console.log(`[Story Editor] Created ${debugNodes.length} debug nodes during mapping`);
      // Show the first 3 debug nodes in detail
      console.log("[Story Editor] First 3 debug nodes:", debugNodes.slice(0, 3));
    }
    
    return {
      nodeMappings: mappings,
      totalPages
    };
  } catch (error) {
    console.error("[Story Editor] Error generating node mappings:", error);
    return {
      nodeMappings: { nodeToPage: {}, pageToNode: {} },
      totalPages: 0
    };
  }
};

// Save story to database with proper page count
export const saveStoryToDatabase = async (
  storyId: string,
  storyData: CustomStory,
  title: string
): Promise<boolean> => {
  console.log("[Story Editor] Saving story to database:", { 
    storyId, 
    title, 
    dataSize: JSON.stringify(storyData).length
  });
  
  try {
    // Log story format information before saving
    const format = detectStoryFormat(storyData);
    console.log("[Story Editor] Story format being saved:", format);
    
    const { error } = await supabase
      .from("books")
      .update({
        story_content: storyData,
        title,
        updated_at: new Date().toISOString()
      })
      .eq("id", storyId);
    
    if (error) {
      console.error("[Story Editor] Error saving story:", error);
      return false;
    }
    
    console.log("[Story Editor] Story saved successfully");
    return true;
  } catch (error) {
    console.error("[Story Editor] Error saving story:", error);
    return false;
  }
};
