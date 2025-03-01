
import React from 'react';
import { Comment } from '../comments/types';
import CommentItem from '../comments/CommentItem';
import { User } from '@/lib/supabase';

interface CommentsListProps {
  comments: Comment[];
  currentUser: User | null;
  isLoading: boolean;
  onUpdate: (commentId: string, text: string, commentType: string) => void;
  onDelete: (commentId: string) => void;
  onAddToContext?: (commentType: string, commentText: string, username: string) => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  currentUser,
  isLoading,
  onUpdate,
  onDelete,
  onAddToContext
}) => {
  // Check if a comment is owned by current user
  const isOwnComment = (comment: Comment) => {
    return currentUser && comment.user_id === currentUser.id;
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-[#3A2618]/60 italic">
        No comments yet. Be the first to leave feedback!
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto mb-4 space-y-4">
      {comments.map((comment) => (
        <CommentItem 
          key={comment.id}
          comment={comment}
          isOwnComment={isOwnComment(comment)}
          onEdit={() => onUpdate(comment.id, comment.text, comment.comment_type)}
          onDelete={() => onDelete(comment.id)}
          isModerator={false}
          onAddToLlmContext={onAddToContext}
        />
      ))}
    </div>
  );
};

export default CommentsList;
