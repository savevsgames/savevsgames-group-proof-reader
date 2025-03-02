
import { CustomStory, NodeMappings } from '@/types';
import { supabase } from '@/lib/supabase';
import { analyzeStoryStructure } from './storyNodeMapping';

// Extract story content from database record
export const extractStoryContent = async (data: any): Promise<CustomStory | null> => {
  try {
    if (data.story_content) {
      // Direct content in database
      console.log("[Story Editor] Using direct story content from database");
      return data.story_content;
    } else if (data.story_url) {
      // External content via URL
      console.log("[Story Editor] Fetching story from URL:", data.story_url);
      const response = await fetch(data.story_url);
      if (!response.ok) {
        console.error("[Story Editor] Failed to fetch story:", response.statusText);
        return null;
      }
      return await response.json();
    }
    
    // No content available
    console.warn("[Story Editor] No story content or URL available");
    return null;
  } catch (error) {
    console.error("[Story Editor] Error extracting story content:", error);
    return null;
  }
};

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
    // Use the comprehensive analysis from storyNodeMapping
    const { nodeToPage, pageToNode, totalPages } = analyzeStoryStructure(storyData);
    
    console.log(`[Story Editor] Generated mappings with ${Object.keys(nodeToPage).length} nodes and ${totalPages} pages`);
    
    const mappings: NodeMappings = {
      nodeToPage,
      pageToNode
    };
    
    // Debug output
    if (Object.keys(nodeToPage).length > 0) {
      const firstFiveNodes = Object.keys(nodeToPage).slice(0, 5);
      console.log("[Story Editor] First 5 node mappings:", 
        firstFiveNodes.map(node => `${node} -> Page ${nodeToPage[node]}`));
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
  console.log("[Story Editor] Saving story to database:", { storyId, title, totalPages });
  
  try {
    const { error } = await supabase
      .from("books")
      .update({
        story_content: storyData,
        title,
        total_pages: totalPages,
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
