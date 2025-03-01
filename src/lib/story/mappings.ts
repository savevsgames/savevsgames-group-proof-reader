
import { CustomStory } from './types';
import { supabase } from '../supabase';

// Function to generate mappings based on story data - simplified version
export const generateNodeMappings = (storyData: any) => {
  if (!storyData) {
    return { 
      storyNodeToPageMap: {}, 
      pageToStoryNodeMap: {},
      totalPages: 0
    };
  }
  
  // Create empty mappings
  const nodeToPage: Record<string, number> = {};
  const pageToNode: Record<number, string> = {};
  
  // Process all nodes from story data
  const allNodes = Object.keys(storyData).filter(key => 
    key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
  );
  
  // Assign sequential page numbers
  let pageNumber = 1;
  for (const nodeName of allNodes) {
    nodeToPage[nodeName] = pageNumber;
    pageToNode[pageNumber] = nodeName;
    pageNumber++;
  }
  
  const totalPages = allNodes.length;
  
  return {
    storyNodeToPageMap: nodeToPage,
    pageToStoryNodeMap: pageToNode,
    totalPages
  };
};

// Add default mappings for backward compatibility
export const storyNodeToPageMap: Record<string, number> = {};
export const pageToStoryNodeMap: Record<number, string> = {};
