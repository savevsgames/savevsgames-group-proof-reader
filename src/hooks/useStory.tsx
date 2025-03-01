
import { useEffect } from "react";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";

export const useStory = (storyId: string | undefined) => {
  // Get state and actions from the store
  const {
    initializeStory,
    loading,
    setCommentCount,
    commentCount
  } = useStoryStore(state => ({
    // Story state
    story: state.story,
    storyData: state.storyData,
    usingCustomFormat: state.usingCustomFormat,
    loading: state.loading,
    error: state.error,
    title: state.title,
    totalPages: state.totalPages,
    
    // Navigation state
    currentNode: state.currentNode,
    currentPage: state.currentPage,
    currentText: state.currentText,
    currentChoices: state.currentChoices,
    canContinue: state.canContinue,
    canGoBack: state.canGoBack,
    commentCount: state.commentCount,
    currentStoryPosition: state.currentStoryPosition,
    
    // Actions
    initializeStory: state.initializeStory,
    setCommentCount: state.setCommentCount,
    handleContinue: state.handleContinue,
    handleChoice: state.handleChoice,
    handleBack: state.goBack,
    handleRestart: state.handleRestart,
    handlePageChange: state.handlePageChange,
  }), shallow);
  
  // Create updateCommentCount function
  const updateCommentCount = () => {
    if (storyId) {
      setCommentCount(commentCount);
    }
  };
  
  // Initialize story when the component mounts
  useEffect(() => {
    if (storyId) {
      initializeStory(storyId);
    }
  }, [storyId, initializeStory]);
  
  // Load comment count when navigation state changes
  useEffect(() => {
    if (!loading && storyId) {
      updateCommentCount();
    }
  }, [loading, storyId, updateCommentCount]);
  
  // Return all the state and actions from the store
  return useStoryStore(state => ({
    // Story state
    story: state.story,
    customStory: state.storyData,
    usingCustomFormat: state.usingCustomFormat,
    isLoading: state.loading,
    error: state.error,
    bookTitle: state.title,
    totalPages: state.totalPages,
    
    // Navigation state
    currentNode: state.currentNode,
    currentPage: state.currentPage,
    currentText: state.currentText,
    currentChoices: state.currentChoices,
    canContinue: state.canContinue,
    canGoBack: state.canGoBack,
    commentCount: state.commentCount,
    currentStoryPosition: state.currentStoryPosition,
    
    // Navigation actions
    handleContinue: state.handleContinue,
    handleChoice: state.handleChoice,
    handleBack: state.goBack,
    handleRestart: state.handleRestart,
    handlePageChange: state.handlePageChange,
    // Add updateCommentCount function
    updateCommentCount: () => {
      if (storyId) {
        state.setCommentCount(state.commentCount);
      }
    },
  }), shallow);
};
