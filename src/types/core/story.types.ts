
/**
 * CORE STORY DATA STRUCTURES
 * 
 * This file contains the fundamental data structures used to represent story content.
 */

/**
 * Represents a choice in a story node.
 */
export interface StoryChoice {
  text: string;
  nextNode: string;
}

/**
 * Represents a node in the story structure.
 */
export interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
  metadata?: Record<string, any>;
}

/**
 * The custom story format used throughout the application.
 */
export interface CustomStory {
  [key: string]: StoryNode | any;
  root?: StoryNode;
  start?: StoryNode;
  inkVersion?: number;
  listDefs?: any;
}

/**
 * Maps between nodes and page numbers.
 */
export interface NodeMappings {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
}
