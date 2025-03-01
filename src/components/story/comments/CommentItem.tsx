
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash } from "lucide-react";
import { commentTypeLabels, commentTypeColors } from "@/lib/commentTypes";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    comment_type: string;
    profile: {
      username: string;
    };
  };
  currentUserId?: string;
  onDelete: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onDelete,
}) => {
  const commentType = comment.comment_type || 'general';
  const typeColor = commentTypeColors[commentType as keyof typeof commentTypeColors] || '#9ca3af';
  const isDarkBackground = !['suggestion', 'spelling'].includes(commentType);
  
  return (
    <div
      key={comment.id}
      className="p-4 border rounded-md bg-slate-50"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>
              {comment.profile?.username?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{comment.profile?.username || 'Anonymous'}</p>
            <p className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {currentUserId && currentUserId === comment.user_id && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(comment.id)}
            title="Delete Comment"
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>
      
      <div 
        className="inline-block px-2 py-1 rounded text-xs font-medium my-2"
        style={{ 
          backgroundColor: typeColor,
          color: isDarkBackground ? 'white' : '#3A2618'
        }}
      >
        {commentTypeLabels[commentType as keyof typeof commentTypeLabels] || 'Comment'}
      </div>
      
      <div className="mt-2 text-gray-700 whitespace-pre-wrap">
        {comment.content}
      </div>
    </div>
  );
};

export default CommentItem;
