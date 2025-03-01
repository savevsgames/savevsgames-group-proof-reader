
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import CommentTypeSelector from "@/components/comments/CommentTypeSelector";
import { CommentType } from '@/lib/commentTypes';
import { User } from '@supabase/supabase-js';
import { Comment } from '@/types/features/comments.types';
import { useStoryStore } from '@/stores/storyState';

interface CommentFormProps {
  user: User | null;
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
  onCommentsUpdate: (count: number) => void; // Keeping for backward compatibility
  comments: Comment[];
}

const CommentForm = ({
  user,
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
  // Get store actions
  const { addComment, updateComment } = useStoryStore(state => ({
    addComment: state.addComment,
    updateComment: state.updateComment
  }));
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      console.error("User not logged in.");
      return;
    }
    
    if (isEditing && editingCommentId) {
      await updateComment(editingCommentId, storyId, currentPage, commentText, commentType);
      onCommentTextChange('');
      onCancelEdit();
    } else {
      await addComment(storyId, currentPage, commentText, commentType, user.id, currentNode);
      onCommentTextChange('');
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
