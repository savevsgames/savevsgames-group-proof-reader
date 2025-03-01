
import { User } from '@/context/AuthContext';

// Defines the shape of a comment
export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  story_position: number;
  text: string;
  created_at: string;
  updated_at: string;
  comment_type: 'edit' | 'suggestion' | 'praise' | 'question' | 'issue' | 'spelling';
  profile?: {
    username: string;
  };
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
  isModerator: boolean;
}

// Props for CommentsList component
export interface CommentsListProps {
  comments: Comment[];
  isLoading: boolean;
  currentUser: User | null;
  isModerator: boolean;
  onEditComment: (comment: Comment) => void;
}
