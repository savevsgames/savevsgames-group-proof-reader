
/**
 * NAVIGATION DATA STRUCTURES
 * 
 * This file contains types related to story navigation and history tracking.
 */

/**
 * Core navigation state.
 */
export interface NavigationState {
  currentNode: string;
  currentPage: number;
  totalPages: number;
  canGoBack: boolean;
  storyHistory: string[];
  currentStoryPosition: number;
}

/**
 * Type for the navigation state selector.
 */
export interface NavigationSelector {
  currentPage: number;
  currentNode: string;
  totalPages: number;
  canGoBack: boolean;
}
