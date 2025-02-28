
import { Story } from 'inkjs';
import { supabase } from './supabase';

// Define interfaces for the custom story format
export interface StoryChoice {
  text: string;
  nextNode: string;
}

export interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
}

export interface CustomStory {
  [key: string]: StoryNode;
}

// Map to track story sections for page counting
export const storyNodeToPageMap: Record<string, number> = {
  'root': 1,
  'vault_description': 2,
  'dark_eye_introduction': 3,
  'mages_attempt': 4,
  'kavan_arrival': 5,
  'kavan_determination': 6,
  'dark_eye_awakens': 7,
  'dark_eye_speaks': 8,
  'kavan_response': 9,
  'battle_begins': 10,
  'kavan_struggle': 11,
  'kavan_love': 12,
  'kavan_fight': 13,
  'dark_eye_reaction': 14,
  'dark_eye_withdraws': 15,
  'final_blast': 16,
  'story_ending': 17
};

// Define an interface for book data
export interface BookData {
  id: string;
  title: string;
  story_url?: string;
  total_pages?: number;
}

// Fetch story content from URL
export const fetchStoryContent = async (storyUrl: string) => {
  const response = await fetch(storyUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch story content: ${response.statusText}`);
  }
  
  return await response.json();
};

// Helper function to extract a custom story format from ink JSON
export const extractCustomStoryFromInkJSON = (inkJSON: any): CustomStory => {
  try {
    const customStory: CustomStory = {};
    
    // Extract the root node text
    if (inkJSON.root && Array.isArray(inkJSON.root) && inkJSON.root.length > 0) {
      const rootText = inkJSON.root
        .filter(item => typeof item === 'string' && item.startsWith('^'))
        .map(item => (item as string).substring(1))
        .join(' ');
      
      customStory.root = {
        text: rootText || "Story begins...",
        choices: [{
          text: "Continue",
          nextNode: "vault_description"
        }]
      };
      
      // Try to extract other nodes from the structure
      if (inkJSON.vault_description) {
        extractNodesRecursively(inkJSON, customStory, "vault_description");
      }
    }
    
    return customStory;
  } catch (e) {
    console.error("Error extracting custom story from Ink JSON:", e);
    return {
      root: {
        text: "Failed to parse story format.",
        choices: []
      }
    };
  }
};

// Helper to recursively extract nodes
export const extractNodesRecursively = (inkJSON: any, customStory: CustomStory, nodeName: string) => {
  if (!inkJSON[nodeName]) return;
  
  try {
    // Extract text from the node
    const nodeText = Array.isArray(inkJSON[nodeName][0]) 
      ? inkJSON[nodeName][0]
          .filter(item => typeof item === 'string' && item.startsWith('^'))
          .map(item => (item as string).substring(1))
          .join(' ')
      : "Continue the story...";
    
    // Find the next node reference if any
    let nextNode = "";
    if (Array.isArray(inkJSON[nodeName][0])) {
      const lastItem = inkJSON[nodeName][0][inkJSON[nodeName][0].length - 1];
      if (lastItem && typeof lastItem === 'object' && lastItem["^->"]) {
        nextNode = lastItem["^->"];
      }
    }
    
    customStory[nodeName] = {
      text: nodeText,
      choices: nextNode ? [{
        text: "Continue",
        nextNode: nextNode
      }] : []
    };
    
    // If we found a next node, recursively process it
    if (nextNode && !customStory[nextNode]) {
      extractNodesRecursively(inkJSON, customStory, nextNode);
    }
  } catch (e) {
    console.error(`Error extracting node ${nodeName}:`, e);
  }
};

// Fetch comment count for a position
export const fetchCommentCount = async (storyId: string, position: string) => {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('story_id', storyId)
    .eq('story_position', position);
  
  if (error) {
    throw error;
  }
  
  return count || 0;
};

// Fetch book details from database
export const fetchBookDetails = async (storyId: string) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', storyId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch book details: ${error.message}`);
  }

  if (!data) {
    throw new Error('Book not found');
  }

  return data;
};
