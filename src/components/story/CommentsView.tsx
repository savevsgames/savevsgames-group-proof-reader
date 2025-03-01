
import React, { useState, useEffect, useCallback } from "react";
import { fetchComments } from "@/lib/storyUtils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CommentForm from "./comments/CommentForm";
import CommentsList from "../comments/CommentsList";
import { useCommentOperations } from "./comments/commentUtils";
import { Comment } from "../comments/types";

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  onCommentsUpdate: (count: number) => void;
  currentPage: number;
  onAddToLlmContext?: (text: string) => void;
}

const CommentsView: React.FC<CommentsViewProps> = ({
  storyId,
  currentNode,
  onCommentsUpdate,
  currentPage,
  onAddToLlmContext,
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

  // Create a memoized loadComments function to prevent infinite loops
  const loadComments = useCallback(async () => {
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
  }, [storyId, currentPage, onCommentsUpdate, toast]);

  // Load comments for the current page
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCommentAdded = (newComment: Comment) => {
    setComments([newComment, ...comments]);
    onCommentsUpdate(comments.length + 1);
  };

  const handleEditComment = (comment: Comment) => {
    // This would typically open a form to edit the comment
    console.log("Edit comment:", comment);
    // In this simplified version, we're not implementing edit functionality
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    const updatedComments = await deleteComment(commentId, user.id, comments);
    if (updatedComments) {
      setComments(updatedComments);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="pt-4">
        <h4 className="font-medium mb-4">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h4>

        <CommentsList
          comments={comments}
          isLoading={loading}
          currentUser={user}
          isModerator={false} // We would need to implement this check
          onEditComment={handleEditComment}
        />
      </div>
    </div>
  );
};

export default CommentsView;
