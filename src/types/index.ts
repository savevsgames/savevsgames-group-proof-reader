
/**
 * MAIN TYPES INDEX
 * 
 * This file re-exports all types from the various type definition files.
 * Use this file to import types throughout the application.
 */

// Core types
export * from './core/story.types';
// Export only the types that don't conflict from navigation.types
export type { NavigationState } from './core/navigation.types';

// Store types - be careful not to duplicate selector types
export * from './store/state.types';
export * from './store/actions.types';
export * from './store/store.types';

// Component types
export * from './components/engine.types';
export * from './components/layout.types';
export * from './components/editor.types';

// Feature types
export * from './features/comments.types';
export * from './features/tabs.types';

// External types for convenience
export type { User } from '@supabase/supabase-js';

// Export selectors last to avoid conflicts
export * from './store/selectors.types';
