
/**
 * STORE STATE TYPES
 * 
 * This file contains types related to the global state store.
 */

import { CustomStory } from '../core/story.types';
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
