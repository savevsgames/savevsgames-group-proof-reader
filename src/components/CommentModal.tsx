
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CommentType, commentTypeColors, commentTypeLabels } from "@/lib/commentTypes";
import { User } from "@/lib/supabase";
import { useNavigate } from 'react-router-dom';

export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  story_position: number; // Changed to number
  text: string;
  comment_type: CommentType;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
  };
}

interface CommentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyPosition: number; // Changed to number
  currentUser: User | null;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onOpenChange,
  storyId,
  storyPosition,
  currentUser,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCommentType, setSelectedCommentType] = useState<CommentType>('edit');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch comments when the modal opens or story position changes
  useEffect(() => {
    if (isOpen && storyId && storyPosition) {
      fetchComments();
    }
  }, [isOpen, storyId, storyPosition]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Updated query to join with profiles table to get usernames
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(username)
        `)
        .eq('story_id', storyId)
        .eq('story_position', storyPosition)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Failed to load comments",
        description: "There was an error loading the comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      toast({
        title: "Comment cannot be empty",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add comments.",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingComment) {
        // Update existing comment
        const { error } = await supabase
          .from('comments')
          .update({ 
            text: commentText,
            comment_type: selectedCommentType
          })
          .eq('id', editingComment.id)
          .eq('user_id', currentUser.id); // Ensure only the owner can update

        if (error) throw error;

        toast({
          title: "Comment Updated",
          description: "Your comment has been updated successfully.",
        });
      } else {
        // Create new comment
        const { error } = await supabase
          .from('comments')
          .insert({
            user_id: currentUser.id,
            story_id: storyId,
            story_position: storyPosition,
            text: commentText,
            comment_type: selectedCommentType
          });

        if (error) throw error;

        toast({
          title: "Comment Added",
          description: "Your comment has been saved successfully.",
        });
      }

      // Reset form and refresh comments
      setCommentText('');
      setSelectedCommentType('edit');
      setEditingComment(null);
      fetchComments();
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        title: "Failed to save comment",
        description: "There was an error saving your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    if (comment.user_id !== currentUser?.id) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own comments.",
        variant: "destructive",
      });
      return;
    }

    setEditingComment(comment);
    setCommentText(comment.text);
    setSelectedCommentType(comment.comment_type);
  };

  const handleDelete = async (comment: Comment) => {
    if (comment.user_id !== currentUser?.id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own comments.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', currentUser.id); // Ensure only the owner can delete

      if (error) throw error;

      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted successfully.",
      });
      
      // Reset form if deleting the comment being edited
      if (editingComment?.id === comment.id) {
        setCommentText('');
        setSelectedCommentType('edit');
        setEditingComment(null);
      }
      
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Failed to delete comment",
        description: "There was an error deleting your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
    setSelectedCommentType('edit');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if a comment is owned by current user
  const isOwnComment = (comment: Comment) => {
    return currentUser && comment.user_id === currentUser.id;
  };

  // Display either username or "Anonymous" based on ownership and available data
  const getDisplayName = (comment: Comment) => {
    if (isOwnComment(comment)) {
      return "You";
    }
    
    // Return the username from the profile if available, otherwise show "Anonymous"
    return comment.profile?.username || "Anonymous";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        // Reset form when modal closes
        setEditingComment(null);
        setCommentText('');
        setSelectedCommentType('edit');
      }
    }}>
      <DialogContent className="bg-[#E8DCC4] text-[#3A2618] border-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#3A2618] font-serif text-xl flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Comments
          </DialogTitle>
          <DialogDescription className="text-[#3A2618]/70 font-serif">
            {editingComment 
              ? "Edit your comment" 
              : "Leave feedback or notes for the author about this part of the story."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A2618] mx-auto"></div>
            <p className="mt-2 text-[#3A2618]/70">Loading comments...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {!editingComment && (
              <div className="max-h-[300px] overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-[#3A2618]/60 italic">
                    No comments yet. Be the first to leave feedback!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className="p-4 rounded-md border border-[#3A2618]/20 relative"
                        style={{ backgroundColor: `${commentTypeColors[comment.comment_type]}20` }}
                      >
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {currentUser && comment.user_id === currentUser.id && (
                            <>
                              <button 
                                onClick={() => handleEdit(comment)}
                                className="text-[#3A2618]/60 hover:text-[#3A2618] transition-colors p-1"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(comment)}
                                className="text-[#3A2618]/60 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                        
                        <div 
                          className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                          style={{ 
                            backgroundColor: commentTypeColors[comment.comment_type],
                            color: ['suggestion', 'spelling'].includes(comment.comment_type) ? '#3A2618' : 'white'
                          }}
                        >
                          {commentTypeLabels[comment.comment_type]}
                        </div>
                        
                        <p className="text-[#3A2618] mb-2">{comment.text}</p>
                        
                        <div className="flex justify-between items-center text-[#3A2618]/60 text-xs">
                          <span>{getDisplayName(comment)}</span>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {(!currentUser && !editingComment) ? (
              <div className="bg-[#3A2618]/10 p-4 rounded-md text-center">
                <p className="text-[#3A2618] mb-2">Please sign in to add comments</p>
                <Button 
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/auth');
                  }}
                  className="bg-[#F97316] hover:bg-[#E86305] text-[#E8DCC4]"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3A2618] mb-1">
                    Comment Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(commentTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedCommentType(type as CommentType)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCommentType === type ? 'ring-2 ring-[#3A2618]' : ''
                        }`}
                        style={{ 
                          backgroundColor: commentTypeColors[type as CommentType],
                          color: ['suggestion', 'spelling'].includes(type as CommentType) ? '#3A2618' : 'white'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#3A2618] mb-1">
                    Your Comment
                  </label>
                  <Textarea
                    placeholder="Add your comment or feedback here..."
                    className="bg-white border-[#3A2618]/20 text-[#3A2618] min-h-[100px]"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>

                <DialogFooter className="flex sm:justify-between">
                  {editingComment && (
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      className="border-[#3A2618]/20 text-[#3A2618]"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-[#F97316] hover:bg-[#E86305] text-[#E8DCC4] ml-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {editingComment ? "Update Comment" : "Submit Comment"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
