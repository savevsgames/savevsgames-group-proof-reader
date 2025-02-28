
import { useState, useEffect } from 'react';
import { Story } from 'inkjs';
import { useToast } from '@/hooks/use-toast';
import {
  BookData,
  CustomStory,
  fetchBookDetails,
  fetchCommentCount,
  fetchStoryContent,
  extractCustomStoryFromInkJSON,
  storyNodeToPageMap
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
  const [currentStoryPosition, setCurrentStoryPosition] = useState<string>('');
  const [canContinue, setCanContinue] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('root');
  const { toast } = useToast();

  // Load book and story data
  useEffect(() => {
    const initializeStory = async () => {
      if (!storyId) {
        setError('No story ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch book details
        const bookData = await fetchBookDetails(storyId);
        
        console.log("Fetched book data:", bookData);
        
        // Set book title for display
        if (bookData.title) {
          setBookTitle(bookData.title);
        }
        
        // Determine if we need to set total pages
        if (bookData.total_pages) {
          setTotalPages(bookData.total_pages);
        }

        // Now attempt to load the story content from the URL
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

  // Load story content from URL
  const loadStoryContent = async (storyUrl: string, sid: string) => {
    try {
      console.log("Fetching story from URL:", storyUrl);
      const storyData = await fetchStoryContent(storyUrl);
      console.log("Story data loaded successfully");

      // Check if it's a custom format (has node structure) or inkjs format
      if (storyData.start || (storyData.root && typeof storyData.root === 'object')) {
        console.log("Using custom story format");
        setUsingCustomFormat(true);
        setCustomStory(storyData);
        setCurrentNode('start');
        setCurrentText(storyData.start ? storyData.start.text : "Story begins...");
        setCurrentChoices(storyData.start ? storyData.start.choices : []);
        setCurrentStoryPosition('start');
        const count = await fetchCommentCount(sid, 'start');
        setCommentCount(count);
      } else {
        // It's an inkjs format
        console.log("Using inkjs story format");
        try {
          const newStory = new Story(storyData);
          setStory(newStory);
          setUsingCustomFormat(false);
          
          // Get the first piece of text
          if (newStory.canContinue) {
            const nextText = newStory.Continue();
            setCurrentText(nextText);
            setCanContinue(newStory.canContinue);
          }
          
          // Only show choices if we can't continue
          if (!newStory.canContinue) {
            setCurrentChoices(newStory.currentChoices);
          } else {
            setCurrentChoices([]);
          }
          
          // Save current story position for comments
          if (newStory.state) {
            const position = newStory.state.toJson();
            setCurrentStoryPosition(position);
            const count = await fetchCommentCount(sid, position);
            setCommentCount(count);
          }
        } catch (storyError: any) {
          console.error('Error initializing inkjs story:', storyError);
          
          // Check if we have inkjs format but need to parse manually
          if (storyData.inkVersion) {
            console.log("Trying to parse as Ink JSON format manually");
            setUsingCustomFormat(true);
            
            // Try to extract structure from inkJSON
            const extractedStory = extractCustomStoryFromInkJSON(storyData);
            setCustomStory(extractedStory);
            setCurrentNode('root');
            
            if (extractedStory && extractedStory.root) {
              setCurrentText(extractedStory.root.text || "Story begins...");
              setCurrentChoices(extractedStory.root.choices || []);
            } else {
              setCurrentText("Story begins...");
              setCurrentChoices([]);
            }
            
            setCurrentStoryPosition('root');
            const count = await fetchCommentCount(sid, 'root');
            setCommentCount(count);
          } else {
            throw new Error(`Error loading story: ${storyError.message}`);
          }
        }
      }
      
      setIsLoading(false);
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

  // Handle the "Continue" button for inkjs format
  const handleContinue = async () => {
    if (!story || !storyId) return;
    
    // Save current state before continuing
    const currentState = story.state.toJson();
    setStoryHistory(prev => [...prev, currentState]);
    setCanGoBack(true);
    
    // Get the next section of text
    const nextText = story.Continue();
    setCurrentText(nextText);
    setCanContinue(story.canContinue);
    
    // Try to determine the current path for page tracking
    try {
      // This is a heuristic approach - we're looking at the state to guess which section we're in
      const stateObj = JSON.parse(story.state.toJson());
      if (stateObj && stateObj.currentPath && stateObj.currentPath.length > 0) {
        const pathComponent = stateObj.currentPath[stateObj.currentPath.length - 1];
        const pathName = typeof pathComponent === 'string' ? pathComponent : 
                         (pathComponent.component || '');
        
        if (pathName && storyNodeToPageMap[pathName]) {
          setCurrentPage(storyNodeToPageMap[pathName]);
          setCurrentPath(pathName);
        } else {
          // Fallback - just increment the page
          setCurrentPage(prev => Math.min(prev + 1, totalPages));
        }
      } else {
        // Fallback - just increment the page
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
      }
    } catch (e) {
      // If we can't parse the state, just increment the page
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }
    
    // Only show choices if we can't continue
    if (!story.canContinue) {
      setCurrentChoices(story.currentChoices);
    } else {
      setCurrentChoices([]);
    }
    
    // Update current story position for comments
    if (story.state) {
      const position = story.state.toJson();
      setCurrentStoryPosition(position);
      const count = await fetchCommentCount(storyId, position);
      setCommentCount(count);
    }
  };

  // Handle choice for custom story format
  const handleCustomChoice = async (nextNode: string) => {
    if (!customStory || !storyId) return;

    // Save current node to history for "back" functionality
    setStoryHistory(prev => [...prev, currentNode]);
    setCanGoBack(true);

    // Navigate to the next node
    const nextStoryNode = customStory[nextNode];
    if (nextStoryNode) {
      setCurrentNode(nextNode);
      setCurrentText(nextStoryNode.text);
      setCurrentChoices(nextStoryNode.choices);
      setCurrentStoryPosition(nextNode);
      
      // Update page based on the node mapping
      if (storyNodeToPageMap[nextNode]) {
        setCurrentPage(storyNodeToPageMap[nextNode]);
      } else {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
      }
      
      const count = await fetchCommentCount(storyId, nextNode);
      setCommentCount(count);
    } else {
      console.error(`Node "${nextNode}" not found in story`);
      setError(`Story navigation error: Node "${nextNode}" not found`);
    }
  };

  // Handle choice for inkjs format
  const handleInkChoice = async (index: number) => {
    if (!story || !storyId) return;

    // Save current state before making choice
    const currentState = story.state.toJson();
    setStoryHistory(prev => [...prev, currentState]);
    setCanGoBack(true);

    // Make the choice
    story.ChooseChoiceIndex(index);
    
    // Get the next section of text if available
    if (story.canContinue) {
      const nextText = story.Continue();
      setCurrentText(nextText);
      setCanContinue(story.canContinue);
      
      // Only show choices if we can't continue
      if (!story.canContinue) {
        setCurrentChoices(story.currentChoices);
      } else {
        setCurrentChoices([]);
      }
    } else {
      setCurrentChoices(story.currentChoices);
      setCanContinue(false);
    }
    
    // Update page based on current state
    try {
      const stateObj = JSON.parse(story.state.toJson());
      if (stateObj && stateObj.currentPath && stateObj.currentPath.length > 0) {
        const pathComponent = stateObj.currentPath[stateObj.currentPath.length - 1];
        const pathName = typeof pathComponent === 'string' ? pathComponent : 
                         (pathComponent.component || '');
        
        if (pathName && storyNodeToPageMap[pathName]) {
          setCurrentPage(storyNodeToPageMap[pathName]);
          setCurrentPath(pathName);
        } else {
          // Fallback - just increment the page
          setCurrentPage(prev => Math.min(prev + 1, totalPages));
        }
      } else {
        // Fallback - just increment the page
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
      }
    } catch (e) {
      // If we can't parse the state, just decrement the page
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }
    
    // Update current story position for comments
    if (story.state) {
      const position = story.state.toJson();
      setCurrentStoryPosition(position);
      const count = await fetchCommentCount(storyId, position);
      setCommentCount(count);
    }
  };

  // Combined choice handler
  const handleChoice = (index: number) => {
    if (usingCustomFormat) {
      const choice = currentChoices[index];
      handleCustomChoice(choice.nextNode);
    } else {
      handleInkChoice(index);
    }
  };

  // Back functionality
  const handleBack = async () => {
    if (!storyId || storyHistory.length === 0) return;

    // Pop the last state from history
    const newHistory = [...storyHistory];
    const previousState = newHistory.pop();
    
    if (previousState) {
      setStoryHistory(newHistory);
      setCanGoBack(newHistory.length > 0);
      
      if (usingCustomFormat && customStory) {
        // For custom format, previousState is the node name
        const prevNode = customStory[previousState];
        if (prevNode) {
          setCurrentNode(previousState);
          setCurrentText(prevNode.text);
          setCurrentChoices(prevNode.choices);
          setCurrentStoryPosition(previousState);
          
          // Update page based on the node mapping
          if (storyNodeToPageMap[previousState]) {
            setCurrentPage(storyNodeToPageMap[previousState]);
          } else {
            setCurrentPage(prev => Math.max(prev - 1, 1));
          }
          
          const count = await fetchCommentCount(storyId, previousState);
          setCommentCount(count);
        }
      } else if (story) {
        // For inkjs format
        story.state.LoadJson(previousState);
        
        // Get the current text
        if (story.canContinue) {
          const text = story.Continue();
          setCurrentText(text);
          setCanContinue(story.canContinue);
        }
        
        // Only show choices if we can't continue
        if (!story.canContinue) {
          setCurrentChoices(story.currentChoices);
        } else {
          setCurrentChoices([]);
        }
        
        // Update page based on current state
        try {
          const stateObj = JSON.parse(story.state.toJson());
          if (stateObj && stateObj.currentPath && stateObj.currentPath.length > 0) {
            const pathComponent = stateObj.currentPath[stateObj.currentPath.length - 1];
            const pathName = typeof pathComponent === 'string' ? pathComponent : 
                            (pathComponent.component || '');
            
            if (pathName && storyNodeToPageMap[pathName]) {
              setCurrentPage(storyNodeToPageMap[pathName]);
              setCurrentPath(pathName);
            } else {
              // Fallback - just decrement the page
              setCurrentPage(prev => Math.max(prev - 1, 1));
            }
          } else {
            // Fallback - just decrement the page
            setCurrentPage(prev => Math.max(prev - 1, 1));
          }
        } catch (e) {
          // If we can't parse the state, just decrement the page
          setCurrentPage(prev => Math.max(prev - 1, 1));
        }
        
        // Update current story position for comments
        if (story.state) {
          const position = story.state.toJson();
          setCurrentStoryPosition(position);
          const count = await fetchCommentCount(storyId, position);
          setCommentCount(count);
        }
      }
    }
  };

  // Reset functionality
  const handleRestart = async () => {
    if (!storyId) return;
    
    setStoryHistory([]);
    setCanGoBack(false);
    setCurrentPage(1);
    setCurrentPath('root');
    
    if (usingCustomFormat && customStory) {
      // Reset to start node for custom format
      setCurrentNode('start');
      setCurrentText(customStory.start ? customStory.start.text : "Story begins...");
      setCurrentChoices(customStory.start ? customStory.start.choices : []);
      setCurrentStoryPosition('start');
      const count = await fetchCommentCount(storyId, 'start');
      setCommentCount(count);
    } else if (story) {
      // Reset inkjs story
      story.ResetState();
      
      // Get the first piece of text
      if (story.canContinue) {
        const text = story.Continue();
        setCurrentText(text);
        setCanContinue(story.canContinue);
      }
      
      // Only show choices if we can't continue
      if (!story.canContinue) {
        setCurrentChoices(story.currentChoices);
      } else {
        setCurrentChoices([]);
      }
      
      // Update current story position for comments
      if (story.state) {
        const position = story.state.toJson();
        setCurrentStoryPosition(position);
        const count = await fetchCommentCount(storyId, position);
        setCommentCount(count);
      }
    }
  };

  // Update comment count
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
    updateCommentCount,
  };
};
