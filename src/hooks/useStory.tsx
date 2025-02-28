
import { useState, useEffect } from 'react';
import { Story } from 'inkjs';
import { useToast } from '@/hooks/use-toast';
import {
  BookData,
  CustomStory,
  fetchBookDetails,
  fetchCommentCount,
  fetchStoryContent
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
          
          if (newStory.state) {
            const position = newStory.state.toJson();
            setCurrentStoryPosition(position);
            const count = await fetchCommentCount(sid, position);
            setCommentCount(count);
          }
          
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
        setCurrentStoryPosition('start');
        const count = await fetchCommentCount(sid, 'start');
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
        
        setCurrentStoryPosition('root');
        const count = await fetchCommentCount(sid, 'root');
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
    
    const currentState = story.state.toJson();
    setStoryHistory(prev => [...prev, currentState]);
    setCanGoBack(true);
    
    // Key change: set text directly instead of appending
    const nextText = story.Continue();
    setCurrentText(nextText);
    setCanContinue(story.canContinue);
    
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
    
    if (!story.canContinue) {
      setCurrentChoices(story.currentChoices);
    } else {
      setCurrentChoices([]);
    }
    
    if (story.state) {
      const position = story.state.toJson();
      setCurrentStoryPosition(position);
      const count = await fetchCommentCount(storyId, position);
      setCommentCount(count);
    }
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
      setCurrentStoryPosition(nextNode);
      
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
      
      const count = await fetchCommentCount(storyId, nextNode);
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
    
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
    
    if (story.state) {
      const position = story.state.toJson();
      setCurrentStoryPosition(position);
      const count = await fetchCommentCount(storyId, position);
      setCommentCount(count);
    }
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

    const newHistory = [...storyHistory];
    const previousState = newHistory.pop();
    
    if (previousState) {
      setStoryHistory(newHistory);
      setCanGoBack(newHistory.length > 0);
      
      if (usingCustomFormat && customStory) {
        const prevNode = customStory[previousState];
        if (prevNode) {
          setCurrentNode(previousState);
          setCurrentText(prevNode.text);
          setCurrentChoices(prevNode.choices || []);
          setCurrentStoryPosition(previousState);
          
          setCurrentPage(prev => Math.max(prev - 1, 1));
          
          const count = await fetchCommentCount(storyId, previousState);
          setCommentCount(count);
        }
      } else if (story) {
        story.state.LoadJson(previousState);
        
        // Reset text and rebuild from the beginning of this state
        setCurrentText('');
        
        // Get the text for this state
        if (story.canContinue) {
          const text = story.Continue();
          setCurrentText(text);
        }
        
        setCanContinue(story.canContinue);
        
        if (!story.canContinue) {
          setCurrentChoices(story.currentChoices);
        } else {
          setCurrentChoices([]);
        }
        
        setCurrentPage(prev => Math.max(prev - 1, 1));
        
        if (story.state) {
          const position = story.state.toJson();
          setCurrentStoryPosition(position);
          const count = await fetchCommentCount(storyId, position);
          setCommentCount(count);
        }
      }
    }
  };

  const handleRestart = async () => {
    if (!storyId) return;
    
    setStoryHistory([]);
    setCanGoBack(false);
    setCurrentPage(1);
    
    if (usingCustomFormat && customStory) {
      setCurrentNode('start');
      setCurrentText(customStory.start ? customStory.start.text : "Story begins...");
      setCurrentChoices(customStory.start ? customStory.start.choices : []);
      setCurrentStoryPosition('start');
      const count = await fetchCommentCount(storyId, 'start');
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
      
      if (story.state) {
        const position = story.state.toJson();
        setCurrentStoryPosition(position);
        const count = await fetchCommentCount(storyId, position);
        setCommentCount(count);
      }
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
    updateCommentCount,
  };
};
