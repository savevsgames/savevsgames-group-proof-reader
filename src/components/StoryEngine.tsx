
import React, { useState, useEffect, useCallback, memo } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";
import { 
  StoryEngineProps,
} from "@/types";

export const StoryEngine: React.FC<StoryEngineProps> = memo(({ storyId }) => {
  const { user } = useAuth();
  
  // Use specific selectors with proper typing to minimize re-renders
  const uiState = useStoryStore(
    (state) => ({
      loading: state.loading,
      error: state.error
    }),
    shallow // Use shallow comparison to prevent unnecessary renders
  );
  
  const metadataState = useStoryStore(
    (state) => ({
      bookTitle: state.title,
      totalPages: state.totalPages
    }),
    shallow
  );
  
  const navigationState = useStoryStore(
    (state) => ({
      currentPage: state.currentPage,
      canGoBack: state.canGoBack,
      currentNode: state.currentNode
    }),
    shallow
  );
  
  const contentState = useStoryStore(
    (state) => ({
      currentText: state.currentText,
      currentChoices: state.currentChoices,
      canContinue: state.canContinue,
      currentStoryPosition: state.currentStoryPosition
    }),
    shallow
  );
  
  const commentsState = useStoryStore(
    (state) => ({
      comments: state.comments,
      commentCount: state.commentCount
    }),
    shallow
  );
  
  // Actions don't need shallow comparison as they don't change
  const actions = useStoryStore((state) => ({
    handleContinue: state.handleContinue,
    handleChoice: state.handleChoice,
    goBack: state.goBack,
    handleRestart: state.handleRestart,
    handlePageChange: state.handlePageChange,
    fetchComments: state.fetchComments
  }));
  
  // This is UI-only state and should remain local
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Only load comments when modal opens to avoid unnecessary API calls
  const handleCommentModalOpenChange = useCallback((open: boolean) => {
    setIsCommentModalOpen(open);
    
    if (open && storyId && contentState.currentStoryPosition > 0) {
      // Fetch latest comments when modal opens
      actions.fetchComments(storyId, contentState.currentStoryPosition);
    }
  }, [storyId, contentState.currentStoryPosition, actions.fetchComments]);

  // Initialize comments when loading a new story position
  // Add proper dependency array to prevent infinite loops
  useEffect(() => {
    if (storyId && contentState.currentStoryPosition > 0) {
      // Debounce comment fetching to prevent rapid consecutive calls
      const timeoutId = setTimeout(() => {
        actions.fetchComments(storyId, contentState.currentStoryPosition);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [storyId, contentState.currentStoryPosition, actions.fetchComments]);
  
  // Handle adding comment to LLM context - memoize to prevent recreation
  const handleAddToLlmContext = useCallback((commentType: string, commentText: string, username: string) => {
    console.log(`Adding comment to LLM context: ${commentType}`, { text: commentText, username });
    // Implementation can be added when needed
  }, []);

  // Show loading state
  if (uiState.loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8DCC4]"></div>
        <p className="ml-4 text-[#E8DCC4]">Loading story...</p>
      </div>
    );
  }

  // Show error state
  if (uiState.error) {
    return (
      <div className="text-center p-8 text-[#E8DCC4]">
        <h2 className="text-2xl font-bold mb-4">Error Loading Story</h2>
        <p>{uiState.error}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <BookLayout
        bookTitle={metadataState.bookTitle}
        currentPage={navigationState.currentPage}
        totalPages={metadataState.totalPages}
        currentText={contentState.currentText}
        currentNode={navigationState.currentNode}
        canContinue={contentState.canContinue}
        choices={contentState.currentChoices}
        isEnding={!contentState.canContinue && contentState.currentChoices.length === 0}
        canGoBack={navigationState.canGoBack}
        commentCount={commentsState.commentCount}
        comments={commentsState.comments}
        currentUser={user as User}
        storyId={storyId}
        onContinue={actions.handleContinue}
        onChoice={actions.handleChoice}
        onBack={actions.goBack}
        onRestart={actions.handleRestart}
        onOpenComments={() => setIsCommentModalOpen(true)}
        onPageChange={actions.handlePageChange}
        onAddToLlmContext={handleAddToLlmContext}
      />

      <CommentModal
        isOpen={isCommentModalOpen}
        onOpenChange={handleCommentModalOpenChange}
        storyId={storyId}
        storyPosition={contentState.currentStoryPosition}
        currentUser={user as User}
      />
    </div>
  );
});

// Add display name for better debugging
StoryEngine.displayName = 'StoryEngine';
