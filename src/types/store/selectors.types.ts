
/**
 * STORE SELECTOR TYPES
 * 
 * This file contains types for store selectors and related utilities.
 */

import { StoryStore } from './store.types';

/**
 * Equality function for comparing previous and next state values.
 */
export type EqualityFn<T> = (previous: T, next: T) => boolean;

/**
 * Type for a selector function that extracts data from the store.
 * This allows for proper typing with shallow equality function.
 */
export type StorySelector<U> = (state: StoryStore, equalityFn?: EqualityFn<U>) => U;

/**
 * UI state selector interface.
 */
export interface UISelector {
  loading: boolean;
  error: string | null;
  commentCount: number;
}

/**
 * Navigation state selector interface.
 */
export interface NavigationSelector {
  currentPage: number;
  currentNode: string;
  totalPages: number;
  canGoBack: boolean;
}

/**
 * Content selector interface.
 */
export interface ContentSelector {
  currentText: string;
  currentChoices: import('../core/story.types').StoryChoice[];
  canContinue: boolean;
  currentStoryPosition: number;
}

/**
 * Metadata selector interface.
 */
export interface MetadataSelector {
  bookTitle: string;
  totalPages: number;
}

/**
 * Comments selector interface.
 */
export interface CommentsSelector {
  comments: import('../features/comments.types').Comment[];
  commentCount: number;
  isLoading: boolean;
  error: string | null;
}
