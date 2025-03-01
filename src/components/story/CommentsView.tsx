
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Use a ref to prevent unnecessary re-renders
  const onCommentsUpdateRef = useRef(onCommentsUpdate);
  useEffect(() => {
    onCommentsUpdateRef.current = onCommentsUpdate;
  }, [onCommentsUpdate]);

  const notifyCommentCount = useCallback((count: number) => {
    onCommentsUpdateRef.current(count);
  }, []);

  const { deleteComment, refreshComments } = useCommentOperations(
    storyId,
    currentPage,
    notifyCommentCount
  );

  // Create a memoized loadComments function with fewer dependencies
  const loadComments = useCallback(async () => {
    if (!storyId || currentPage === undefined) return;
    
    // Implement throttling - don't fetch if we fetched recently (within last second)
    const now = Date.now();
    if (now - lastFetchTime < 1000) {
      return;
    }
    
    setLoading(true);
    setLastFetchTime(now);
    
    try {
      console.log(`Loading comments for story ${storyId}, page ${currentPage}`);
      const commentsData = await fetchComments(storyId, currentPage);
      setComments(commentsData);
      
      // Update the comment count in the parent component
      notifyCommentCount(commentsData.length);
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
  }, [storyId, currentPage, toast, lastFetchTime, notifyCommentCount]);

  // Load comments for the current page
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCommentAdded = useCallback((newComment: Comment) => {
    // Use a function update to ensure we have the latest state
    setComments(prevComments => {
      const updatedComments = [newComment, ...prevComments];
      // Update count after state is updated
      notifyCommentCount(updatedComments.length);
      return updatedComments;
    });
  }, [notifyCommentCount]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!user) return;
    
    const updatedComments = await deleteComment(commentId, user.id, comments);
    if (updatedComments) {
      setComments(updatedComments);
      // Update count after deletion
      notifyCommentCount(updatedComments.length);
    }
  }, [user, deleteComment, comments, notifyCommentCount]);

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
          isModerator={false}
          onEditComment={() => {}} // We'll implement this later
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  );
};

export default CommentsView;
