
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchComments } from "@/lib/storyUtils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trash, RefreshCw, MessageCircle, ArrowUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { commentTypeLabels, commentTypeColors } from "@/lib/commentTypes";

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  onCommentsUpdate: (count: number) => void;
  currentPage: number;
  onAddToLlmContext?: (text: string) => void;
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
  onAddToLlmContext,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !storyId) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("comments").insert({
        content: newComment.trim(),
        user_id: user.id,
        story_id: storyId,
        story_position: currentPage,
        story_node: currentNode,
      }).select(`
        *,
        profile:profiles(username)
      `);

      if (error) throw error;

      if (data && data[0]) {
        setComments([data[0], ...comments]);
        setNewComment("");
        
        // Update the comment count
        onCommentsUpdate(comments.length + 1);
        
        toast({
          title: "Success",
          description: "Your comment has been added!",
        });
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !commentId) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Remove the deleted comment from the list
      const updatedComments = comments.filter((c) => c.id !== commentId);
      setComments(updatedComments);
      
      // Update the comment count
      onCommentsUpdate(updatedComments.length);
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const refreshComments = async () => {
    if (!storyId || currentPage === undefined) return;
    
    setLoading(true);
    try {
      const refreshedComments = await fetchComments(storyId, currentPage);
      setComments(refreshedComments);
      
      // Update the comment count
      onCommentsUpdate(refreshedComments.length);
      
      toast({
        title: "Refreshed",
        description: "Comments have been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing comments:", error);
      toast({
        title: "Error",
        description: "Failed to refresh comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLlmContext = (comment: Comment) => {
    if (!onAddToLlmContext) return;
    
    const commentType = comment.comment_type || 'general';
    const typeLabel = commentTypeLabels[commentType as keyof typeof commentTypeLabels] || 'Comment';
    
    const formattedComment = `Comment Type: ${typeLabel}\nUsername: ${comment.profile?.username || 'Anonymous'}\nContent: ${comment.content}`;
    
    onAddToLlmContext(formattedComment);
    
    toast({
      title: "Added to context",
      description: "Comment has been added to the LLM context",
    });
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
          onClick={refreshComments}
          disabled={loading}
          title="Refresh Comments"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {user ? (
        <div className="space-y-4">
          <Textarea
            placeholder="Add your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Add Comment"}
          </Button>
        </div>
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

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map((comment) => {
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
                      <div className="flex gap-2">
                        {onAddToLlmContext && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddToLlmContext(comment)}
                            title="Add to LLM Context"
                          >
                            <ArrowUpRight className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {user && user.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete Comment"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
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
                    
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center border rounded-md">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No comments yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsView;
