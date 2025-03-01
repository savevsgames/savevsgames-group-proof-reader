
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Trash, Edit, Send } from 'lucide-react';
import { Comment } from './types';
import { commentTypeColors, commentTypeLabels } from '@/lib/commentTypes';

interface CommentItemProps {
  comment: Comment;
  isOwnComment: boolean;
  isModerator: boolean;
  onEdit: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isOwnComment,
  isModerator,
  onEdit,
  onDelete,
  onAddToLlmContext,
}) => {
  const formattedDate = new Date(comment.created_at).toLocaleString();
  const commentType = comment.comment_type || 'general';
  const commentTypeColor = commentTypeColors[commentType as keyof typeof commentTypeColors] || '#888888';
  const commentTypeLabel = commentTypeLabels[commentType as keyof typeof commentTypeLabels] || 'Comment';
  
  const handleAddToContext = () => {
    if (onAddToLlmContext) {
      onAddToLlmContext(
        commentTypeLabel, 
        comment.text,
        comment.user_name || 'Anonymous'
      );
    }
  };

  const canModify = isOwnComment || isModerator;

  return (
    <div className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.user_name}</span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
          
          {commentType && (
            <div 
              className="inline-block px-2 py-0.5 rounded text-xs font-medium my-1"
              style={{ 
                backgroundColor: commentTypeColor,
                color: ['suggestion', 'spelling', 'praise', 'general'].includes(commentType) ? '#3A2618' : 'white'
              }}
            >
              {commentTypeLabel}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {canModify && onEdit && (
            <Button
              onClick={() => onEdit(comment)}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4 text-[#3A2618]" />
            </Button>
          )}
          
          {canModify && onDelete && (
            <Button
              onClick={() => onDelete(comment.id)}
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
          
          {onAddToLlmContext && (
            <Button
              onClick={handleAddToContext}
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600"
              title="Send comment to LLM"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-[#3A2618] whitespace-pre-wrap">
        {comment.text}
      </div>
    </div>
  );
};

export default CommentItem;
