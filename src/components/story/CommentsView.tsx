
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CommentsList } from "./CommentsList";
import CommentForm from "./comments/CommentForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useStoryStore } from "@/stores/storyState";
import { CommentType } from "@/types";

interface CommentsViewProps {
  storyId: string;
  currentNode?: string;
  currentPage: number;
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}

const CommentsView: React.FC<CommentsViewProps> = ({
  storyId,
  currentNode = '',
  currentPage,
  onAddToLlmContext
}) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [showAddComment, setShowAddComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('general');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  
  // Access store state selectively to prevent re-render loops
  const comments = useStoryStore(state => state.comments);
  const commentCount = useStoryStore(state => state.commentCount);
  const isLoading = useStoryStore(state => state.commentsLoading);
  
  // Access store actions
  const fetchComments = useStoryStore(state => state.fetchComments);
  const deleteComment = useStoryStore(state => state.deleteComment);
  
  // Only fetch comments when the page changes or component mounts
  useEffect(() => {
    if (storyId && currentPage) {
      console.log("[CommentsView] Fetching comments for page:", currentPage);
      fetchComments(storyId, currentPage);
    }
  }, [storyId, currentPage, fetchComments]);
  
  const handleCommentTextChange = (text: string) => {
    setCommentText(text);
  };
  
  const handleCommentTypeChange = (type: CommentType) => {
    setCommentType(type);
  };
  
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentText('');
    setShowAddComment(false);
  };
  
  const handleUpdateComment = async (commentId: string, text: string, commentType: string) => {
    setEditingCommentId(commentId);
    setCommentText(text);
    setCommentType(commentType as CommentType);
    setShowAddComment(true);
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
          user={user}
          userProfile={profile}
          storyId={storyId}
          currentNode={currentNode}
          currentPage={currentPage}
          isEditing={!!editingCommentId}
          editingCommentId={editingCommentId}
          commentText={commentText}
          commentType={commentType}
          onCommentTextChange={handleCommentTextChange}
          onCommentTypeChange={handleCommentTypeChange}
          onCancelEdit={handleCancelEdit}
          comments={comments}
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
