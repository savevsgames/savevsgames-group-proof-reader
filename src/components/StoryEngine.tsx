
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStory } from '@/hooks/useStory';
import { CommentModal } from './CommentModal';
import { BookLayout } from './story/BookLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fetchComments } from '@/lib/storyUtils';
import { Comment } from './comments/types';

export const StoryEngine: React.FC = () => {
  const { id: storyId } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const {
    isLoading,
    error,
    bookTitle,
    currentPage,
    totalPages,
    currentText,
    currentChoices,
    canContinue,
    canGoBack,
    commentCount,
    currentStoryPosition,
    currentNode,
    handleContinue,
    handleChoice,
    handleBack,
    handleRestart,
    handlePageChange,
    updateCommentCount,
  } = useStory(storyId || '');

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  // Fetch comments for current story position
  useEffect(() => {
    const getComments = async () => {
      if (storyId && currentStoryPosition !== undefined) {
        try {
          const commentsData = await fetchComments(storyId, currentStoryPosition);
          setComments(commentsData);
          // Update the comment count based on fetched comments
          if (updateCommentCount) {
            updateCommentCount(commentsData.length);
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      }
    };
    
    getComments();
  }, [storyId, currentStoryPosition, updateCommentCount]);

  // Refresh comments when modal closes
  const handleCommentModalOpenChange = (open: boolean) => {
    setIsCommentModalOpen(open);
    if (!open) {
      // Slightly delayed refresh to allow for any new comments to be saved
      setTimeout(() => {
        if (storyId && currentStoryPosition !== undefined) {
          fetchComments(storyId, currentStoryPosition).then(commentsData => {
            setComments(commentsData);
            if (updateCommentCount) {
              updateCommentCount(commentsData.length);
            }
          });
        }
      }, 300);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8DCC4]"></div>
        <p className="ml-4 text-[#E8DCC4]">Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-[#E8DCC4]">
        <h2 className="text-2xl font-bold mb-4">Error Loading Story</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <BookLayout
        bookTitle={bookTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        currentText={currentText}
        currentNode={currentNode || 'root'}
        canContinue={canContinue}
        choices={currentChoices}
        isEnding={!canContinue && currentChoices.length === 0}
        canGoBack={canGoBack}
        commentCount={commentCount}
        comments={comments}
        currentUser={user}
        storyId={storyId || ''}
        onContinue={handleContinue}
        onChoice={handleChoice}
        onBack={handleBack}
        onRestart={handleRestart}
        onOpenComments={() => setIsCommentModalOpen(true)}
        onPageChange={handlePageChange}
      />

      <CommentModal
        isOpen={isCommentModalOpen}
        onOpenChange={handleCommentModalOpenChange}
        storyId={storyId || ''}
        storyPosition={currentStoryPosition}
        currentUser={user}
      />
    </div>
  );
};
