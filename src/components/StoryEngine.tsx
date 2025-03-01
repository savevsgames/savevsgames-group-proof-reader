
import React, { useState, useEffect } from "react";
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
  
  // Get state from our global store with proper type checking
  const {
    loading,
    error,
    title: bookTitle,
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
    goBack: handleBack,
    handleRestart,
    handlePageChange,
    setCommentCount
  } = useStoryStore((state: StoryStore) => ({
    loading: state.loading,
    error: state.error,
    title: state.title,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    currentText: state.currentText,
    currentChoices: state.currentChoices,
    canContinue: state.canContinue,
    canGoBack: state.canGoBack,
    commentCount: state.commentCount,
    currentStoryPosition: state.currentStoryPosition,
    currentNode: state.currentNode,
    handleContinue: state.handleContinue,
    handleChoice: state.handleChoice,
    goBack: state.goBack,
    handleRestart: state.handleRestart,
    handlePageChange: state.handlePageChange,
    setCommentCount: state.setCommentCount
  }), shallow);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  // Creating a self-contained function to update comments
  const updateCommentCount = React.useCallback(() => {
    if (storyId) {
      fetchComments(storyId, currentStoryPosition).then(commentsData => {
        setComments(commentsData);
        setCommentCount(commentsData.length);
      });
    }
  }, [storyId, currentStoryPosition, setCommentCount]);

  // Load comments when modal opens
  const handleCommentModalOpenChange = (open: boolean) => {
    setIsCommentModalOpen(open);
    if (open) {
      // Fetch comments when modal opens
      fetchComments(storyId, currentStoryPosition).then(commentsData => {
        setComments(commentsData);
      });
    } else {
      // Refresh comment count when modal closes
      setTimeout(() => {
        updateCommentCount();
      }, 300);
    }
  };

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
