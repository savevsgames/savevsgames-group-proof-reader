
import React, { useState, useEffect, useCallback, useRef } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchComments } from "@/lib/storyUtils";
import { Comment } from "./comments/types";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";
import { StoryStore } from "@/stores/storyState/types";

interface StoryEngineProps {
  storyId: string;
}

export const StoryEngine: React.FC<StoryEngineProps> = ({ storyId }) => {
  const { user } = useAuth();
  const storeRef = useRef({
    currentStoryPosition: 1,
    setCommentCount: (count: number) => {}
  });
  
  // Split state into smaller, focused selectors to prevent unnecessary re-renders
  // UI state
  const {
    loading,
    error,
    title: bookTitle,
  } = useStoryStore((state: StoryStore) => ({
    loading: state.loading,
    error: state.error,
    title: state.title,
  }), shallow);

  // Navigation state
  const {
    currentPage,
    totalPages,
    currentText,
    currentChoices,
    canContinue,
    canGoBack,
    commentCount,
  } = useStoryStore((state: StoryStore) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    currentText: state.currentText,
    currentChoices: state.currentChoices,
    canContinue: state.canContinue,
    canGoBack: state.canGoBack,
    commentCount: state.commentCount,
  }), shallow);

  // Current node and position state
  const {
    currentStoryPosition,
    currentNode,
  } = useStoryStore((state: StoryStore) => ({
    currentStoryPosition: state.currentStoryPosition,
    currentNode: state.currentNode,
  }), shallow);

  // Actions as a separate selector to avoid re-renders on state changes
  const {
    handleContinue,
    handleChoice,
    goBack: handleBack,
    handleRestart,
    handlePageChange,
    setCommentCount
  } = useStoryStore((state: StoryStore) => ({
    handleContinue: state.handleContinue,
    handleChoice: state.handleChoice,
    goBack: state.goBack,
    handleRestart: state.handleRestart,
    handlePageChange: state.handlePageChange,
    setCommentCount: state.setCommentCount
  }), shallow);

  // Capture the latest store values for use in callbacks
  useEffect(() => {
    storeRef.current = {
      currentStoryPosition,
      setCommentCount
    };
  }, [currentStoryPosition, setCommentCount]);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [fetchingComments, setFetchingComments] = useState(false);

  // Creating a stable reference to updateCommentCount
  const updateCommentCount = useCallback(() => {
    if (storeRef.current && !fetchingComments) {
      setFetchingComments(true);
      const { currentStoryPosition, setCommentCount } = storeRef.current;
      
      fetchComments(storyId, currentStoryPosition)
        .then(commentsData => {
          setComments(commentsData);
          // Use the stable reference to avoid closure issues
          setCommentCount(commentsData.length);
        })
        .finally(() => {
          setFetchingComments(false);
        });
    }
  }, [storyId, fetchingComments]);

  // Only update comments when currentStoryPosition changes
  useEffect(() => {
    updateCommentCount();
  }, [currentStoryPosition, updateCommentCount]);

  // Handle comment modal open/close with debounce
  const handleCommentModalOpenChange = useCallback((open: boolean) => {
    setIsCommentModalOpen(open);
    
    if (open) {
      // Fetch comments when modal opens
      fetchComments(storyId, currentStoryPosition).then(commentsData => {
        setComments(commentsData);
      });
    } else {
      // Use setTimeout to avoid state update loops
      setTimeout(() => {
        updateCommentCount();
      }, 300);
    }
  }, [storyId, currentStoryPosition, updateCommentCount]);

  if (loading) {
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
        currentNode={currentNode}
        canContinue={canContinue}
        choices={currentChoices}
        isEnding={!canContinue && currentChoices.length === 0}
        canGoBack={canGoBack}
        commentCount={commentCount}
        comments={comments}
        currentUser={user as User}
        storyId={storyId}
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
        storyId={storyId}
        storyPosition={currentStoryPosition}
        currentUser={user as User}
      />
    </div>
  );
};
