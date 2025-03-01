
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CommentType } from "@/lib/commentTypes";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import CommentsList from './comments/CommentsList';
import CommentForm from './comments/CommentForm';
import { Comment, CommentModalProps } from './comments/types';

export { Comment } from './comments/types';

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
  const [isModerator, setIsModerator] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if current user is a comment moderator
  useEffect(() => {
    const checkModerator = async () => {
      if (!currentUser) {
        setIsModerator(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('comment_moderators')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
          console.error('Error checking moderator status:', error);
          setIsModerator(false);
          return;
        }
        
        setIsModerator(data !== null);
      } catch (error) {
        console.error('Exception checking moderator status:', error);
        setIsModerator(false);
      }
    };
    
    checkModerator();
  }, [currentUser]);

  // Fetch comments when the modal opens or story position changes
  useEffect(() => {
    if (isOpen && storyId && storyPosition) {
      fetchComments();
      
      // Check if there's an editing comment in sessionStorage
      const storedEditingComment = sessionStorage.getItem('editingComment');
      if (storedEditingComment) {
        const parsedComment = JSON.parse(storedEditingComment);
        setEditingComment(parsedComment);
        setCommentText(parsedComment.text);
        setSelectedCommentType(parsedComment.comment_type);
        
        // Clear the stored comment
        sessionStorage.removeItem('editingComment');
      }
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
        let query = supabase
          .from('comments')
          .update({ 
            text: commentText,
            comment_type: selectedCommentType
          })
          .eq('id', editingComment.id);
          
        // Only apply user_id filter if not a moderator
        if (!isModerator) {
          query = query.eq('user_id', currentUser.id);
        }
        
        const { error } = await query;

        if (error) throw error;

        toast({
          title: "Comment Updated",
          description: "The comment has been updated successfully.",
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
      
      // Close the modal after successful submission
      setTimeout(() => {
        onOpenChange(false);
        // Refresh the page to show updated comments
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save comment. Please try again.",
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

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
    setSelectedCommentType(comment.comment_type);
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
            <div className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              {editingComment ? "Edit Comment" : "Add Comment"}
              
              {isModerator && (
                <div className="flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full ml-2">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Moderator
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-[#3A2618]/70 font-serif">
            {editingComment 
              ? (editingComment.user_id === currentUser?.id 
                  ? "Edit your comment below" 
                  : "Edit this comment (moderator mode)")
              : "Leave feedback or notes for the author about this part of the story."}
          </DialogDescription>
        </DialogHeader>

        {/* Only show comments list when not editing */}
        {!editingComment && (
          <CommentsList
            comments={comments}
            isLoading={isLoading}
            currentUser={currentUser}
            isModerator={isModerator}
            onEditComment={handleEditComment}
          />
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
          <CommentForm
            commentText={commentText}
            setCommentText={setCommentText}
            selectedCommentType={selectedCommentType}
            setSelectedCommentType={setSelectedCommentType}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            editingComment={editingComment}
            cancelEdit={cancelEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
