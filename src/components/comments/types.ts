
// Import from our centralized types
import { User, Comment, CommentType } from '@/types';
import { Profile } from '@/lib/supabase';

// Re-export the types for backward compatibility
export type { Comment, CommentType };

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
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}

// Props for CommentsList component
export interface CommentsListProps {
  comments: Comment[];
  isLoading: boolean;
  currentUser: User | null;
  isModerator?: boolean;
  onUpdate: (commentId: string, text: string, commentType: string) => void;
  onDelete?: (commentId: string) => void;
  onAddToContext?: (commentType: string, commentText: string, username: string) => void;
}

// Props for CommentForm component
export interface CommentFormProps {
  user: User | null;
  userProfile?: Profile | null;
  storyId: string;
  currentNode: string;
  currentPage: number;
  isEditing: boolean;
  editingCommentId: string | null;
  commentText: string;
  commentType: CommentType;
  onCommentTextChange: (text: string) => void;
  onCommentTypeChange: (type: CommentType) => void;
  onCancelEdit: () => void;
  onCommentsUpdate?: (count: number) => void;
  comments: Comment[];
}
