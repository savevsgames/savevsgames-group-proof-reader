
import React from 'react';
import { User } from '@supabase/supabase-js'; // Import the correct User type
import CommentItem from './CommentItem';
import { Comment } from '@/components/comments/types';

interface CommentSectionProps {
  user: User | null;
  comments: Comment[];
  onEditComment: (comment: Comment) => void;
  onDeleteComment?: (commentId: string) => void;
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  user,
  comments,
  onEditComment,
  onDeleteComment,
  onAddToLlmContext
}) => {
  if (!comments.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isOwnComment={user?.id === comment.user_id}
          isModerator={false} // This would need additional logic to determine
          onEdit={onEditComment}
          onDelete={onDeleteComment}
          onAddToLlmContext={onAddToLlmContext}
        />
      ))}
    </div>
  );
};

export default CommentSection;
