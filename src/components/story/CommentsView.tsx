
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CommentsList } from "./CommentsList";
import CommentForm from "./comments/CommentForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";

interface CommentsViewProps {
  storyId: string;
  currentNode?: string;
  currentPage: number;
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}

const CommentsView: React.FC<CommentsViewProps> = ({
  storyId,
  currentNode,
  currentPage,
  onAddToLlmContext
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddComment, setShowAddComment] = useState(false);
  
  // Get comments from store
  const { comments, commentCount, isLoading } = useStoryStore(state => ({
    comments: state.comments,
    commentCount: state.commentCount,
    isLoading: state.commentsLoading
  }));
  
  const { fetchComments, addComment, updateComment, deleteComment } = useStoryStore();
  
  useEffect(() => {
    if (storyId && currentPage) {
      fetchComments(storyId, currentPage);
    }
  }, [fetchComments, storyId, currentPage]);
  
  const handleAddComment = async (text: string, commentType: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You need to sign in to add comments",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addComment(
        storyId, 
        currentPage, 
        text, 
        commentType, 
        user.id,
        currentNode || ''
      );
      
      setShowAddComment(false);
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error adding your comment",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateComment = async (commentId: string, text: string, commentType: string) => {
    try {
      await updateComment(commentId, storyId, currentPage, text, commentType);
      
      toast({
        title: "Comment Updated",
        description: "Your comment has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error updating your comment",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, storyId, currentPage);
      
      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error deleting your comment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Comments {commentCount > 0 && `(${commentCount})`}
        </h2>
        
        {!showAddComment && (
          <Button
            onClick={() => setShowAddComment(true)}
            className="bg-[#6D4B34] hover:bg-[#5A3F2B]"
          >
            Add Comment
          </Button>
        )}
      </div>
      
      {showAddComment && (
        <CommentForm
          onSubmit={handleAddComment}
          onCancel={() => setShowAddComment(false)}
          user={user}
        />
      )}
      
      <CommentsList
        comments={comments}
        currentUser={user}
        isLoading={isLoading}
        onUpdate={handleUpdateComment}
        onDelete={handleDeleteComment}
        onAddToContext={onAddToLlmContext}
      />
    </div>
  );
};

export default CommentsView;
