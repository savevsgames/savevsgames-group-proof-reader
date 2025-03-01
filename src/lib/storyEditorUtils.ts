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
  console.log("[Editor Utils] Beginning node mapping generation with data:", {
    dataType: typeof storyData,
    isNull: storyData === null,
    isUndefined: storyData === undefined,
    keysCount: storyData ? Object.keys(storyData).length : 0,
    firstFewKeys: storyData ? Object.keys(storyData).slice(0, 3) : []
  });
  
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
    
    // Log sample of story data for debugging
    const sampleKeys = Object.keys(storyData).slice(0, 3);
    for (const key of sampleKeys) {
      console.log(`[Editor Utils] Sample node '${key}':`, {
        hasText: !!storyData[key]?.text,
        textLength: storyData[key]?.text?.length || 0,
        choicesCount: storyData[key]?.choices?.length || 0,
        isEnding: !!storyData[key]?.isEnding
      });
    }
    
    // Get content node count (excluding metadata)
    const contentNodes = Object.keys(storyData).filter(key => 
      key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
    );
    
    console.log(`[Editor Utils] Content nodes: ${contentNodes.length}, First few:`, contentNodes.slice(0, 5));
    
    // IMPORTANT: If we have content nodes but generateComprehensiveNodeMapping fails,
    // fallback to a simple sequential mapping to ensure we have pages
    const fallbackMapping = () => {
      console.log(`[Editor Utils] Using fallback mapping for ${contentNodes.length} content nodes`);
      
      const nodeToPage: Record<string, number> = {};
      const pageToNode: Record<number, string> = {};
      
      contentNodes.forEach((nodeName, index) => {
        const pageNumber = index + 1;
        nodeToPage[nodeName] = pageNumber;
        pageToNode[pageNumber] = nodeName;
      });
      
      return {
        nodeToPage,
        pageToNode,
        totalPages: contentNodes.length || 1 // Ensure at least 1 page
      };
    };
    
    // Use our improved comprehensive mapping generator
    console.log("[Editor Utils] Calling generateComprehensiveNodeMapping");
    const { nodeToPage, pageToNode, totalPages } = generateComprehensiveNodeMapping(storyData);
    
    // Log mapping statistics
    console.log(`[Editor Utils] Generated mapping for ${Object.keys(nodeToPage).length} nodes across ${totalPages} pages`);
    
    // Verify we have valid mappings, if not fall back
    if (totalPages === 0 && contentNodes.length > 0) {
      console.warn("[Editor Utils] Mapping generated zero pages despite having content nodes. Using fallback.");
      return {
        nodeMappings: {
          nodeToPage: { [contentNodes[0]]: 1 },
          pageToNode: { 1: contentNodes[0] }
        },
        totalPages: 1
      };
    }
    
    // Final verification and safeguard
    if (totalPages === 0) {
      console.warn("[Editor Utils] No pages found in story. Ensuring at least 1 page.");
      // If we have any node, map it to page 1
      if (Object.keys(storyData).length > 0) {
        const firstNode = Object.keys(storyData)[0];
        return {
          nodeMappings: {
            nodeToPage: { [firstNode]: 1 },
            pageToNode: { 1: firstNode }
          },
          totalPages: 1
        };
      }
    }
    
    return {
      nodeMappings: {
        nodeToPage,
        pageToNode
      },
      totalPages: totalPages || 1 // Final safeguard: ensure at least 1 page
    };
    
  } catch (error) {
    console.error("[Editor Utils] Error in node mapping:", error);
    
    // Create emergency fallback with at least one page
    const emergencyNode = Object.keys(storyData)[0] || 'root';
    console.warn(`[Editor Utils] Critical mapping error. Using emergency fallback with node: ${emergencyNode}`);
    
    return {
      nodeMappings: {
        nodeToPage: { [emergencyNode]: 1 },
        pageToNode: { 1: emergencyNode }
      },
      totalPages: 1
    };
  }
};

