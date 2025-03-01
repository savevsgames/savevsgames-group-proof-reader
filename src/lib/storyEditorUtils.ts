import { CustomStory, generateNodeMappings } from "@/lib/storyUtils";
import { analyzeStoryStructure, validateNodeMappings } from "@/lib/storyNodeMapping";

export interface NodeMappings {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
}

// Generate node mappings and log information about the story structure
export const generateAndLogNodeMappings = (storyData: CustomStory): {
  nodeMappings: NodeMappings;
  totalPages: number;
} => {
  // Try the new dynamic mapping system first
  try {
    console.log("Using dynamic node mapping system...");
    const { nodeToPage, pageToNode, totalPages } = analyzeStoryStructure(storyData);
    
    // Validate the generated mappings
    const isValid = validateNodeMappings(storyData, nodeToPage, pageToNode);
    
    if (isValid) {
      console.log("Dynamic node mapping succeeded!");
      console.log("Total story nodes:", totalPages);
      console.log("Node to page mapping:", nodeToPage);
      console.log("Page to node mapping:", pageToNode);
      
      return {
        nodeMappings: {
          nodeToPage,
          pageToNode
        },
        totalPages
      };
    } else {
      console.warn("Dynamic node mapping produced invalid results, falling back to legacy mapping");
    }
  } catch (error) {
    console.error("Error in dynamic node mapping:", error);
    console.warn("Falling back to legacy node mapping system");
  }
  
  // Fallback to the original mapping system
  const { 
    storyNodeToPageMap: updatedNodeToPage, 
    pageToStoryNodeMap: updatedPageToNode, 
    totalPages: calculatedPages 
  } = generateNodeMappings(storyData);
  
  const nodeMappings = {
    nodeToPage: updatedNodeToPage,
    pageToNode: updatedPageToNode
  };
  
  // Log all nodes found in the story data
  const allNodes = Object.keys(storyData).filter(key => 
    key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
  );
  
  console.log("Using legacy node mapping system");
  console.log("Story nodes found:", allNodes);
  console.log("Total story nodes:", allNodes.length);
  console.log("Node to page mapping:", updatedNodeToPage);
  console.log("Page to node mapping:", updatedPageToNode);
  console.log(`Total story pages: ${calculatedPages}`);
  
  return {
    nodeMappings,
    totalPages: calculatedPages
  };
};

// Extract story content from various possible sources
export const extractStoryContent = async (data: any): Promise<CustomStory | null> => {
  // Try to get story content from various possible sources
  let storyContent = null;
  
  // First, check if story_content exists (it might have been added in previous edits)
  if (data.story_content) {
    try {
      storyContent = JSON.parse(data.story_content);
      console.log("Found story_content, using that");
      return storyContent;
    } catch (parseError) {
      console.error("Error parsing story_content:", parseError);
    }
  }
  
  // If no valid story_content, try to fetch from story_url
  if (data.story_url) {
    try {
      console.log("Attempting to fetch story from URL:", data.story_url);
      const response = await fetch(data.story_url);
      if (response.ok) {
        const rawStoryJSON = await response.json();
        console.log("Successfully loaded story from URL");
        
        // Log the complete structure of the fetched story
        console.log("Story structure:", rawStoryJSON);
        
        // Use our function to extract all nodes, including nested ones
        const allNodes = extractAllNodesFromInkJSON(rawStoryJSON);
        console.log("All story nodes:", allNodes);
        console.log("Total nodes found:", allNodes.length);
        
        // Convert to our custom story format
        return extractCustomStoryFromInkJSON(rawStoryJSON);
      } else {
        console.error("Failed to fetch story from URL:", response.statusText);
      }
    } catch (fetchError) {
      console.error("Error fetching story from URL:", fetchError);
    }
  }
  
  return null;
};

// These functions are imported from storyUtils but included here for completion
// In a real implementation, you would import these from storyUtils
import { extractAllNodesFromInkJSON, extractCustomStoryFromInkJSON } from "@/lib/storyUtils";
