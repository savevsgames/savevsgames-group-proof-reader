
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle } from "lucide-react";
import { fetchComments } from "@/lib/storyUtils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CommentForm from "./comments/CommentForm";
import CommentsList from "./comments/CommentsList";
import { useCommentOperations } from "./comments/commentUtils";

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  onCommentsUpdate: (count: number) => void;
  currentPage: number;
}

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

const CommentsView: React.FC<CommentsViewProps> = ({
  storyId,
  currentNode,
  onCommentsUpdate,
  currentPage,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { deleteComment, refreshComments } = useCommentOperations(
    storyId,
    currentPage,
    onCommentsUpdate
  );

  // Load comments for the current page
  useEffect(() => {
    const loadComments = async () => {
      if (!storyId || currentPage === undefined) return;
      
      setLoading(true);
      try {
        console.log(`Loading comments for story ${storyId}, page ${currentPage}`);
        const commentsData = await fetchComments(storyId, currentPage);
        setComments(commentsData);
        
        // Update the comment count in the parent component
        onCommentsUpdate(commentsData.length);
      } catch (error) {
        console.error("Error loading comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [storyId, currentPage, onCommentsUpdate, toast]);

  const handleCommentAdded = (newComment: Comment) => {
    setComments([newComment, ...comments]);
    onCommentsUpdate(comments.length + 1);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    const updatedComments = await deleteComment(commentId, user.id, comments);
    if (updatedComments) {
      setComments(updatedComments);
    }
  };

  const handleRefreshComments = async () => {
    setLoading(true);
    const refreshedComments = await refreshComments();
    if (refreshedComments) {
      setComments(refreshedComments);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Comments for Page {currentPage}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshComments}
          disabled={loading}
          title="Refresh Comments"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {user ? (
        <CommentForm
          storyId={storyId}
          currentNode={currentNode}
          currentPage={currentPage}
          onCommentAdded={handleCommentAdded}
        />
      ) : (
        <div className="bg-slate-100 p-4 rounded-md text-center">
          <p className="text-slate-600">
            Please sign in to leave a comment.
          </p>
        </div>
      )}

      <div className="border-t pt-4">
        <h4 className="font-medium mb-4 flex items-center">
          <MessageCircle className="h-4 w-4 mr-2" />
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h4>

        <CommentsList
          comments={comments}
          loading={loading}
          currentUserId={user?.id}
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  );
};

export default CommentsView;
