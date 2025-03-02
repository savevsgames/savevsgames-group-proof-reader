
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import CommentTypeSelector from "@/components/comments/CommentTypeSelector";
import { CommentType } from '@/types';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import { Comment } from '@/types';
import { useStoryStore } from '@/stores/storyState';
import { useToast } from '@/hooks/use-toast';

interface CommentFormProps {
  user: User | null;
  userProfile?: Profile | null;
  storyId: string;
  currentNode: string;
  currentPage: number;
  isEditing: boolean;
  editingCommentId: string | null;
  commentText: string;
  commentType: CommentType;
  onCommentTextChange: (text: string) => void;
  onCommentTypeChange: (type: CommentType) => void;
  onCancelEdit: () => void;
  onCommentsUpdate?: (count: number) => void; // Keeping for backward compatibility
  comments: Comment[];
}

const CommentForm = ({
  user,
  userProfile,
  storyId,
  currentNode,
  currentPage,
  isEditing,
  editingCommentId,
  commentText,
  commentType,
  onCommentTextChange,
  onCommentTypeChange,
  onCancelEdit,
  onCommentsUpdate,
  comments,
}: CommentFormProps) => {
  // Get store actions with object destructuring to avoid re-renders
  const addComment = useStoryStore(state => state.addComment);
  const updateComment = useStoryStore(state => state.updateComment);
  const { toast } = useToast();
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      console.error("User not logged in.");
      toast({
        title: "Error",
        description: "You must be logged in to comment.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required props to avoid runtime errors
    if (!storyId || currentPage === undefined) {
      console.error("Missing required props:", { storyId, currentPage });
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isEditing && editingCommentId) {
        await updateComment(editingCommentId, storyId, currentPage, commentText, commentType);
        onCommentTextChange('');
        onCancelEdit();
        
        toast({
          title: "Comment Updated",
          description: "Your comment has been updated successfully.",
        });
      } else {
        // Ensure we have a valid node to associate the comment with
        const nodeToUse = currentNode || 'root';
        
        await addComment(storyId, currentPage, commentText, commentType, user.id, nodeToUse);
        onCommentTextChange('');
        
        toast({
          title: "Comment Posted",
          description: "Your comment has been posted successfully.",
        });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div className="book-page-texture rounded-md p-4">
        <Textarea
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          placeholder="Share your thoughts, feedback, or questions about this page..."
          className="min-h-[100px] bg-[#FDF8EC] border-[#3A2618]/30 text-[#3A2618] font-serif"
        />
        <div className="mt-4">
          <CommentTypeSelector
            selectedCommentType={commentType}
            setSelectedCommentType={(type) => onCommentTypeChange(type as CommentType)}
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-4 gap-2">
        {isEditing && (
          <Button
            onClick={onCancelEdit}
            variant="outline"
            className="bg-[#FDF8EC] text-[#3A2618] border-[#3A2618]/30"
          >
            Cancel
          </Button>
        )}
        
        <Button 
          type="submit" 
          className="bg-[#3A2618] text-[#E8DCC4] hover:bg-[#3A2618]/80"
        >
          <Send className="mr-2 h-4 w-4" />
          {isEditing ? "Update Comment" : "Post Comment"}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
