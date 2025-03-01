
import React from 'react';
import { Comment } from './types';
import CommentItem from './CommentItem';

interface CommentsListProps {
  comments: Comment[];
  isLoading: boolean;
  currentUser: any;
  isModerator: boolean;
  onEditComment: (comment: Comment) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  isLoading,
  currentUser,
  isModerator,
  onEditComment,
}) => {
  // Check if a comment is owned by current user
  const isOwnComment = (comment: Comment) => {
    return currentUser && comment.user_id === currentUser.id;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A2618] mx-auto"></div>
        <p className="mt-2 text-[#3A2618]/70">Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-[#3A2618]/60 italic">
        No comments yet. Be the first to leave feedback!
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto mb-4">
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id}
            comment={comment}
            isOwnComment={isOwnComment(comment)}
            onEdit={onEditComment}
            isModerator={isModerator}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentsList;
