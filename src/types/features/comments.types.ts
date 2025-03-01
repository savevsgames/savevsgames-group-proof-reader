
/**
 * COMMENTS FEATURE TYPES
 * 
 * This file contains types related to the comments feature.
 */

/**
 * Type for comment categories.
 */
export type CommentType = 'edit' | 'suggestion' | 'praise' | 'question' | 'issue' | 'spelling' | 'general';

/**
 * Represents a comment in the story.
 */
export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  story_position: number;
  story_node?: string;
  text: string;
  content?: string; // For backward compatibility
  created_at: string;
  updated_at: string;
  comment_type: CommentType;
  profile?: {
    username: string;
    avatar_url?: string;
  };
  user_name?: string; // Added for display purposes
  user_avatar?: string; // Added for display purposes
}
