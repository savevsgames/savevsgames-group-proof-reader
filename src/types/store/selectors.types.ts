
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
 * Type for a selector function that extracts data from the store and supports an optional equality function.
 */
export type StorySelector<T> = {
  (state: StoryStore): T;
  (state: StoryStore, equalityFn?: EqualityFn<T>): T;
};

/**
 * Helper type for creating type-safe store selectors.
 */
export type TypedSelector<T> = <U>(selector: (state: T) => U, equalityFn?: EqualityFn<U>) => U;

/**
 * Store selector utility types for Zustand usage.
 */
export interface StoreSelectors {
  useUIState: () => import('./state.types').UISelector;
  useNavigationState: () => import('../core/navigation.types').NavigationSelector;
  useContentState: () => import('./state.types').ContentSelector;
  useMetadataState: () => import('./state.types').MetadataSelector;
  useCommentsState: () => import('./state.types').CommentsSelector;
}
