
import React from 'react';
import { useParams } from 'react-router-dom';
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentType } from '@/lib/commentTypes';
import CommentForm from './comments/CommentForm';
import CommentSection from './comments/CommentSection';
import { useComments } from './comments/useComments';

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  onCommentsUpdate: (count: number) => void;
  onAddToLlmContext?: (text: string) => void;
}

const CommentsView = ({ 
  storyId, 
  currentNode, 
  currentPage, 
  onCommentsUpdate, 
  onAddToLlmContext 
}: CommentsViewProps) => {
  const { bookId } = useParams();
  const {
    comments,
    commentText,
    commentType,
    isEditing,
    editingCommentId,
    user,
    setCommentText,
    setCommentType,
    handleEditComment,
    handleCancelEdit,
    deleteComment
  } = useComments(storyId, currentPage, onCommentsUpdate);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-serif mb-4 text-[#3A2618]">Reader Comments</h2>
      
      {user ? (
        <CommentForm
          user={user}
          storyId={storyId}
          currentNode={currentNode}
          currentPage={currentPage}
          isEditing={isEditing}
          editingCommentId={editingCommentId}
          commentText={commentText}
          commentType={commentType as CommentType}
          onCommentTextChange={setCommentText}
          onCommentTypeChange={setCommentType}
          onCancelEdit={handleCancelEdit}
          onCommentsUpdate={onCommentsUpdate}
          comments={comments}
        />
      ) : null}
      
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <CommentSection
          user={user}
          comments={comments}
          onEditComment={handleEditComment}
          onDeleteComment={deleteComment}
          onAddToLlmContext={onAddToLlmContext}
        />
      </ScrollArea>
    </div>
  );
};

export default CommentsView;
