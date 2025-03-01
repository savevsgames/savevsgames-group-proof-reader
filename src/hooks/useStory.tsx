
import { useState, useEffect } from 'react';
import { Story } from 'inkjs';
import { useToast } from '@/hooks/use-toast';
import {
  BookData,
  CustomStory,
  fetchBookDetails,
  fetchCommentCount,
  fetchStoryContent,
  storyNodeToPageMap,
  pageToStoryNodeMap
} from '@/lib/storyUtils';

export const useStory = (storyId: string | undefined) => {
  const [story, setStory] = useState<Story | null>(null);
  const [customStory, setCustomStory] = useState<CustomStory | null>(null);
  const [usingCustomFormat, setUsingCustomFormat] = useState(false);
  const [currentNode, setCurrentNode] = useState<string>('start');
  const [currentText, setCurrentText] = useState<string>('');
  const [currentChoices, setCurrentChoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [bookTitle, setBookTitle] = useState('Shadowtide');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(17);
  const [commentCount, setCommentCount] = useState(0);
  const [currentStoryPosition, setCurrentStoryPosition] = useState<number>(1); // Changed to number
  const [canContinue, setCanContinue] = useState(false);
  const { toast } = useToast();

  const estimateTotalPagesFromInkStory = (storyObj: Story): number => {
    let count = 1;
    
    try {
      const originalState = storyObj.state.toJson();
      
      storyObj.ResetState();
      
      const visitedStates = new Set<string>();
      
      while (storyObj.canContinue) {
        storyObj.Continue();
        count++;
        
        const currentState = storyObj.state.toJson();
        if (visitedStates.has(currentState)) {
          break;
        }
        visitedStates.add(currentState);
        
        if (storyObj.currentChoices.length > 0) {
          count += 1;
          break;
        }
      }
      
      storyObj.state.LoadJson(originalState);
      
      return count;
    } catch (e) {
      console.error("Error estimating pages:", e);
      return 17;
    }
  };

  useEffect(() => {
    const initializeStory = async () => {
      if (!storyId) {
        setError('No story ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const bookData = await fetchBookDetails(storyId);
        
        console.log("Fetched book data:", bookData);
        
        if (bookData.title) {
          setBookTitle(bookData.title);
        }

        if (bookData.story_url) {
          await loadStoryContent(bookData.story_url, storyId);
        } else {
          throw new Error('This book has no story content URL');
        }
      } catch (err: any) {
        console.error("Error in initializeStory:", err);
        setError(err.message || 'Failed to load story');
        setIsLoading(false);
        toast({
          title: "Error",
          description: err.message || "Failed to load story",
          variant: "destructive"
        });
      }
    };

    initializeStory();
  }, [storyId, toast]);

  const loadStoryContent = async (storyUrl: string, sid: string) => {
    try {
      console.log("Fetching story from URL:", storyUrl);
      const storyData = await fetchStoryContent(storyUrl);
      console.log("Story data loaded successfully");

      if (storyData.inkVersion) {
        console.log("Detected Ink.js story format (version:", storyData.inkVersion, ")");
        try {
          const newStory = new Story(storyData);
          setStory(newStory);
          setUsingCustomFormat(false);
          
          const estimatedPages = estimateTotalPagesFromInkStory(newStory);
          console.log("Estimated total pages:", estimatedPages);
          setTotalPages(estimatedPages);
          
          if (newStory.canContinue) {
            const nextText = newStory.Continue();
            setCurrentText(nextText);
            setCanContinue(newStory.canContinue);
          }
          
          if (!newStory.canContinue) {
            setCurrentChoices(newStory.currentChoices);
          } else {
            setCurrentChoices([]);
          }
          
          // Use page 1 as the initial position
          setCurrentStoryPosition(1);
          setCurrentPage(1);
          
          // Fetch comment count for page 1
          const count = await fetchCommentCount(sid, 1);
          setCommentCount(count);
          
          setIsLoading(false);
        } catch (storyError: any) {
          console.error('Error initializing inkjs story:', storyError);
          throw new Error(`Error loading story: ${storyError.message}`);
        }
      } 
      else if (storyData.start && storyData.start.text) {
        console.log("Using custom story format with start node");
        setUsingCustomFormat(true);
        setCustomStory(storyData);
        setCurrentNode('start');
        setCurrentText(storyData.start.text);
        setCurrentChoices(storyData.start.choices || []);
        
        // Use page 1 for start node
        setCurrentStoryPosition(1);
        setCurrentPage(1);
        
        const count = await fetchCommentCount(sid, 1);
        setCommentCount(count);
        setIsLoading(false);
      }
      else if (storyData.root && typeof storyData.root === 'object') {
        console.log("Using root-based custom story format");
        setUsingCustomFormat(true);
        setCustomStory(storyData);
        setCurrentNode('root');
        
        if (storyData.root.text) {
          setCurrentText(storyData.root.text);
          setCurrentChoices(storyData.root.choices || []);
        } else {
          setCurrentText("Story begins...");
          setCurrentChoices([]);
        }
        
        // Use page 1 for root node
        setCurrentStoryPosition(1);
        setCurrentPage(1);
        
        const count = await fetchCommentCount(sid, 1);
        setCommentCount(count);
        setIsLoading(false);
      } else {
        throw new Error('Unsupported story format');
      }
    } catch (error: any) {
      console.error('Error loading story content:', error);
      setError(`Failed to load story content: ${error.message}`);
      setIsLoading(false);
      toast({
        title: "Story Error",
        description: `There was an issue loading the story: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleContinue = async () => {
    if (!story || !storyId) return;
    
    // Save current state to history for back navigation
    const currentState = story.state.toJson();
    setStoryHistory(prev => [...prev, currentState]);
    setCanGoBack(true);
    
    // Key change: set text directly instead of appending
    const nextText = story.Continue();
    setCurrentText(nextText);
    setCanContinue(story.canContinue);
    
    // Update page number and use it as the position
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
    
    if (!story.canContinue) {
      setCurrentChoices(story.currentChoices);
    } else {
      setCurrentChoices([]);
    }
    
    // Fetch comments for the new page number
    const count = await fetchCommentCount(storyId, newPage);
    setCommentCount(count);
  };

  const handleCustomChoice = async (nextNode: string) => {
    if (!customStory || !storyId) return;

    setStoryHistory(prev => [...prev, currentNode]);
    setCanGoBack(true);

    const nextStoryNode = customStory[nextNode];
    if (nextStoryNode) {
      setCurrentNode(nextNode);
      // Set text directly for the new node
      setCurrentText(nextStoryNode.text);
      setCurrentChoices(nextStoryNode.choices || []);
      
      // Update page based on node mapping or increment by 1
      const newPage = storyNodeToPageMap[nextNode] || (currentPage + 1);
      setCurrentPage(newPage);
      setCurrentStoryPosition(newPage);
      
      const count = await fetchCommentCount(storyId, newPage);
      setCommentCount(count);
    } else {
      console.error(`Node "${nextNode}" not found in story`);
      setError(`Story navigation error: Node "${nextNode}" not found`);
    }
  };

  const handleInkChoice = async (index: number) => {
    if (!story || !storyId) return;

    const currentState = story.state.toJson();
    setStoryHistory(prev => [...prev, currentState]);
    setCanGoBack(true);

    story.ChooseChoiceIndex(index);
    
    // Set text directly for the new choice
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
    
    // Update page and use it as position
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
    
    // Fetch comments for the new page
    const count = await fetchCommentCount(storyId, newPage);
    setCommentCount(count);
  };

  const handleChoice = (index: number) => {
    if (usingCustomFormat) {
      const choice = currentChoices[index];
      if (choice && choice.nextNode) {
        handleCustomChoice(choice.nextNode);
      }
    } else {
      handleInkChoice(index);
    }
  };

  const handleBack = async () => {
    if (!storyId || storyHistory.length === 0) return;

    console.log("Back navigation triggered, history length:", storyHistory.length);

    const newHistory = [...storyHistory];
    const previousState = newHistory.pop();
    
    if (previousState) {
      // First update the history state
      setStoryHistory(newHistory);
      setCanGoBack(newHistory.length > 0);
      
      // Important fix: Calculate the new page number BEFORE updating content
      const newPage = Math.max(currentPage - 1, 1);
      console.log(`Back navigation: Page ${currentPage} → ${newPage}`);
      
      // Update page numbers first to ensure UI and story content stay in sync
      setCurrentPage(newPage);
      setCurrentStoryPosition(newPage);
      
      if (usingCustomFormat && customStory) {
        const prevNode = previousState;
        if (customStory[prevNode]) {
          console.log(`Back navigation: Moving to node ${prevNode}`);
          setCurrentNode(prevNode);
          setCurrentText(customStory[prevNode].text);
          setCurrentChoices(customStory[prevNode].choices || []);
          
          // Page number is already updated above
          const count = await fetchCommentCount(storyId, newPage);
          setCommentCount(count);
        } else {
          console.error(`Back navigation error: Node "${prevNode}" not found`);
        }
      } else if (story) {
        console.log("Back navigation: Loading previous story state");
        try {
          // Load the previous state
          story.state.LoadJson(previousState);
          
          // Get the text for this state
          if (story.canContinue) {
            const text = story.Continue();
            setCurrentText(text);
          } else {
            // If we can't continue, use whatever text is in the current state
            setCurrentText(story.currentText);
          }
          
          setCanContinue(story.canContinue);
          
          if (!story.canContinue) {
            setCurrentChoices(story.currentChoices);
          } else {
            setCurrentChoices([]);
          }
          
          // Page number is already updated above
          // Fetch comments for the new page
          const count = await fetchCommentCount(storyId, newPage);
          setCommentCount(count);
        } catch (error) {
          console.error("Error loading previous state:", error);
          // If there's an error, reset page numbers to ensure consistency
          setCurrentPage(currentPage);
          setCurrentStoryPosition(currentPage);
        }
      }
    } else {
      console.error("Back navigation: No previous state found in history");
    }
  };

  const handleRestart = async () => {
    if (!storyId) return;
    
    setStoryHistory([]);
    setCanGoBack(false);
    
    // Reset to page 1
    setCurrentPage(1);
    setCurrentStoryPosition(1);
    
    if (usingCustomFormat && customStory) {
      setCurrentNode('root');
      setCurrentText(customStory.root ? customStory.root.text : "Story begins...");
      setCurrentChoices(customStory.root ? customStory.root.choices : []);
      
      const count = await fetchCommentCount(storyId, 1);
      setCommentCount(count);
    } else if (story) {
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
    }
  };

  // Add direct page navigation function
  const handlePageChange = async (newPage: number) => {
    if (!storyId || newPage === currentPage || newPage < 1 || newPage > totalPages) {
      console.log(`Invalid page navigation attempt: current=${currentPage}, target=${newPage}, max=${totalPages}`);
      return;
    }
    
    console.log(`Navigating to page ${newPage} (current: ${currentPage})`);
    
    // For custom story format with node mappings
    if (usingCustomFormat && customStory) {
      const targetNode = pageToStoryNodeMap[newPage];
      
      if (targetNode && customStory[targetNode]) {
        console.log(`Found node ${targetNode} for page ${newPage}`);
        
        // Save current node to history
        setStoryHistory(prev => [...prev, currentNode]);
        setCanGoBack(true);
        
        // Set the story state to the new node
        setCurrentNode(targetNode);
        setCurrentText(customStory[targetNode].text);
        setCurrentChoices(customStory[targetNode].choices || []);
        
        // Update page number and position
        setCurrentPage(newPage);
        setCurrentStoryPosition(newPage);
        
        // Fetch comments for this page
        const count = await fetchCommentCount(storyId, newPage);
        setCommentCount(count);
      } else {
        console.error(`No node mapping found for page ${newPage}`);
        toast({
          title: "Navigation Error",
          description: `Could not find content for page ${newPage}`,
          variant: "destructive"
        });
      }
    } 
    // For inkjs stories, we need to try to navigate by continuing or choosing
    else if (story) {
      // Save current state to history
      const currentState = story.state.toJson();
      setStoryHistory(prev => [...prev, currentState]);
      setCanGoBack(true);
      
      if (newPage < currentPage) {
        console.log(`Backwards navigation from ${currentPage} to ${newPage}`);
        // For going back, we need to restart and play forward
        try {
          const originalState = story.state.toJson();
          story.ResetState();
          
          // Simulate continuing to the desired page
          let currentPageCounter = 1;
          
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
            console.log(`Successfully navigated to page ${newPage}`);
          } else {
            // Failed to reach the page, restore original state
            console.error(`Failed to navigate to page ${newPage}, only reached ${currentPageCounter}`);
            story.state.LoadJson(originalState);
            toast({
              title: "Navigation Error",
              description: `Could not navigate to page ${newPage}`,
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error("Error during backward navigation:", error);
          toast({
            title: "Navigation Error",
            description: "An error occurred during navigation",
            variant: "destructive"
          });
          return;
        }
      } else {
        console.log(`Forward navigation from ${currentPage} to ${newPage}`);
        // For going forward, we continue from current position
        try {
          let currentPageCounter = currentPage;
          let success = false;
          
          while (currentPageCounter < newPage) {
            if (story.canContinue) {
              story.Continue();
              currentPageCounter++;
              console.log(`Navigation progress: at page ${currentPageCounter}`);
            } else if (story.currentChoices.length > 0) {
              // Always choose the first option at choice points
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
            console.log(`Successfully navigated to page ${newPage}`);
          } else {
            toast({
              title: "Navigation Error",
              description: `Could not navigate to page ${newPage}`,
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error("Error during forward navigation:", error);
          toast({
            title: "Navigation Error",
            description: "An error occurred during navigation",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Fetch comments for the new page
      const count = await fetchCommentCount(storyId, newPage);
      setCommentCount(count);
    }
  };

  const updateCommentCount = async () => {
    if (!storyId) return;
    const count = await fetchCommentCount(storyId, currentStoryPosition);
    setCommentCount(count);
  };

  return {
    isLoading,
    error,
    bookTitle,
    currentPage,
    totalPages,
    currentText,
    currentChoices,
    canContinue,
    canGoBack,
    commentCount,
    currentStoryPosition,
    handleContinue,
    handleChoice,
    handleBack,
    handleRestart,
    handlePageChange,
    updateCommentCount,
  };
};
