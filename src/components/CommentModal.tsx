
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import CommentTypeSelector from './comments/CommentTypeSelector';
import CommentsList from './comments/CommentsList';
import { CommentType } from '@/lib/commentTypes';
import { CommentModalProps } from './comments/types';

// Use export type for re-export to fix TS1205 error
export type { Comment } from './comments/types';

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onOpenChange,
  storyId,
  storyPosition,
  currentUser,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCommentType, setSelectedCommentType] = useState<CommentType>('edit');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const { toast } = useToast();
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (isOpen && storyId && storyPosition !== undefined) {
      fetchComments();
    }
    // Reset form when modal opens/closes
    if (!isOpen) {
      setCommentText('');
      setEditingComment(null);
      setSelectedCommentType('edit');
    }
  }, [isOpen, storyId, storyPosition]);

  useEffect(() => {
    // Check if current user is a moderator
    const checkModerator = async () => {
      if (!currentUser) {
        setIsModerator(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_comment_moderator', { user_id: currentUser.id });

        if (error) {
          console.error('Error checking moderator status:', error);
          setIsModerator(false);
        } else {
          setIsModerator(data || false);
        }
      } catch (error) {
        console.error('Failed to check moderator status:', error);
        setIsModerator(false);
      }
    };

    checkModerator();
  }, [currentUser]);

  useEffect(() => {
    // If editing a comment, populate the form with its values
    if (editingComment) {
      setCommentText(editingComment.text);
      setSelectedCommentType(editingComment.comment_type);
    }
  }, [editingComment]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
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
        variant: 'destructive',
        title: 'Error fetching comments',
        description: 'Failed to load comments. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Comment cannot be empty',
        description: 'Please enter a comment before submitting.',
      });
      return;
    }

    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to post comments.',
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
          .eq('user_id', currentUser.id); // Ensure user can only edit their own comments

        if (error) {
          throw error;
        }

        toast({
          title: 'Comment updated',
          description: 'Your comment has been updated successfully.',
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
            comment_type: selectedCommentType,
          });

        if (error) {
          throw error;
        }

        toast({
          title: 'Comment added',
          description: 'Your comment has been added successfully.',
        });
      }

      // Reset form and refresh comments
      setCommentText('');
      setEditingComment(null);
      setSelectedCommentType('edit');
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to submit comment',
        description: 'An error occurred while submitting your comment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentEdit = (comment: Comment) => {
    setEditingComment(comment);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
    setSelectedCommentType('edit');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#E8DCC4]">
        <DialogHeader>
          <DialogTitle className="text-[#3A2618] text-xl">
            Comments for Page {storyPosition}
          </DialogTitle>
        </DialogHeader>

        {currentUser ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Share your feedback, suggestions, or corrections..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px] bg-white border-[#3A2618]/20 text-[#3A2618]"
            />

            <CommentTypeSelector
              selectedCommentType={selectedCommentType}
              setSelectedCommentType={setSelectedCommentType}
            />

            <div className="flex justify-end space-x-2">
              {editingComment && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  className="border-[#3A2618]/30 text-[#3A2618]"
                >
                  Cancel Edit
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#3A2618] text-white hover:bg-[#3A2618]/80"
              >
                {isSubmitting ? 'Submitting...' : editingComment ? 'Update Comment' : 'Post Comment'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-4 rounded text-center text-[#3A2618]/70">
            Please sign in to leave a comment.
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-[#3A2618] font-medium mb-4">All Comments</h3>
          <CommentsList 
            comments={comments} 
            isLoading={isLoading} 
            currentUser={currentUser}
            isModerator={isModerator}
            onEditComment={handleCommentEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