// Extract story content from various possible sources with improved logging
export const extractStoryContent = async (data: any): Promise<CustomStory | null> => {
  console.log("[Content Extraction] Starting story content extraction");
  console.log("[Content Extraction] Input data:", {
    hasStoryContent: !!data.story_content,
    hasStoryUrl: !!data.story_url,
    storyFile: data.story_file,
    title: data.title,
    storyUrl: data.story_url
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
        hasStart: !!storyContent.start,
        inkVersion: storyContent.inkVersion,
        firstFewNodes: Object.keys(storyContent).slice(0, 5)
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
      console.log("[Content Extraction] Fetch response status:", response.status);
      
      if (response.ok) {
        const rawStoryText = await response.text();
        console.log("[Content Extraction] Raw story text length:", rawStoryText.length);
        
        try {
          const rawStoryJSON = JSON.parse(rawStoryText);
          console.log("[Content Extraction] Successfully parsed JSON from URL");
          
          // Log the basic structure of the fetched story
          console.log("[Content Extraction] Story structure:", {
            type: typeof rawStoryJSON,
            hasInkVersion: !!rawStoryJSON.inkVersion,
            hasRoot: !!rawStoryJSON.root,
            keysCount: Object.keys(rawStoryJSON).length,
            firstFewKeys: Object.keys(rawStoryJSON).slice(0, 5)
          });
          
          // If this is already in our format, return it directly
          if (rawStoryJSON.root && typeof rawStoryJSON.root === 'object' && rawStoryJSON.root.text) {
            console.log("[Content Extraction] Story appears to be in custom format already");
            return rawStoryJSON;
          }
          
          // Use our function to extract all nodes, including nested ones
          console.log("[Content Extraction] Extracting nodes from ink JSON");
          const allNodes = extractAllNodesFromInkJSON(rawStoryJSON);
          console.log(`[Content Extraction] Found ${allNodes.length} nodes in story:`, allNodes.slice(0, 5));
          
          // Convert to our custom story format
          console.log("[Content Extraction] Converting to custom story format");
          const customStory = extractCustomStoryFromInkJSON(rawStoryJSON);
          console.log(`[Content Extraction] Converted to custom format with ${Object.keys(customStory).length} nodes:`, 
            Object.keys(customStory).slice(0, 5));
          
          // Check for expected nodes
          console.log(`[Content Extraction] Has 'root' node: ${!!customStory.root}, Has 'start' node: ${!!customStory.start}`);
          
          return customStory;
        } catch (jsonError) {
          console.error("[Content Extraction] Error parsing JSON from URL response:", jsonError);
        }
      } else {
        console.error("[Content Extraction] Failed to fetch story from URL:", response.statusText);
      }
    } catch (fetchError) {
      console.error("[Content Extraction] Error fetching story from URL:", fetchError);
    }
  }
  
  // If no URL or it failed, try to load from the local stories folder
  if (data.story_file) {
    try {
      console.log("[Content Extraction] Attempting to load from local story file:", data.story_file);
      
      // Try to import the JSON file directly (this works in dev mode)
      try {
        const storyPath = `/src/stories/${data.story_file}`;
        console.log("[Content Extraction] Attempting dynamic import from:", storyPath);
        
        // Use dynamic import (this is just for debugging, not sure if it will work in all environments)
        const storyModule = await import(`../stories/${data.story_file}`);
        console.log("[Content Extraction] Successfully loaded from local file");
        
        const localStoryData = storyModule.default;
        console.log("[Content Extraction] Local story structure:", {
          keysCount: Object.keys(localStoryData).length,
          hasRoot: !!localStoryData.root,
          hasStart: !!localStoryData.start,
          firstFewKeys: Object.keys(localStoryData).slice(0, 5)
        });
        
        return localStoryData;
      } catch (importError) {
        console.error("[Content Extraction] Error importing local story file:", importError);
        
        // As fallback, try to load it from the public folder
        console.log("[Content Extraction] Attempting to fetch from public folder");
        const response = await fetch(`/stories/${data.story_file}`);
        
        if (response.ok) {
          const localStoryJSON = await response.json();
          console.log("[Content Extraction] Successfully loaded from public folder");
          
          console.log("[Content Extraction] Story structure from public folder:", {
            keysCount: Object.keys(localStoryJSON).length,
            hasRoot: !!localStoryJSON.root,
            hasStart: !!localStoryJSON.start
          });
          
          return localStoryJSON;
        } else {
          console.error("[Content Extraction] Failed to fetch from public folder:", response.statusText);
        }
      }
    } catch (localError) {
      console.error("[Content Extraction] Error loading from local story file:", localError);
    }
  }
  
  console.warn("[Content Extraction] Could not extract story content from any source");
  return null;
};
