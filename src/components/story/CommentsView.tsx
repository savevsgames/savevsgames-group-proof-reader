
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentType } from '@/lib/commentTypes';
import CommentForm from './comments/CommentForm';
import CommentSection from './comments/CommentSection';
import { useStoryStore } from '@/stores/storyState';
import { Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { shallow } from 'zustand/shallow';

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  onCommentsUpdate?: (count: number) => void;
  onAddToLlmContext?: (commentType: string, commentText: string, username: string) => void;
}

const CommentsView = ({ 
  storyId, 
  currentNode, 
  currentPage,
  onCommentsUpdate,
  onAddToLlmContext 
}: CommentsViewProps) => {
  const { bookId } = useParams();
  const { user } = useAuth();
  
  // Use store selectors for comments state with shallow comparison
  const { comments, commentCount, isLoading } = useStoryStore(state => ({
    comments: state.comments,
    commentCount: state.commentCount,
    isLoading: state.commentsLoading
  }), shallow);
  
  // Use store actions for comments operations
  const fetchComments = useStoryStore(state => state.fetchComments);
  
  // Local UI state for the comment form
  const [commentText, setCommentText] = React.useState('');
  const [commentType, setCommentType] = React.useState<CommentType>('general');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  
  // Fetch comments when page or node changes
  useEffect(() => {
    if (storyId && currentPage > 0) {
      console.log(`[CommentsView] Fetching comments for page ${currentPage}, node: ${currentNode}`);
      fetchComments(storyId, currentPage);
    }
  }, [storyId, currentPage, currentNode, fetchComments]);
  
  // Notify parent component when comment count changes
  useEffect(() => {
    if (onCommentsUpdate) {
      onCommentsUpdate(commentCount);
    }
  }, [commentCount, onCommentsUpdate]);
  
  // Comment editing handlers
  const handleEditComment = (comment: Comment) => {
    setIsEditing(true);
    setEditingCommentId(comment.id);
    setCommentText(comment.text);
    setCommentType(comment.comment_type as CommentType || 'general');
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCommentId(null);
    setCommentText('');
    setCommentType('general');
  };
  
  // Comment delete handler
  const handleDeleteComment = (commentId: string) => {
    useStoryStore.getState().deleteComment(commentId, storyId, currentPage);
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-serif mb-4 text-[#3A2618] flex-shrink-0">Reader Comments</h2>
      
      <ScrollArea className="flex-grow overflow-y-auto pr-1">
        <div className="flex flex-col pb-4">
          {user ? (
            <CommentForm
              user={user}
              storyId={storyId}
              currentNode={currentNode}
              currentPage={currentPage}
              isEditing={isEditing}
              editingCommentId={editingCommentId}
              commentText={commentText}
              commentType={commentType}
              onCommentTextChange={setCommentText}
              onCommentTypeChange={setCommentType}
              onCancelEdit={handleCancelEdit}
              onCommentsUpdate={() => {}} // No longer needed as store handles updates
              comments={comments}
            />
          ) : null}
          
          <CommentSection
            user={user}
            comments={comments}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onAddToLlmContext={onAddToLlmContext}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommentsView;
