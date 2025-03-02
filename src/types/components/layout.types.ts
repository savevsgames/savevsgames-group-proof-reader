
/**
 * LAYOUT COMPONENT TYPES
 * 
 * This file contains types related to layout components like BookLayout.
 */

import { StoryChoice } from '../core/story.types';
import { User } from '@supabase/supabase-js';
import { Comment } from '../features/comments.types';

/**
 * Props for the BookLayout component.
 */
export interface BookLayoutProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  currentText: string;
  currentNode: string;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  canGoBack: boolean;
  commentCount: number;
  comments: Comment[]; 
  currentUser: User | null; 
  storyId: string;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onBack: () => void;
  onRestart: () => void;
  onOpenComments: () => void;
  onPageChange: (pageNumber: number) => void;
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}
