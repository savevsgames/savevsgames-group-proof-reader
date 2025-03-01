
import React from "react";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import CommentItem from "./CommentItem";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  comment_type: string;
  profile: {
    username: string;
  };
}

interface CommentsListProps {
  comments: Comment[];
  loading: boolean;
  currentUserId?: string;
  onDeleteComment: (commentId: string) => void;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  loading,
  currentUserId,
  onDeleteComment,
}) => {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center border rounded-md">
        <MessageCircle className="h-12 w-12 mx-auto text-gray-300" />
        <p className="mt-2 text-gray-500">No comments yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onDelete={onDeleteComment}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default CommentsList;
