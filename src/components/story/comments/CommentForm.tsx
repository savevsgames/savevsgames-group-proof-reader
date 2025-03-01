
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import CommentTypeSelector from "@/components/comments/CommentTypeSelector";
import { CommentType } from '@/lib/commentTypes';
import { User } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

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
  onCommentsUpdate: (count: number) => void;
  comments: any[];
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
  
  const postComment = async (text: string, type: CommentType) => {
    if (!user) {
      console.error("User not logged in.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          story_id: storyId,
          story_position: currentPage,
          story_position_old: String(currentPage), // Add the required field
          story_node: currentNode,
          text: text,
          comment_type: type,
          user_id: user.id
        }])
        .select('*')
        .single();

      if (error) {
        console.error("Error posting comment:", error);
      } else if (data) {
        onCommentTextChange('');
        onCommentsUpdate(comments.length + 1);
      }
    } catch (error) {
      console.error("Unexpected error posting comment:", error);
    }
  };

  const updateComment = async (commentId: string, text: string, type: CommentType) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          text: text, 
          comment_type: type,
          // Don't update story_node or story_position when editing
        })
        .eq('id', commentId)
        .select('*')
        .single();
  
      if (error) {
        console.error("Error updating comment:", error);
      } else if (data) {
        onCommentTextChange('');
        onCancelEdit();
      }
    } catch (error) {
      console.error("Unexpected error updating comment:", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isEditing && editingCommentId) {
      await updateComment(editingCommentId, commentText, commentType);
    } else {
      await postComment(commentText, commentType);
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
