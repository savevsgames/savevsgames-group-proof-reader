
import { CustomStory } from './types';
import { supabase } from '../supabase';
import { generateComprehensiveNodeMapping, validateNodeMappings } from '@/lib/storyNodeMapping';

// Function to generate mappings based on story data - improved version with logging
export const generateNodeMappings = (storyData: any) => {
  console.log("[Node Mapping] Starting node mapping generation", { dataType: typeof storyData });
  
  if (!storyData) {
    console.warn("[Node Mapping] No story data provided");
    return { 
      storyNodeToPageMap: {}, 
      pageToStoryNodeMap: {},
      totalPages: 0
    };
  }
  
  // Use our new comprehensive mapping function
  const { nodeToPage, pageToNode, totalPages } = generateComprehensiveNodeMapping(storyData);
  
  // Return the mappings in the expected format for backward compatibility
  return {
    storyNodeToPageMap: nodeToPage,
    pageToStoryNodeMap: pageToNode,
    totalPages
  };
};

// Use the shared validation function
export { validateNodeMappings } from '@/lib/storyNodeMapping';

// Add default mappings for backward compatibility
export const storyNodeToPageMap: Record<string, number> = {};
export const pageToStoryNodeMap: Record<number, string> = {};
