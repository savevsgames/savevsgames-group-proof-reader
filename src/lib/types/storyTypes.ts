
/**
 * Interface representing a node in the story graph
 */
export interface StoryNode {
  id: string;
  text: string;
  choices?: Array<{nextNode: string}>;
  visited?: boolean;
}

/**
 * Interface for a story choice
 */
export interface StoryChoice {
  text: string;
  nextNode: string;
}

/**
 * Interface for a node with content and choices
 */
export interface StoryNodeContent {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
}

/**
 * Interface for parsed Ink node content
 */
export interface InkNodeContent {
  text: string;
  choices: StoryChoice[];
  nextNode?: string;
  isEnding?: boolean;
  metadata?: Record<string, any>;
}
