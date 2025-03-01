
import { useState, useCallback, useEffect } from "react";
import { fetchCommentCount } from "@/lib/storyUtils";
import { NavigationState, NavigationActions, UseStoryNavigationProps, NavigationReturn } from "./types";
import {
  initializeCustomStory,
  handleCustomChoice,
  handleCustomBack,
  restartCustomStory,
  handleCustomPageChange
} from "./customStoryNavigation";
import {
  initializeInkStory,
  handleInkContinue,
  handleInkChoice,
  handleInkBack,
  restartInkStory,
  handleInkPageChange
} from "./inkStoryNavigation";

/**
 * Hook to handle story navigation for both custom and ink formats
 */
export const useNavigation = ({
  storyData,
  story,
  usingCustomFormat,
  storyId,
  nodeMappings,
  totalPages
}: UseStoryNavigationProps): NavigationReturn => {
  // State
  const [currentNode, setCurrentNode] = useState<string>('root');
  const [currentText, setCurrentText] = useState<string>('');
  const [currentChoices, setCurrentChoices] = useState<any[]>([]);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentCount, setCommentCount] = useState(0);
  const [currentStoryPosition, setCurrentStoryPosition] = useState<number>(1);
  const [canContinue, setCanContinue] = useState(false);

  // Initialize story state
  const initializeStoryState = useCallback(() => {
    if (usingCustomFormat && storyData) {
      initializeCustomStory(storyData, setCurrentNode, setCurrentText, setCurrentChoices);
    } else if (story) {
      initializeInkStory(story, setCurrentText, setCanContinue, setCurrentChoices);
    }
  }, [usingCustomFormat, storyData, story]);

  // Initialize story when data is available
  useEffect(() => {
    if ((usingCustomFormat && storyData) || (!usingCustomFormat && story)) {
      initializeStoryState();
    }
  }, [usingCustomFormat, storyData, story, initializeStoryState]);

  // Handle continue action
  const handleContinue = async () => {
    if (!story && !storyData || !storyId) return;
    
    if (!usingCustomFormat && story) {
      // For ink stories
      const inkSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentText,
        setCanContinue,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleInkContinue(story, storyId, currentPage, totalPages, nodeMappings, inkSetters);
    } else if (usingCustomFormat && storyData && currentChoices.length === 1) {
      // For custom stories with a single choice (continue)
      const customSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentNode,
        setCurrentText,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleCustomChoice(
        currentChoices[0].nextNode,
        storyData,
        storyId,
        currentNode,
        currentPage,
        nodeMappings,
        customSetters
      );
    }
  };

  // Handle choice selection
  const handleChoice = async (index: number) => {
    if (index < 0 || index >= currentChoices.length) return;
    
    if (usingCustomFormat && storyData) {
      const choice = currentChoices[index];
      if (choice && choice.nextNode) {
        const customSetters = {
          setStoryHistory,
          setCanGoBack,
          setCurrentNode,
          setCurrentText,
          setCurrentChoices,
          setCurrentPage,
          setCurrentStoryPosition,
          setCommentCount
        };
        
        await handleCustomChoice(
          choice.nextNode,
          storyData,
          storyId,
          currentNode,
          currentPage,
          nodeMappings,
          customSetters
        );
      }
    } else if (!usingCustomFormat && story) {
      const inkSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentText,
        setCanContinue,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleInkChoice(index, story, storyId, currentPage, nodeMappings, totalPages, inkSetters);
    }
  };

  // Handle back navigation
  const handleBack = async () => {
    if (!storyId || storyHistory.length === 0) return;

    console.log("Back navigation triggered, history length:", storyHistory.length);

    if (usingCustomFormat && storyData) {
      const customSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentNode,
        setCurrentText,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleCustomBack(storyHistory, storyData, storyId, currentPage, customSetters);
    } else if (!usingCustomFormat && story) {
      const inkSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentText,
        setCanContinue,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleInkBack(story, storyHistory, storyId, currentPage, inkSetters);
    }
  };

  // Handle restart
  const handleRestart = async () => {
    if (!storyId) return;
    
    if (usingCustomFormat && storyData) {
      const customSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentPage,
        setCurrentStoryPosition,
        setCurrentNode,
        setCurrentText,
        setCurrentChoices,
        setCommentCount
      };
      
      await restartCustomStory(storyData, storyId, customSetters);
    } else if (!usingCustomFormat && story) {
      const inkSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentPage,
        setCurrentStoryPosition,
        setCurrentText,
        setCanContinue,
        setCurrentChoices,
        setCommentCount
      };
      
      await restartInkStory(story, storyId, inkSetters);
    }
  };

  // Handle page change
  const handlePageChange = async (newPage: number) => {
    if (!storyId || newPage === currentPage || newPage < 1 || newPage > totalPages) {
      console.log(`Invalid page navigation attempt: current=${currentPage}, target=${newPage}, max=${totalPages}`);
      return;
    }
    
    if (usingCustomFormat && storyData) {
      const customSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentNode,
        setCurrentText,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleCustomPageChange(
        newPage,
        currentPage,
        currentNode,
        totalPages,
        nodeMappings,
        storyData,
        storyId,
        customSetters
      );
    } else if (!usingCustomFormat && story) {
      const inkSetters = {
        setStoryHistory,
        setCanGoBack,
        setCurrentNode,
        setCurrentText,
        setCanContinue,
        setCurrentChoices,
        setCurrentPage,
        setCurrentStoryPosition,
        setCommentCount
      };
      
      await handleInkPageChange(
        newPage,
        currentPage,
        totalPages,
        nodeMappings,
        story,
        storyId,
        inkSetters
      );
    }
  };

  // Update comment count
  const updateCommentCount = async () => {
    if (!storyId) return;
    const count = await fetchCommentCount(storyId, currentStoryPosition);
    setCommentCount(count);
  };

  // Navigation state
  const navigationState: NavigationState = {
    currentNode,
    currentPage,
    currentText,
    currentChoices,
    canContinue,
    canGoBack,
    commentCount,
    currentStoryPosition,
    storyHistory
  };

  // Navigation actions
  const navigationActions: NavigationActions = {
    handleContinue,
    handleChoice,
    handleBack,
    handleRestart,
    handlePageChange,
    updateCommentCount
  };

  return [navigationState, navigationActions];
};
