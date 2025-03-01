
/**
 * STORY ENGINE COMPONENT TYPES
 * 
 * This file contains types related to the StoryEngine component.
 */

import { StoryChoice } from '../core/story.types';
import { User } from '@supabase/supabase-js';
import { Comment } from '../features/comments.types';

/**
 * Props for the StoryEngine component.
 */
export interface StoryEngineProps {
  storyId: string;
}

/**
 * Props for the StoryDisplay component.
 */
export interface StoryDisplayProps {
  text: string;
  storyId?: string;
  currentNode?: string;
  currentPage?: number;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onRestart?: () => void;
}
