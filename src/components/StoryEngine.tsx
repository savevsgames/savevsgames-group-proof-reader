import React, { useState, useEffect, useCallback, useRef } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchComments } from "@/lib/storyUtils";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";
import { 
  StoryEngineProps, 
  Comment,
  StoryStore,
  EqualityFn
} from "@/types";

export const StoryEngine: React.FC<StoryEngineProps> = ({ storyId }) => {
  const { user } = useAuth();
  
  // Stable references to prevent infinite update loops
  const stableStoryId = useRef(storyId);
  const updateCountRef = useRef(0);
  
  useEffect(() => {
    // Update stable ref when prop changes
    stableStoryId.current = storyId;
  }, [storyId]);
  
  // Group selectors into logical categories to minimize re-renders
  // UI state
  const uiState = useStoryStore(
    (state: StoryStore) => ({ 
      loading: state.loading,
      error: state.error 
    }),
    shallow as EqualityFn<any>
  );
  
  // Book metadata - separate selector
  const metadataState = useStoryStore(
    (state: StoryStore) => ({ 
      bookTitle: state.title,
      totalPages: state.totalPages
    }),
    shallow as EqualityFn<any>
  );
  
  // Navigation and content state - separate selector 
  const contentState = useStoryStore(
    (state: StoryStore) => ({
      currentPage: state.currentPage,
      currentText: state.currentText,
      currentChoices: state.currentChoices,
      canContinue: state.canContinue,
      canGoBack: state.canGoBack,
      currentStoryPosition: state.currentStoryPosition,
      currentNode: state.currentNode,
      nodeMappings: state.nodeMappings,
      storyData: state.storyData
    }),
    shallow as EqualityFn<any>
  );
  
  // UI state that can change frequently
  const [commentCount, setCommentCount] = useState(0);
  
  // Actions get their own selector to avoid re-renders on state changes
  const actions = useStoryStore(
    (state: StoryStore) => ({
      handleContinue: state.handleContinue,
      handleChoice: state.handleChoice,
      goBack: state.goBack,
      handleRestart: state.handleRestart,
      handlePageChange: state.handlePageChange,
      setCommentCount: state.setCommentCount
    }),
    shallow as EqualityFn<any>
  );
  
  // Log component state - limit frequency to avoid console flooding
  useEffect(() => {
    updateCountRef.current += 1;
    const updateCount = updateCountRef.current;
    
    // Only log every 5th update or important ones
    if (updateCount % 5 === 0 || metadataState.totalPages > 1) {
      console.log("[StoryEngine] Component state updated:", {
        updateCount,
        storyId,
        currentPage: contentState.currentPage,
        totalPages: metadataState.totalPages,
        currentNode: contentState.currentNode,
        mappedNodes: contentState.nodeMappings?.nodeToPage 
          ? Object.keys(contentState.nodeMappings.nodeToPage).length 
          : 0,
        hasChoices: contentState.currentChoices.length > 0,
        commentCount
      });
    }
  }, [
    storyId, 
    contentState.currentPage, 
    metadataState.totalPages, 
    contentState.currentNode, 
    contentState.nodeMappings, 
    contentState.currentChoices.length, 
    commentCount
  ]);

  // Comment state and handling
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [fetchingComments, setFetchingComments] = useState(false);

  // Creating a stable reference to updateCommentCount
  const updateCommentCount = useCallback(() => {
    if (fetchingComments) return;
    
    setFetchingComments(true);
    const currentStoryPos = contentState.currentStoryPosition;
    
    // Don't log frequently
    if (updateCountRef.current % 10 === 0) {
      console.log("[StoryEngine] Fetching comments for position:", currentStoryPos);
    }
    
    fetchComments(stableStoryId.current, currentStoryPos)
      .then(commentsData => {
        setComments(commentsData);
        setCommentCount(commentsData.length);
        // Only update store if count changed to reduce updates
        if (commentCount !== commentsData.length) {
          actions.setCommentCount(commentsData.length);
        }
      })
      .finally(() => {
        setFetchingComments(false);
      });
  }, [storyId, contentState.currentStoryPosition, fetchingComments, actions, commentCount]);

  // Only update comments when currentStoryPosition changes
  useEffect(() => {
    updateCommentCount();
  }, [contentState.currentStoryPosition, updateCommentCount]);

  // Handle comment modal open/close
  const handleCommentModalOpenChange = useCallback((open: boolean) => {
    setIsCommentModalOpen(open);
    
    if (open) {
      // Fetch comments when modal opens
      fetchComments(storyId, contentState.currentStoryPosition).then(commentsData => {
        setComments(commentsData);
      });
    } else {
      // Use setTimeout to avoid state update loops
      setTimeout(() => {
        updateCommentCount();
      }, 300);
    }
  }, [storyId, contentState.currentStoryPosition, updateCommentCount]);

  if (uiState.loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8DCC4]"></div>
        <p className="ml-4 text-[#E8DCC4]">Loading story...</p>
      </div>
    );
  }

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
        currentPage={contentState.currentPage}
        totalPages={metadataState.totalPages}
        currentText={contentState.currentText}
        currentNode={contentState.currentNode}
        canContinue={contentState.canContinue}
        choices={contentState.currentChoices}
        isEnding={!contentState.canContinue && contentState.currentChoices.length === 0}
        canGoBack={contentState.canGoBack}
        commentCount={commentCount}
        comments={comments}
        currentUser={user as User}
        storyId={storyId}
        onContinue={actions.handleContinue}
        onChoice={actions.handleChoice}
        onBack={actions.goBack}
        onRestart={actions.handleRestart}
        onOpenComments={() => setIsCommentModalOpen(true)}
        onPageChange={actions.handlePageChange}
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
};
