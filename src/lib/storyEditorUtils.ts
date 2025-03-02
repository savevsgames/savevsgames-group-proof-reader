
import { CustomStory, NodeMappings } from '@/types';
import { supabase } from '@/lib/supabase';
import { analyzeStoryStructure } from './storyNodeMapping';

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
        .map(page => `Page ${page} -> ${pageToNode[page]}`);
      
      console.log(`[Story Editor] Sample of ${pagesToShow} page mappings:`, pageMappings);
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
  title: string,
  totalPages: number
): Promise<boolean> => {
  console.log("[Story Editor] Saving story to database:", { 
    storyId, 
    title, 
    totalPages,
    dataSize: JSON.stringify(storyData).length
  });
  
  try {
    // Log story format information before saving
    const format = detectStoryFormat(storyData);
    console.log("[Story Editor] Story format being saved:", format);
    
    // Make sure we have a reasonable page count to save
    const pagesToSave = totalPages > 0 ? totalPages : countStoryNodes(storyData);
    console.log(`[Story Editor] Using page count for save: ${pagesToSave}`);
    
    const { error } = await supabase
      .from("books")
      .update({
        story_content: storyData,
        title,
        total_pages: pagesToSave,
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

// Helper function to count story nodes
function countStoryNodes(storyData: any): number {
  if (!storyData) return 0;
  
  // Skip metadata keys
  const skipKeys = ['inkVersion', 'listDefs', '#f'];
  
  // Count all keys that represent actual story nodes
  const nodeCount = Object.keys(storyData).filter(key => {
    if (skipKeys.includes(key)) return false;
    
    const node = storyData[key];
    return (
      node && 
      typeof node === 'object' && 
      !Array.isArray(node) && 
      (typeof node.text === 'string' || Array.isArray(node.choices))
    );
  }).length;
  
  // Fallback to a minimum count of 1
  return Math.max(nodeCount, 1);
}
