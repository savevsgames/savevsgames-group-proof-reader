
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { fetchComments, storyNodeToPageMap } from "@/lib/storyUtils";
import { CommentType, commentTypeColors, commentTypeLabels } from "@/lib/commentTypes";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Trash, Copy, Check, X } from "lucide-react";

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  onCommentsUpdate?: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  comment_type: CommentType;
  profile?: {
    username: string;
  };
}

const CommentsView: React.FC<CommentsViewProps> = ({ 
  storyId, 
  currentNode,
  onCommentsUpdate
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedType, setSelectedType] = useState<CommentType>("suggestion");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const currentPage = storyNodeToPageMap[currentNode] || 1;

  useEffect(() => {
    loadComments();
  }, [storyId, currentNode]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const commentsData = await fetchComments(storyId, currentPage);
      setComments(commentsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          story_id: storyId,
          user_id: user.id,
          content: newComment.trim(),
          story_position: currentPage,
          comment_type: selectedType
        })
        .select('*, profile:profiles(username)');

      if (error) throw error;
      
      setComments(prev => [data[0], ...prev]);
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      
      if (onCommentsUpdate) {
        onCommentsUpdate();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({
        title: "Failed to add comment",
        description: "There was an error adding your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully.",
      });
      
      if (onCommentsUpdate) {
        onCommentsUpdate();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast({
        title: "Failed to delete comment",
        description: "There was an error deleting the comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Comment copied",
        description: "The comment has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Comments for Page {currentPage}</h3>
        {loading && <span className="text-sm text-gray-500">Loading...</span>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {user ? (
          <>
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Type:</span>
                <div className="flex space-x-1">
                  {(Object.keys(commentTypeLabels) as CommentType[]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={selectedType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type)}
                      className={`px-2 py-1 ${selectedType === type ? 'bg-[#F97316]' : ''}`}
                    >
                      {commentTypeLabels[type]}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="bg-[#F97316] hover:bg-[#E86305] text-white"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                    Posting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Add Comment
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 p-4 text-center rounded-md">
            Please log in to add comments
          </div>
        )}

        <ScrollArea className="h-[300px] border rounded-md p-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No comments yet for this page.
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="p-3 rounded-md border"
                  style={{ 
                    backgroundColor: `${commentTypeColors[comment.comment_type as CommentType] || '#F8F9FA'}` 
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">
                        {comment.profile?.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(comment.created_at)}
                      </span>
                      <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-white/50">
                        {commentTypeLabels[comment.comment_type as CommentType] || 'Comment'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(comment.content)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {(user?.id === comment.user_id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default CommentsView;
