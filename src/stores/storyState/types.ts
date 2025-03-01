
// Import from our centralized type definitions
import { StoryStore } from '@/types/store/store.types';

// Export for backward compatibility and to make imports cleaner 
export type { StoryStore };

// Export other useful types
export type { EqualityFn, StorySelector } from '@/types/store/selectors.types';
export type { CustomStory, StoryNode, StoryChoice } from '@/types/core/story.types';
export type { Comment, CommentType } from '@/types/features/comments.types';
export type { TabType } from '@/types/features/tabs.types';
