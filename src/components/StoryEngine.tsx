
import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";
import { 
  StoryEngineProps,
} from "@/types";
import { shallow } from "zustand/shallow";

export const StoryEngine: React.FC<StoryEngineProps> = memo(({ storyId }) => {
  const { user } = useAuth();
  
  // Use individual selectors with proper memoization and shallow comparison
  // Group related state to reduce re-renders
  const { loading, error } = useStoryStore(state => ({
    loading: state.loading,
    error: state.error,
  }), shallow);
  
  const { bookTitle, totalPages } = useStoryStore(state => ({ 
    bookTitle: state.title,
    totalPages: state.totalPages 
  }), shallow);
  
  const { currentPage, canGoBack, currentNode } = useStoryStore(state => ({ 
    currentPage: state.currentPage,
    canGoBack: state.canGoBack,
    currentNode: state.currentNode
  }), shallow);
  
  const { currentText, currentChoices, canContinue, currentStoryPosition } = useStoryStore(state => ({
    currentText: state.currentText,
    currentChoices: state.currentChoices,
    canContinue: state.canContinue,
    currentStoryPosition: state.currentStoryPosition
  }), shallow);
  
  const { comments, commentCount } = useStoryStore(state => ({
    comments: state.comments,
    commentCount: state.commentCount
  }), shallow);
  
  // Get action functions - these don't need to be part of dependency arrays
  const {
    handleContinue,
    handleChoice,
    goBack,
    handleRestart,
    handlePageChange,
    fetchComments
  } = useStoryStore();
  
  // This is UI-only state and should remain local
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  
  // Track initialization to prevent multiple calls
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the story - this will only run once per storyId
  useEffect(() => {
    if (!isInitialized && storyId) {
      const initStory = async () => {
        console.log("[StoryEngine] Initializing story:", storyId);
        await useStoryStore.getState().initializeStory(storyId);
        setIsInitialized(true);
      };
      
      initStory();
    }
  }, [storyId, isInitialized]);

  // Reset initialization state when storyId changes
  useEffect(() => {
    return () => {
      if (storyId) setIsInitialized(false);
    };
  }, [storyId]);

  // Only load comments when modal opens to avoid unnecessary API calls
  const handleCommentModalOpenChange = useCallback((open: boolean) => {
    setIsCommentModalOpen(open);
    
    if (open && storyId && currentStoryPosition > 0) {
      // Fetch latest comments when modal opens
      fetchComments(storyId, currentStoryPosition);
    }
  }, [storyId, currentStoryPosition, fetchComments]);

  // Add a debounce mechanism for comment fetching to prevent rapid render cycles
  useEffect(() => {
    if (!storyId || currentStoryPosition <= 0 || !isCommentModalOpen) return;

    // Use debounce to prevent rapid consecutive calls
    const timeoutId = setTimeout(() => {
      fetchComments(storyId, currentStoryPosition);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [storyId, currentStoryPosition, fetchComments, isCommentModalOpen]);
  
  // Memoize this callback to prevent recreation
  const handleAddToLlmContext = useCallback((commentType: string, commentText: string, username: string) => {
    console.log(`Adding comment to LLM context: ${commentType}`, { text: commentText, username });
    // Implementation can be added when needed
  }, []);

  // Memoize book layout props to prevent unnecessary re-renders
  const bookLayoutProps = useMemo(() => ({
    bookTitle,
    currentPage,
    totalPages,
    currentText,
    currentNode,
    canContinue,
    choices: currentChoices,
    isEnding: !canContinue && currentChoices.length === 0,
    canGoBack,
    commentCount,
    comments,
    currentUser: user as User,
    storyId,
    onContinue: handleContinue,
    onChoice: handleChoice,
    onBack: goBack,
    onRestart: handleRestart,
    onOpenComments: () => setIsCommentModalOpen(true),
    onPageChange: handlePageChange,
    onAddToLlmContext: handleAddToLlmContext
  }), [
    bookTitle, currentPage, totalPages, currentText, currentNode,
    canContinue, currentChoices, canGoBack, commentCount, comments,
    user, storyId, handleContinue, handleChoice, goBack, handleRestart,
    handlePageChange, handleAddToLlmContext
  ]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8DCC4]"></div>
        <p className="ml-4 text-[#E8DCC4]">Loading story...</p>
      </div>
    );
  }

  // Show error state
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
      <BookLayout {...bookLayoutProps} />

      <CommentModal
        isOpen={isCommentModalOpen}
        onOpenChange={handleCommentModalOpenChange}
        storyId={storyId}
        storyPosition={currentStoryPosition}
        currentUser={user as User}
      />
    </div>
  );
});

// Add display name for better debugging
StoryEngine.displayName = 'StoryEngine';
