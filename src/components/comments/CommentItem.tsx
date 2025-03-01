
import React from 'react';
import { Comment } from './types';
import { commentTypeColors, commentTypeLabels } from '@/lib/commentTypes';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  isOwnComment: boolean;
  onEdit: (comment: Comment) => void;
  isModerator: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isOwnComment,
  onEdit,
  isModerator,
}) => {
  const commentType = comment.comment_type || 'edit';
  const typeColor = commentTypeColors[commentType];
  const isDarkBackground = !['suggestion', 'spelling'].includes(commentType);
  
  const handleEditClick = () => {
    onEdit(comment);
  };
  
  return (
    <div className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.profile?.username || 'Anonymous'}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          
          <div 
            className="inline-block px-2 py-0.5 rounded text-xs font-medium my-1"
            style={{ 
              backgroundColor: typeColor,
              color: isDarkBackground ? 'white' : '#3A2618'
            }}
          >
            {commentTypeLabels[commentType] || 'Comment'}
          </div>
        </div>
        
        {(isOwnComment || isModerator) && (
          <div className="flex gap-2">
            {isOwnComment && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleEditClick}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4 text-[#3A2618]" />
              </Button>
            )}
            {(isOwnComment || isModerator) && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-red-500"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-[#3A2618] whitespace-pre-wrap">
        {comment.text}
      </div>
    </div>
  );
};

export default CommentItem;
