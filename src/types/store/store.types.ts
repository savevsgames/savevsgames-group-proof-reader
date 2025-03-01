
/**
 * STORE DEFINITION TYPES
 * 
 * This file contains the combined store type definitions.
 */

import { StoryState } from './state.types';
import { StoryActions } from './actions.types';

/**
 * Combined store type including both state and actions.
 */
export type StoryStore = StoryState & StoryActions;

/**
 * Helper type to extract just the state portion of the store.
 */
export type StoreState = Pick<StoryStore, keyof StoryState>;

/**
 * Helper type to extract just the actions portion of the store.
 */
export type StoreActions = Pick<StoryStore, keyof StoryActions>;
