
import React, { useState, useEffect, useCallback, useRef } from "react";
import { CommentModal } from "./CommentModal";
import { BookLayout } from "./story/BookLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchComments } from "@/lib/storyUtils";
import { Comment } from "./comments/types";
import { User } from "@supabase/supabase-js";
import { useStoryStore } from "@/stores/storyState";

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
  const loading = useStoryStore(state => state.loading);
  const error = useStoryStore(state => state.error);
  const bookTitle = useStoryStore(state => state.title);

  // Navigation state
  const currentPage = useStoryStore(state => state.currentPage);
  const totalPages = useStoryStore(state => state.totalPages);
  const currentText = useStoryStore(state => state.currentText);
  const currentChoices = useStoryStore(state => state.currentChoices);
  const canContinue = useStoryStore(state => state.canContinue);
  const canGoBack = useStoryStore(state => state.canGoBack);
  const commentCount = useStoryStore(state => state.commentCount);

  // Current node and position state
  const currentStoryPosition = useStoryStore(state => state.currentStoryPosition);
  const currentNode = useStoryStore(state => state.currentNode);
  const nodeMappings = useStoryStore(state => state.nodeMappings);
  const storyData = useStoryStore(state => state.storyData);

  // Actions as a separate selector to avoid re-renders on state changes
  const handleContinue = useStoryStore(state => state.handleContinue);
  const handleChoice = useStoryStore(state => state.handleChoice);
  const goBack = useStoryStore(state => state.goBack);
  const handleRestart = useStoryStore(state => state.handleRestart);
  const handlePageChange = useStoryStore(state => state.handlePageChange);
  const setCommentCount = useStoryStore(state => state.setCommentCount);

  // Logging for debugging totalPages issue
  useEffect(() => {
    console.log("[StoryEngine] Component mounted with:", {
      storyId,
      currentPage,
      totalPages,
      currentNode,
      mappedNodes: nodeMappings?.nodeToPage ? Object.keys(nodeMappings.nodeToPage).length : 0,
      currentStoryPosition
    });
    
    // Check store state directly
    const storeState = useStoryStore.getState();
    console.log("[StoryEngine] Direct store state check:", {
      storeId: storeState.storyId,
      storeTitle: storeState.title,
      storeTotalPages: storeState.totalPages,
      storeNodeMappings: storeState.nodeMappings && Object.keys(storeState.nodeMappings.nodeToPage || {}).length,
      storyDataKeysCount: storeState.storyData ? Object.keys(storeState.storyData).length : 0,
      storyDataFirstNodes: storeState.storyData ? Object.keys(storeState.storyData).slice(0, 5) : []
    });

    // Add detailed logging of story data structure
    if (storeState.storyData) {
      const storyKeys = Object.keys(storeState.storyData);
      console.log(`[StoryEngine] Story data contains ${storyKeys.length} nodes`);
      
      // Log first few nodes for debugging
      const sampleSize = Math.min(5, storyKeys.length);
      storyKeys.slice(0, sampleSize).forEach(key => {
        const node = storeState.storyData?.[key];
        console.log(`[StoryEngine] Node "${key}":`, {
          hasText: !!node?.text,
          textLength: node?.text?.length || 0,
          choicesCount: node?.choices?.length || 0,
          isEnding: !!node?.isEnding
        });
      });
    }
    
    return () => {
      console.log("[StoryEngine] Component unmounting");
    };
  }, [storyId, currentPage, totalPages, currentNode, nodeMappings, currentStoryPosition, storyData]);

  // Monitor changes to totalPages
  useEffect(() => {
    console.log(`[StoryEngine] totalPages changed to: ${totalPages}`);
    
    if (totalPages === 0 && storyData) {
      console.warn("[StoryEngine] totalPages is 0 but storyData exists with node count:", 
        Object.keys(storyData).length);
      
      // Analyze story data structure to diagnose mapping issues
      const contentNodes = Object.keys(storyData).filter(key => 
        key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
      );
      
      console.log(`[StoryEngine] Content nodes available: ${contentNodes.length}`);
      console.log("[StoryEngine] First few content nodes:", contentNodes.slice(0, 5));
      
      // Check if nodes have proper structure
      const nodesWithText = contentNodes.filter(key => storyData[key]?.text);
      console.log(`[StoryEngine] Nodes with text: ${nodesWithText.length}/${contentNodes.length}`);
      
      const nodesWithChoices = contentNodes.filter(key => 
        storyData[key]?.choices && storyData[key]?.choices.length > 0);
      console.log(`[StoryEngine] Nodes with choices: ${nodesWithChoices.length}/${contentNodes.length}`);
    }
  }, [totalPages, storyData]);

  // Capture the latest store values for use in callbacks
  useEffect(() => {
    storeRef.current = {
      currentStoryPosition,
      setCommentCount
    };
    
    console.log("[StoryEngine] Updated ref with new values:", {
      currentStoryPosition
    });
  }, [currentStoryPosition, setCommentCount]);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [fetchingComments, setFetchingComments] = useState(false);

  // Creating a stable reference to updateCommentCount
  const updateCommentCount = useCallback(() => {
    if (storeRef.current && !fetchingComments) {
      setFetchingComments(true);
      const { currentStoryPosition, setCommentCount } = storeRef.current;
      
      console.log("[StoryEngine] Fetching comments for position:", currentStoryPosition);
      
      fetchComments(storyId, currentStoryPosition)
        .then(commentsData => {
          setComments(commentsData);
          // Use the stable reference to avoid closure issues
          setCommentCount(commentsData.length);
          console.log("[StoryEngine] Updated comment count:", commentsData.length);
        })
        .finally(() => {
          setFetchingComments(false);
        });
    }
  }, [storyId, fetchingComments]);

  // Only update comments when currentStoryPosition changes
  useEffect(() => {
    console.log("[StoryEngine] Story position changed:", currentStoryPosition);
    updateCommentCount();
  }, [currentStoryPosition, updateCommentCount]);

  // Handle comment modal open/close with debounce
  const handleCommentModalOpenChange = useCallback((open: boolean) => {
    setIsCommentModalOpen(open);
    
    if (open) {
      // Fetch comments when modal opens
      fetchComments(storyId, currentStoryPosition).then(commentsData => {
        setComments(commentsData);
        console.log("[StoryEngine] Loaded comments for modal:", commentsData.length);
      });
    } else {
      // Use setTimeout to avoid state update loops
      setTimeout(() => {
        updateCommentCount();
      }, 300);
    }
  }, [storyId, currentStoryPosition, updateCommentCount]);

  if (loading) {
    console.log("[StoryEngine] Rendering loading state");
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8DCC4]"></div>
        <p className="ml-4 text-[#E8DCC4]">Loading story...</p>
      </div>
    );
  }

  if (error) {
    console.log("[StoryEngine] Rendering error state:", error);
    return (
      <div className="text-center p-8 text-[#E8DCC4]">
        <h2 className="text-2xl font-bold mb-4">Error Loading Story</h2>
        <p>{error}</p>
      </div>
    );
  }

  console.log("[StoryEngine] Rendering BookLayout with:", {
    bookTitle,
    currentPage,
    totalPages,
    currentNode,
    hasChoices: currentChoices.length > 0,
    commentCount
  });

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
