
import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchComments } from "@/lib/storyUtils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea"; 
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import CommentsList from "../comments/CommentsList";
import CommentTypeSelector from "../comments/CommentTypeSelector";
import { useCommentOperations } from "./comments/commentUtils";
import { CommentType } from "@/lib/commentTypes";
import { Comment } from "../comments/types";
import { supabase } from "@/lib/supabase";

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
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCommentType, setSelectedCommentType] = useState<CommentType>("edit");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to post comments",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingComment) {
        // Update existing comment
        const { error } = await supabase
          .from('comments')
          .update({
            text: commentText,
            comment_type: selectedCommentType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingComment.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Comment Updated",
          description: "Your comment has been updated successfully",
        });
      } else {
        // Create new comment
        const { data, error } = await supabase
          .from('comments')
          .insert({
            user_id: user.id,
            story_id: storyId,
            story_position: currentPage,
            story_node: currentNode,
            text: commentText,
            comment_type: selectedCommentType,
          })
          .select(`
            *,
            profile:profiles(username)
          `)
          .single();

        if (error) throw error;

        // Add the new comment to the list
        if (data) {
          handleCommentAdded(data);
        }

        toast({
          title: "Comment Added",
          description: "Your comment has been posted successfully",
        });
      }

      // Reset form
      setCommentText("");
      setEditingComment(null);
      setSelectedCommentType("edit");
      
      // Refresh comments
      await loadComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "Failed to submit your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
    setSelectedCommentType(comment.comment_type);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText("");
    setSelectedCommentType("edit");
  };

  return (
    <div className="flex flex-col h-full book-page px-6 py-4 rounded-lg">
      <h2 className="text-2xl font-serif mb-6 text-[#3A2618]">Reader Comments</h2>
      
      {user ? (
        <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8">
          <div className="book-page-texture rounded-md p-4">
            <Textarea
              placeholder="Share your thoughts, feedback, or questions about this page..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px] bg-[#FDF8EC] border-[#3A2618]/30 text-[#3A2618] font-serif"
            />
            
            <div className="mt-4">
              <CommentTypeSelector
                selectedCommentType={selectedCommentType}
                setSelectedCommentType={setSelectedCommentType}
              />
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              {editingComment && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  className="border-[#3A2618] text-[#3A2618]"
                >
                  Cancel Edit
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#3A2618] text-[#E8DCC4] hover:bg-[#3A2618]/80"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting 
                  ? "Submitting..." 
                  : editingComment 
                    ? "Update Comment" 
                    : "Post Comment"
                }
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-[#FDF8EC] p-6 rounded-md text-center mb-8 border border-[#3A2618]/20">
          <p className="text-[#3A2618] font-serif">
            Please sign in to leave a comment.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto book-page-texture rounded-md p-4">
        <h3 className="font-medium text-[#3A2618] mb-4 font-serif">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h3>

        <CommentsList
          comments={comments}
          isLoading={loading}
          currentUser={user}
          isModerator={false}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  );
};

export default CommentsView;
