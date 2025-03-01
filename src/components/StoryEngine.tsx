
import React, { useState, useEffect, useCallback, useRef } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchComments } from "@/lib/storyUtils";
import { Comment } from "./comments/types";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";

interface StoryEngineProps {
  storyId: string;
}

export const StoryEngine: React.FC<StoryEngineProps> = ({ storyId }) => {
  const { user } = useAuth();
  
  // Stable references to prevent infinite update loops
  const stableStoryId = useRef(storyId);
  const updateCountRef = useRef(0);
  
  useEffect(() => {
    // Update stable ref when prop changes
    stableStoryId.current = storyId;
  }, [storyId]);
  
  // Split selectors into logical groups to minimize re-renders
  // UI state
  const { loading, error } = useStoryStore(
    state => ({ 
      loading: state.loading,
      error: state.error 
    }),
    shallow
  );
  
  // Book metadata
  const { bookTitle, totalPages } = useStoryStore(
    state => ({ 
      bookTitle: state.title,
      totalPages: state.totalPages
    }),
    shallow
  );
  
  // Navigation state 
  const { 
    currentPage,
    currentText,
    currentChoices,
    canContinue,
    canGoBack,
    currentStoryPosition
  } = useStoryStore(
    state => ({
      currentPage: state.currentPage,
      currentText: state.currentText,
      currentChoices: state.currentChoices,
      canContinue: state.canContinue,
      canGoBack: state.canGoBack,
      currentStoryPosition: state.currentStoryPosition
    }),
    shallow
  );
  
  // Current node state
  const { currentNode, nodeMappings, storyData } = useStoryStore(
    state => ({
      currentNode: state.currentNode,
      nodeMappings: state.nodeMappings,
      storyData: state.storyData
    }),
    shallow
  );
  
  // UI state that can change frequently
  const [commentCount, setCommentCount] = useState(0);
  
  // Actions get their own selector to avoid re-renders on state changes
  const actions = useStoryStore(
    state => ({
      handleContinue: state.handleContinue,
      handleChoice: state.handleChoice,
      goBack: state.goBack,
      handleRestart: state.handleRestart,
      handlePageChange: state.handlePageChange,
      setCommentCount: state.setCommentCount
    }),
    shallow
  );
  
  // Log component state - limit frequency to avoid console flooding
  useEffect(() => {
    updateCountRef.current += 1;
    const updateCount = updateCountRef.current;
    
    // Only log every 5th update or important ones
    if (updateCount % 5 === 0 || totalPages > 1) {
      console.log("[StoryEngine] Component state updated:", {
        updateCount,
        storyId,
        currentPage,
        totalPages,
        currentNode,
        mappedNodes: nodeMappings?.nodeToPage ? Object.keys(nodeMappings.nodeToPage).length : 0,
        hasChoices: currentChoices.length > 0,
        commentCount
      });
    }
  }, [storyId, currentPage, totalPages, currentNode, nodeMappings, currentChoices.length, commentCount]);

  // Comment state and handling
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [fetchingComments, setFetchingComments] = useState(false);

  // Creating a stable reference to updateCommentCount
  const updateCommentCount = useCallback(() => {
    if (fetchingComments) return;
    
    setFetchingComments(true);
    const currentStoryPos = currentStoryPosition;
    
    // Don't log frequently
    if (updateCountRef.current % 10 === 0) {
      console.log("[StoryEngine] Fetching comments for position:", currentStoryPos);
    }
    
    fetchComments(stableStoryId.current, currentStoryPos)
      .then(commentsData => {
        setComments(commentsData);
        setCommentCount(commentsData.length);
        actions.setCommentCount(commentsData.length);
      })
      .finally(() => {
        setFetchingComments(false);
      });
  }, [storyId, currentStoryPosition, fetchingComments, actions]);

  // Only update comments when currentStoryPosition changes
  useEffect(() => {
    updateCommentCount();
  }, [currentStoryPosition, updateCommentCount]);

  // Handle comment modal open/close
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
        storyPosition={currentStoryPosition}
        currentUser={user as User}
      />
    </div>
  );
};
