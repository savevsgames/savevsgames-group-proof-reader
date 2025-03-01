
import { CommentType } from '@/lib/commentTypes';
import { User } from "@/lib/supabase";

export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  story_position: number;
  text: string;
  comment_type: CommentType;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
  };
}

export interface CommentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyPosition: number;
  currentUser: User | null;
}
