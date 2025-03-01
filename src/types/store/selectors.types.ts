
/**
 * STORE SELECTOR TYPES
 * 
 * This file contains types for store selectors and related utilities.
 */

import { StoryStore } from './store.types';

/**
 * Type for story selector function.
 */
export type StorySelector<T> = (state: StoryStore) => T;

/**
 * Equality function for comparing previous and next state values.
 */
export type EqualityFn<T> = (previous: T, next: T) => boolean;

/**
 * Store selector utility types for Zustand usage.
 */
export interface StoreSelectors {
  useUIState: () => import('./state.types').UISelector;
  useNavigationState: () => import('../core/navigation.types').NavigationSelector;
  useContentState: () => import('./state.types').ContentSelector;
  useMetadataState: () => import('./state.types').MetadataSelector;
}
