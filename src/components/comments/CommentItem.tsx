
import React from 'react';
import { Comment } from './types';
import { commentTypeColors } from '@/lib/commentTypes';
import { useAuth } from '@/context/AuthContext';

interface CommentItemProps {
  comment: Comment;
  isOwnComment: boolean;
  onEdit?: (comment: Comment) => void;
  isModerator: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isOwnComment,
  onEdit,
  isModerator,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Display either username or "Anonymous" based on ownership and available data
  const getDisplayName = (comment: Comment) => {
    if (isOwnComment) {
      return "You";
    }
    
    // Return the username from the profile if available, otherwise show "Anonymous"
    return comment.profile?.username || "Anonymous";
  };

  const canEdit = isOwnComment || isModerator;

  return (
    <div 
      key={comment.id} 
      className="p-4 rounded-md border border-[#3A2618]/20 relative"
      style={{ backgroundColor: `${commentTypeColors[comment.comment_type]}20` }}
    >
      <div 
        className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
        style={{ 
          backgroundColor: commentTypeColors[comment.comment_type],
          color: ['suggestion', 'spelling'].includes(comment.comment_type) ? '#3A2618' : 'white'
        }}
      >
        {comment.comment_type.charAt(0).toUpperCase() + comment.comment_type.slice(1)}
      </div>
      
      <p className="text-[#3A2618] mb-2">{comment.text}</p>
      
      <div className="flex justify-between items-center text-[#3A2618]/60 text-xs">
        <span>{getDisplayName(comment)}</span>
        <div className="flex items-center gap-2">
          <span>{formatDate(comment.created_at)}</span>
          {canEdit && (
            <button 
              onClick={() => onEdit && onEdit(comment)}
              className="text-[#3A2618]/60 hover:text-[#3A2618] transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
