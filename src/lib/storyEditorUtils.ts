
import { CustomStory } from "@/lib/storyUtils";
import { 
  analyzeStoryStructure, 
  validateNodeMappings, 
  extractAllNodesFromInkJSON,
  type NodeMappings 
} from "@/lib/storyMapping";

// Generate node mappings and log information about the story structure
export const generateAndLogNodeMappings = (storyData: CustomStory): {
  nodeMappings: NodeMappings;
  totalPages: number;
} => {
  if (!storyData) {
    console.warn("No story data provided for node mapping");
    return {
      nodeMappings: {
        nodeToPage: {},
        pageToNode: {}
      },
      totalPages: 0
    };
  }
  
  try {
    console.log("Using dynamic node mapping system...");
    console.log("Story data contains", Object.keys(storyData).length, "total objects");
    console.log("Content nodes:", Object.keys(storyData).filter(key => 
      key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
    ).length);
    
    const { nodeToPage, pageToNode, totalPages } = analyzeStoryStructure(storyData);
    
    // Log some statistics about the mapping
    console.log(`Generated mapping for ${Object.keys(nodeToPage).length} nodes across ${totalPages} pages`);
    
    // Validate the generated mappings
    const isValid = validateNodeMappings(storyData, nodeToPage, pageToNode);
    
    if (isValid) {
      console.log("Dynamic node mapping succeeded!");
      console.log("Total story nodes:", totalPages);
      
      // Useful debugging information
      if (totalPages > 0) {
        const firstPage = pageToNode[1];
        const lastPage = pageToNode[totalPages];
        console.log(`First page maps to '${firstPage}', last page to '${lastPage}'`);
      }
      
      return {
        nodeMappings: {
          nodeToPage,
          pageToNode
        },
        totalPages
      };
    } else {
      console.warn("Dynamic node mapping produced invalid results, using fallback");
      
      // Fallback to simple sequential mapping with better logging
      const allNodes = Object.keys(storyData).filter(key => 
        key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
      );
      
      console.log(`Using fallback mapping for ${allNodes.length} nodes`);
      
      const nodeToPage: Record<string, number> = {};
      const pageToNode: Record<number, string> = {};
      
      // Create sequential mapping
      allNodes.forEach((nodeName, index) => {
        const pageNumber = index + 1;
        nodeToPage[nodeName] = pageNumber;
        pageToNode[pageNumber] = nodeName;
      });
      
      return {
        nodeMappings: {
          nodeToPage,
          pageToNode
        },
        totalPages: allNodes.length
      };
    }
  } catch (error) {
    console.error("Error in node mapping:", error);
    
    // Fallback for error cases with better error handling
    const allNodes = Object.keys(storyData).filter(key => 
      key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
    );
    
    console.warn(`Mapping error occurred. Falling back to sequential mapping for ${allNodes.length} nodes`);
    
    // Create simple sequential mapping
    const nodeToPage: Record<string, number> = {};
    const pageToNode: Record<number, string> = {};
    
    allNodes.forEach((nodeName, index) => {
      const pageNumber = index + 1;
      nodeToPage[nodeName] = pageNumber;
      pageToNode[pageNumber] = nodeName;
    });
    
    return {
      nodeMappings: {
        nodeToPage, 
        pageToNode
      },
      totalPages: allNodes.length
    };
  }
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
        const customStory = extractCustomStoryFromInkJSON(rawStoryJSON);
        console.log("Converted story to custom format:", customStory);
        return customStory;
      } else {
        console.error("Failed to fetch story from URL:", response.statusText);
      }
    } catch (fetchError) {
      console.error("Error fetching story from URL:", fetchError);
    }
  }
  
  return null;
};

// These functions are imported from external files
import { extractCustomStoryFromInkJSON } from "@/lib/storyMapping";

// Re-export the NodeMappings interface for use elsewhere
export type { NodeMappings };
