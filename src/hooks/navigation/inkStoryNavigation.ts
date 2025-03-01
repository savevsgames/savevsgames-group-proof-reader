
import { Story } from "inkjs";
import { fetchCommentCount } from "@/lib/storyUtils";

/**
 * Initialize an ink story
 */
export const initializeInkStory = (
  story: Story,
  setCurrentText: (text: string) => void,
  setCanContinue: (canContinue: boolean) => void,
  setCurrentChoices: (choices: any[]) => void
): void => {
  if (story.canContinue) {
    const nextText = story.Continue();
    setCurrentText(nextText);
    setCanContinue(story.canContinue);
  }
  
  if (!story.canContinue) {
    setCurrentChoices(story.currentChoices);
  } else {
    setCurrentChoices([]);
  }
};

/**
 * Handle ink story continue
 */
export const handleInkContinue = async (
  story: Story,
  storyId: string | undefined,
  currentPage: number,
  totalPages: number,
  nodeMappings: any,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentText: (text: string) => void,
    setCanContinue: (value: boolean) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!story || !storyId) return;
  
  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentText,
    setCanContinue,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;
  
  // Save current state for history
  const currentState = story.state.toJson();
  setStoryHistory(prev => [...prev, currentState]);
  setCanGoBack(true);
  
  // Ink story continues
  const nextText = story.Continue();
  setCurrentText(nextText);
  setCanContinue(story.canContinue);
  
  if (!story.canContinue) {
    setCurrentChoices(story.currentChoices);
  } else {
    setCurrentChoices([]);
  }
  
  // Update page number using node mappings
  const newPage = Math.min(currentPage + 1, totalPages);
  const newNode = nodeMappings.pageToNode[newPage];
  
  if (newNode) {
    console.log(`Navigating to page ${newPage}, node: ${newNode}`);
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
    
    const count = await fetchCommentCount(storyId, newPage);
    setCommentCount(count);
  } else {
    console.warn(`Navigation issue: No valid node found for page ${newPage}`);
  }
};

/**
 * Handle ink story choice selection
 */
export const handleInkChoice = async (
  index: number,
  story: Story,
  storyId: string | undefined,
  currentPage: number,
  nodeMappings: any,
  totalPages: number,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentText: (text: string) => void,
    setCanContinue: (value: boolean) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!story || !storyId) return;

  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentText,
    setCanContinue,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;

  const currentState = story.state.toJson();
  setStoryHistory(prev => [...prev, currentState]);
  setCanGoBack(true);

  story.ChooseChoiceIndex(index);
  
  if (story.canContinue) {
    const newText = story.Continue();
    setCurrentText(newText);
    setCanContinue(story.canContinue);
    
    if (!story.canContinue) {
      setCurrentChoices(story.currentChoices);
    } else {
      setCurrentChoices([]);
    }
  } else {
    setCurrentChoices(story.currentChoices);
    setCanContinue(false);
  }
  
  // Use node mappings to determine the new page
  const nextPage = currentPage + 1;
  const nextNode = nodeMappings.pageToNode[nextPage];
  
  if (nextNode) {
    setCurrentPage(nextPage);
    setCurrentStoryPosition(nextPage);
  } else {
    console.warn(`No node mapping for page ${nextPage}, using fallback`);
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
  }
  
  const count = await fetchCommentCount(storyId, currentPage);
  setCommentCount(count);
};

/**
 * Handle going back in an ink story
 */
export const handleInkBack = async (
  story: Story,
  storyHistory: string[],
  storyId: string | undefined,
  currentPage: number,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentText: (text: string) => void,
    setCanContinue: (value: boolean) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!story || !storyId || storyHistory.length === 0) return;

  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentText,
    setCanContinue,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;

  const newHistory = [...storyHistory];
  const previousState = newHistory.pop();
  
  if (previousState) {
    // Fix: Use a function to update state instead of passing an array directly
    setStoryHistory(prev => newHistory);
    setCanGoBack(newHistory.length > 0);
    
    // Determine previous page
    const prevPage = Math.max(currentPage - 1, 1);
    console.log(`Back navigation: Page ${currentPage} → ${prevPage}`);
    
    setCurrentPage(prevPage);
    setCurrentStoryPosition(prevPage);
    
    console.log("Back navigation: Loading previous story state");
    try {
      story.state.LoadJson(previousState as string);
      
      let newText = "";
      if (story.canContinue) {
        newText = story.Continue();
        setCurrentText(newText + " ");
        setTimeout(() => setCurrentText(newText), 10);
      } else {
        newText = story.currentText;
        setCurrentText(newText + " ");
        setTimeout(() => setCurrentText(newText), 10);
      }
      
      setCanContinue(story.canContinue);
      
      if (!story.canContinue) {
        setCurrentChoices(story.currentChoices);
      } else {
        setCurrentChoices([]);
      }
      
      const count = await fetchCommentCount(storyId, prevPage);
      setCommentCount(count);
    } catch (error) {
      console.error("Error loading previous state:", error);
      setCurrentPage(currentPage);
      setCurrentStoryPosition(currentPage);
    }
  } else {
    console.error("Back navigation: No previous state found in history");
  }
};

/**
 * Handle restarting an ink story
 */
