
// Import from supabase instead of AuthContext
import { User } from '@/lib/supabase';
import { CommentType } from '@/lib/commentTypes';

// Defines the shape of a comment
export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  story_position: number;
  story_node?: string;
  text: string;
  created_at: string;
  updated_at: string;
  comment_type: CommentType;
  profile?: {
    username: string;
    avatar_url?: string;
  };
  content?: string; // For backward compatibility
  user_name?: string; // Added for display purposes
  user_avatar?: string; // Added for display purposes
}

// Props for the CommentModal component
export interface CommentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyPosition: number | undefined;
  currentUser: User | null;
}

// Props for the CommentItem component
export interface CommentItemProps {
  comment: Comment;
  isOwnComment: boolean;
  onEdit: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  isModerator: boolean;
}

// Props for CommentsList component
export interface CommentsListProps {
  comments: Comment[];
  isLoading: boolean;
  currentUser: User | null;
  isModerator: boolean;
  onEditComment: (comment: Comment) => void;
  onDeleteComment?: (commentId: string) => void;
}

// Props for CommentForm component
export interface CommentFormProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  onCommentAdded: (newComment: Comment) => void;
}
