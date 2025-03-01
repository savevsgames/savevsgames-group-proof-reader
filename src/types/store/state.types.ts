
/**
 * STORE STATE TYPES
 * 
 * This file contains types related to the global state store.
 */

import { CustomStory } from '../core/story.types';
import { NavigationState } from '../core/navigation.types';
import { Comment } from '../features/comments.types';

/**
 * Core state of the story store.
 */
export interface StoryState {
  // Basic story metadata
  storyId: string | null;
  story: any | null; // InkJS Story instance
  storyData: CustomStory | null;
  title: string;
  
  // Navigation and mapping
  nodeMappings: import('../core/story.types').NodeMappings;
  totalPages: number;
  currentPage: number;
  currentNode: string;
  
  // Story content
  currentText: string;
  currentChoices: import('../core/story.types').StoryChoice[];
  canContinue: boolean;
  
  // Navigation history
  storyHistory: string[];
  canGoBack: boolean;
  
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  commentCount: number;
  currentStoryPosition: number;
  
  // Format
  usingCustomFormat: boolean;
  
  // Comments state
  comments: Comment[];
  commentsLoading: boolean;
  commentsError: string | null;
}

/**
 * Type for the UI state selector.
 */
export interface UISelector {
  loading: boolean;
  error: string | null;
}

/**
 * Type for the content selector.
 */
export interface ContentSelector {
  currentText: string;
  currentChoices: import('../core/story.types').StoryChoice[];
  canContinue: boolean;
}

/**
 * Type for the metadata selector.
 */
export interface MetadataSelector {
  bookTitle: string;
  totalPages: number;
}

/**
 * Type for the comments selector.
 */
export interface CommentsSelector {
  comments: Comment[];
  commentCount: number;
  isLoading: boolean;
}
