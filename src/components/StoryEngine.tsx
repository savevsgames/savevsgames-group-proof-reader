
import React, { useState, useEffect, useCallback, memo } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";
import { 
  StoryEngineProps,
} from "@/types";

export const StoryEngine: React.FC<StoryEngineProps> = memo(({ storyId }) => {
  const { user } = useAuth();
  
  // Use individual selectors to properly type and prevent errors
  const loading = useStoryStore(state => state.loading);
  const error = useStoryStore(state => state.error);
  
  const bookTitle = useStoryStore(state => state.title);
  const totalPages = useStoryStore(state => state.totalPages);
  
  const currentPage = useStoryStore(state => state.currentPage);
  const canGoBack = useStoryStore(state => state.canGoBack);
  const currentNode = useStoryStore(state => state.currentNode);
  
  const currentText = useStoryStore(state => state.currentText);
  const currentChoices = useStoryStore(state => state.currentChoices);
  const canContinue = useStoryStore(state => state.canContinue);
  const currentStoryPosition = useStoryStore(state => state.currentStoryPosition);
  
  const comments = useStoryStore(state => state.comments);
  const commentCount = useStoryStore(state => state.commentCount);
  
  // Actions don't need shallow comparison as they don't change
  const handleContinue = useStoryStore(state => state.handleContinue);
  const handleChoice = useStoryStore(state => state.handleChoice);
  const goBack = useStoryStore(state => state.goBack);
  const handleRestart = useStoryStore(state => state.handleRestart);
  const handlePageChange = useStoryStore(state => state.handlePageChange);
  const fetchComments = useStoryStore(state => state.fetchComments);
  
  // This is UI-only state and should remain local
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Only load comments when modal opens to avoid unnecessary API calls
  const handleCommentModalOpenChange = useCallback((open: boolean) => {
    setIsCommentModalOpen(open);
    
    if (open && storyId && currentStoryPosition > 0) {
      // Fetch latest comments when modal opens
      fetchComments(storyId, currentStoryPosition);
    }
  }, [storyId, currentStoryPosition, fetchComments]);

  // Initialize comments when loading a new story position
  // Add proper dependency array to prevent infinite loops
  useEffect(() => {
    if (storyId && currentStoryPosition > 0) {
      // Debounce comment fetching to prevent rapid consecutive calls
      const timeoutId = setTimeout(() => {
        fetchComments(storyId, currentStoryPosition);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [storyId, currentStoryPosition, fetchComments]);
  
  // Handle adding comment to LLM context - memoize to prevent recreation
  const handleAddToLlmContext = useCallback((commentType: string, commentText: string, username: string) => {
    console.log(`Adding comment to LLM context: ${commentType}`, { text: commentText, username });
    // Implementation can be added when needed
  }, []);

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
        onBack={goBack}
        onRestart={handleRestart}
        onOpenComments={() => setIsCommentModalOpen(true)}
        onPageChange={handlePageChange}
        onAddToLlmContext={handleAddToLlmContext}
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
});

// Add display name for better debugging
StoryEngine.displayName = 'StoryEngine';
