
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryLoading } from './useStoryLoading';
import { useNavigation } from './navigation/useNavigation';

export const useStory = (storyId: string | undefined) => {
  const {
    story,
    customStory,
    usingCustomFormat,
    bookTitle,
    isLoading,
    error,
    totalPages,
    nodeMappings
  } = useStoryLoading(storyId);

  // Initialize navigation with loaded story data
  const [navigationState, navigationActions] = useNavigation({
    storyData: customStory,
    story,
    usingCustomFormat,
    storyId,
    nodeMappings,
    totalPages
  });

  // Load comment count when navigation state changes
  useEffect(() => {
    if (!isLoading && storyId) {
      navigationActions.updateCommentCount();
    }
  }, [isLoading, navigationState.currentStoryPosition, storyId, navigationActions]);

  // Destructure and return all the components of our hook
  return {
    // Story state
    story,
    customStory,
    usingCustomFormat,
    isLoading,
    error,
    bookTitle,
    totalPages,
    
    // Navigation state
    currentNode: navigationState.currentNode,
    currentPage: navigationState.currentPage,
    currentText: navigationState.currentText,
    currentChoices: navigationState.currentChoices,
    canContinue: navigationState.canContinue,
    canGoBack: navigationState.canGoBack,
    commentCount: navigationState.commentCount,
    currentStoryPosition: navigationState.currentStoryPosition,
    
    // Navigation actions
    handleContinue: navigationActions.handleContinue,
    handleChoice: navigationActions.handleChoice,
    handleBack: navigationActions.handleBack,
    handleRestart: navigationActions.handleRestart,
    handlePageChange: navigationActions.handlePageChange,
    updateCommentCount: navigationActions.updateCommentCount,
  };
};
