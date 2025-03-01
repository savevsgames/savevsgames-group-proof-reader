
import { CustomStory } from "@/lib/storyUtils";
import { 
  NodeMappings,
  generateComprehensiveNodeMapping,
  validateNodeMappings
} from "@/lib/storyNodeMapping";
import { extractAllNodesFromInkJSON } from "@/lib/story/nodeExtraction";
import { extractCustomStoryFromInkJSON } from "@/lib/story/conversion";

// Re-export NodeMappings interface for wider use
export type { NodeMappings } from "@/lib/storyNodeMapping";

// Generate node mappings and log information about the story structure - improved version
export const generateAndLogNodeMappings = (storyData: CustomStory): {
  nodeMappings: NodeMappings;
  totalPages: number;
} => {
  console.log("[Editor Utils] Beginning node mapping generation");
  
  if (!storyData) {
    console.warn("[Editor Utils] No story data provided for node mapping");
    return {
      nodeMappings: {
        nodeToPage: {},
        pageToNode: {}
      },
      totalPages: 0
    };
  }
  
  try {
    console.log("[Editor Utils] Analyzing story structure");
    console.log(`[Editor Utils] Story data contains ${Object.keys(storyData).length} total objects`);
    
    // Get content node count (excluding metadata)
    const contentNodes = Object.keys(storyData).filter(key => 
      key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
    );
    
    console.log(`[Editor Utils] Content nodes: ${contentNodes.length}`);
    
    // Use our improved comprehensive mapping generator
    const { nodeToPage, pageToNode, totalPages } = generateComprehensiveNodeMapping(storyData);
    
    // Log mapping statistics
    console.log(`[Editor Utils] Generated mapping for ${Object.keys(nodeToPage).length} nodes across ${totalPages} pages`);
    
    // Validate the mappings
    const isValid = validateNodeMappings(storyData, nodeToPage, pageToNode);
    
    if (isValid) {
      console.log("[Editor Utils] Node mapping validation successful");
      
      // Useful debugging information
      if (totalPages > 0) {
        const firstPage = pageToNode[1];
        const lastPage = pageToNode[totalPages];
        console.log(`[Editor Utils] First page maps to '${firstPage}', last page to '${lastPage}'`);
      }
      
      return {
        nodeMappings: {
          nodeToPage: nodeToPage,
          pageToNode: pageToNode
        },
        totalPages
      };
    } else {
      console.warn("[Editor Utils] Node mapping validation failed, using the mappings anyway");
      
      return {
        nodeMappings: {
          nodeToPage: nodeToPage,
          pageToNode: pageToNode
        },
        totalPages
      };
    }
  } catch (error) {
    console.error("[Editor Utils] Error in node mapping:", error);
    
    // Fallback for error cases with better error handling
    const allNodes = Object.keys(storyData).filter(key => 
      key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
    );
    
    console.warn(`[Editor Utils] Mapping error occurred. Falling back to sequential mapping for ${allNodes.length} nodes`);
    
    // Create simple sequential mapping
    const nodeToPage: Record<string, number> = {};
    const pageToNode: Record<number, string> = {};
    
    allNodes.forEach((nodeName, index) => {
      const pageNumber = index + 1;
      nodeToPage[nodeName] = pageNumber;
      pageToNode[pageNumber] = nodeName;
    });
    
    const totalPages = allNodes.length;
    
    return {
      nodeMappings: {
        nodeToPage, 
        pageToNode
      },
      totalPages
    };
  }
};

// Extract story content from various possible sources with improved logging
export const extractStoryContent = async (data: any): Promise<CustomStory | null> => {
  console.log("[Content Extraction] Starting story content extraction");
  console.log("[Content Extraction] Input data:", {
    hasStoryContent: !!data.story_content,
    hasStoryUrl: !!data.story_url,
    title: data.title
  });
  
  // Try to get story content from various possible sources
  let storyContent = null;
  
  // First, check if story_content exists (it might have been added in previous edits)
  if (data.story_content) {
    try {
      console.log("[Content Extraction] Found story_content field, attempting to parse");
      storyContent = JSON.parse(data.story_content);
      console.log("[Content Extraction] Successfully parsed story_content");
      
      // Log basic structure
      console.log("[Content Extraction] Story structure:", {
        nodeCount: Object.keys(storyContent).length,
        hasRoot: !!storyContent.root,
        inkVersion: storyContent.inkVersion
      });
      
      return storyContent;
    } catch (parseError) {
      console.error("[Content Extraction] Error parsing story_content:", parseError);
    }
  }
  
  // If no valid story_content, try to fetch from story_url
  if (data.story_url) {
    try {
      console.log("[Content Extraction] Attempting to fetch story from URL:", data.story_url);
      const response = await fetch(data.story_url);
      
      if (response.ok) {
        const rawStoryJSON = await response.json();
        console.log("[Content Extraction] Successfully loaded story from URL");
        
        // Log the basic structure of the fetched story
        console.log("[Content Extraction] Story structure:", {
          type: typeof rawStoryJSON,
          hasInkVersion: !!rawStoryJSON.inkVersion,
          hasRoot: !!rawStoryJSON.root
        });
        
        // Use our function to extract all nodes, including nested ones
        const allNodes = extractAllNodesFromInkJSON(rawStoryJSON);
        console.log(`[Content Extraction] Found ${allNodes.length} nodes in story`);
        
        // Convert to our custom story format
        console.log("[Content Extraction] Converting to custom story format");
        const customStory = extractCustomStoryFromInkJSON(rawStoryJSON);
        console.log(`[Content Extraction] Converted to custom format with ${Object.keys(customStory).length} nodes`);
        
        return customStory;
      } else {
        console.error("[Content Extraction] Failed to fetch story from URL:", response.statusText);
      }
    } catch (fetchError) {
      console.error("[Content Extraction] Error fetching story from URL:", fetchError);
    }
  }
  
  console.warn("[Content Extraction] Could not extract story content from any source");
  return null;
};