export const restartInkStory = async (
  story: Story,
  storyId: string | undefined,
  setters: {
    setStoryHistory: (history: string[] | ((prev: string[]) => string[])) => void,
    setCanGoBack: (canGoBack: boolean) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCurrentText: (text: string) => void,
    setCanContinue: (canContinue: boolean) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!story || !storyId) return;
  
  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentPage,
    setCurrentStoryPosition,
    setCurrentText,
    setCanContinue,
    setCurrentChoices,
    setCommentCount
  } = setters;
  
  // Fix: Use a function to update state
  setStoryHistory(() => []);
  setCanGoBack(false);
  
  // Always reset to page 1
  setCurrentPage(1);
  setCurrentStoryPosition(1);
  
  story.ResetState();
  setCurrentText('');
  
  if (story.canContinue) {
    const text = story.Continue();
    setCurrentText(text);
    setCanContinue(story.canContinue);
  }
  
  if (!story.canContinue) {
    setCurrentChoices(story.currentChoices);
  } else {
    setCurrentChoices([]);
  }

  const count = await fetchCommentCount(storyId, 1);
  setCommentCount(count);
};

/**
 * Handle page change in an ink story
 */
export const handleInkPageChange = async (
  newPage: number,
  currentPage: number,
  totalPages: number,
  nodeMappings: any,
  story: Story,
  storyId: string | undefined,
  setters: {
    setStoryHistory: (updater: (prev: string[]) => string[]) => void,
    setCanGoBack: (value: boolean) => void,
    setCurrentNode: (node: string) => void,
    setCurrentText: (text: string) => void,
    setCanContinue: (value: boolean) => void,
    setCurrentChoices: (choices: any[]) => void,
    setCurrentPage: (page: number) => void,
    setCurrentStoryPosition: (position: number) => void,
    setCommentCount: (count: number) => void
  }
): Promise<void> => {
  if (!story || !storyId || newPage === currentPage || newPage < 1 || newPage > totalPages) {
    console.log(`Invalid page navigation attempt: current=${currentPage}, target=${newPage}, max=${totalPages}`);
    return;
  }
  
  const {
    setStoryHistory,
    setCanGoBack,
    setCurrentNode,
    setCurrentText,
    setCanContinue,
    setCurrentChoices,
    setCurrentPage,
    setCurrentStoryPosition,
    setCommentCount
  } = setters;
  
  console.log(`Navigating to page ${newPage} (current: ${currentPage})`);
  
  // Get the target node for this page
  const targetNode = nodeMappings.pageToNode[newPage];
  
  if (!targetNode) {
    console.error(`No node mapping found for page ${newPage}`);
    return;
  }
  
  // Save current state for back navigation
  const currentState = story.state.toJson();
  setStoryHistory(prev => [...prev, currentState]);
  setCanGoBack(true);
  
  try {
    // For Ink.js stories, we need to reset and step through
    if (newPage < currentPage) {
      console.log(`Backwards navigation from ${currentPage} to ${newPage}`);
      const originalState = story.state.toJson();
      story.ResetState();
      
      let currentPageCounter = 1;
      
      // Navigate through the story to reach the target page
      while (currentPageCounter < newPage && story.canContinue) {
        story.Continue();
        currentPageCounter++;
        console.log(`Navigation progress: at page ${currentPageCounter}`);
      }
      
      if (currentPageCounter === newPage) {
        setCurrentText(story.currentText);
        setCanContinue(story.canContinue);
        setCurrentChoices(story.canContinue ? [] : story.currentChoices);
        setCurrentPage(newPage);
        setCurrentStoryPosition(newPage);
        
        // Also update currentNode to match
        if (targetNode) {
          setCurrentNode(targetNode);
        }
        
        console.log(`Successfully navigated to page ${newPage}`);
      } else {
        console.error(`Failed to navigate to page ${newPage}, only reached ${currentPageCounter}`);
        story.state.LoadJson(originalState);
        return;
      }
    } else {
      console.log(`Forward navigation from ${currentPage} to ${newPage}`);
      try {
        let currentPageCounter = currentPage;
        let success = false;
        
        while (currentPageCounter < newPage) {
          if (story.canContinue) {
            story.Continue();
            currentPageCounter++;
            console.log(`Navigation progress: at page ${currentPageCounter}`);
          } else if (story.currentChoices.length > 0) {
            story.ChooseChoiceIndex(0);
            if (story.canContinue) {
              story.Continue();
            }
            currentPageCounter++;
            console.log(`Navigation progress (after choice): at page ${currentPageCounter}`);
          } else {
            console.log(`Navigation stuck at page ${currentPageCounter}, no way to continue`);
            break;
          }
          
          if (currentPageCounter === newPage) {
            success = true;
            break;
          }
        }
        
        if (success) {
          setCurrentText(story.currentText);
          setCanContinue(story.canContinue);
          setCurrentChoices(story.canContinue ? [] : story.currentChoices);
          setCurrentPage(newPage);
          setCurrentStoryPosition(newPage);
          
          // Also update currentNode to match
          if (targetNode) {
            setCurrentNode(targetNode);
          }
          
          console.log(`Successfully navigated to page ${newPage}`);
        } else {
          return;
        }
      } catch (error) {
        console.error("Error during forward navigation:", error);
        return;
      }
    }
    
    const count = await fetchCommentCount(storyId, newPage);
    setCommentCount(count);
  } catch (error) {
    console.error("Error during page navigation:", error);
  }
};
