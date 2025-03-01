import { useState, useEffect } from 'react';
import { Story } from 'inkjs';
import { useToast } from '@/hooks/use-toast';
import {
  CustomStory,
  fetchBookDetails,
  fetchCommentCount,
  fetchStoryContent
} from '@/lib/storyUtils';
import { 
  analyzeStoryStructure, 
  extractAllNodesFromInkJSON, 
  extractCustomStoryFromInkJSON,
  validateNodeMappings
} from '@/lib/storyNodeMapping';
import { generateAndLogNodeMappings } from '@/lib/storyEditorUtils';

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
  const [totalPages, setTotalPages] = useState(1);
  const [commentCount, setCommentCount] = useState(0);
  const [currentStoryPosition, setCurrentStoryPosition] = useState<number>(1);
  const [canContinue, setCanContinue] = useState(false);
  const [nodeMappings, setNodeMappings] = useState<{
    nodeToPage: Record<string, number>;
    pageToNode: Record<number, string>;
  }>({
    nodeToPage: {},
    pageToNode: {}
  });
  const { toast } = useToast();

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
          
          const customStoryData = extractCustomStoryFromInkJSON(storyData);
          console.log("Converted Ink story to custom format for analysis");
          
          try {
            const { nodeMappings: mappings, totalPages: calculatedPages } = 
              generateAndLogNodeMappings(customStoryData);
            
            console.log("Story structure analysis successful:", 
              { totalPages: calculatedPages, mappings });
            
            setNodeMappings(mappings);
            setTotalPages(calculatedPages);
            setCustomStory(customStoryData);
          } catch (analysisErr) {
            console.error("Error in story structure analysis:", analysisErr);
            
            const allNodes = extractAllNodesFromInkJSON(storyData);
            const contentNodes = allNodes.filter(node => 
              node !== 'inkVersion' && node !== 'listDefs' && node !== '#f'
            );
            
            setTotalPages(Math.max(contentNodes.length, 1));
            console.warn("Using fallback page count:", contentNodes.length);
          }
          
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
          
          setCurrentStoryPosition(1);
          setCurrentPage(1);
          
          const count = await fetchCommentCount(sid, 1);
          setCommentCount(count);
          
          setIsLoading(false);
        } catch (storyError: any) {
          console.error('Error initializing inkjs story:', storyError);
          throw new Error(`Error loading story: ${storyError.message}`);
        }
      } 
      else if ((storyData.start && storyData.start.text) || 
               (storyData.root && typeof storyData.root === 'object')) {
        console.log("Using custom story format");
        setUsingCustomFormat(true);
        setCustomStory(storyData);
        
        try {
          console.log("Analyzing story structure for node mappings...");
          const { nodeMappings: mappings, totalPages: calculatedPages } = 
            generateAndLogNodeMappings(storyData);
          
          setNodeMappings(mappings);
          setTotalPages(calculatedPages);
          console.log("Node mapping successful:", 
            { totalPages: calculatedPages, mappings });
          
          const startNode = storyData.start ? 'start' : 'root';
          setCurrentNode(startNode);
          
          const startNodeData = storyData[startNode];
          if (startNodeData && startNodeData.text) {
            setCurrentText(startNodeData.text);
            setCurrentChoices(startNodeData.choices || []);
          } else {
            setCurrentText("Story begins...");
            setCurrentChoices([]);
          }
          
          setCurrentStoryPosition(1);
          setCurrentPage(1);
          
          const count = await fetchCommentCount(sid, 1);
          setCommentCount(count);
          setIsLoading(false);
        } catch (err) {
          console.error("Failed to analyze story structure:", err);
          setError(`Failed to analyze story structure: ${err}`);
          setIsLoading(false);
        }
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
    
    const nextText = story.Continue();
    setCurrentText(nextText);
    setCanContinue(story.canContinue);
    
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
    
    if (!story.canContinue) {
      setCurrentChoices(story.currentChoices);
    } else {
      setCurrentChoices([]);
    }
    
    const count = await fetchCommentCount(storyId, newPage);
    setCommentCount(count);
  };

  const handleInkChoice = async (index: number) => {
    if (!story || !storyId) return;

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
    
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    setCurrentStoryPosition(newPage);
    
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
      setCurrentText(nextStoryNode.text);
      setCurrentChoices(nextStoryNode.choices || []);
      
      const newPage = nodeMappings.nodeToPage[nextNode] || 
                      Math.min(currentPage + 1, totalPages);
                      
      setCurrentPage(newPage);
      setCurrentStoryPosition(newPage);
      
      const count = await fetchCommentCount(storyId, newPage);
      setCommentCount(count);
    } else {
      console.error(`Node "${nextNode}" not found in story`);
      setError(`Story navigation error: Node "${nextNode}" not found`);
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

    console.log("Back navigation triggered, history length:", storyHistory.length);

    const newHistory = [...storyHistory];
    const previousState = newHistory.pop();
    
    if (previousState) {
      setStoryHistory(newHistory);
      setCanGoBack(newHistory.length > 0);
      
      const newPage = Math.max(currentPage - 1, 1);
      console.log(`Back navigation: Page ${currentPage} → ${newPage}`);
      
      setCurrentPage(newPage);
      setCurrentStoryPosition(newPage);
      
      if (usingCustomFormat && customStory) {
        const prevNode = previousState;
        if (customStory[prevNode]) {
          setCurrentNode(prevNode);
          
          const textContent = customStory[prevNode].text;
          setCurrentText(textContent + " ");
          setTimeout(() => setCurrentText(textContent), 10);
          
          setCurrentChoices(customStory[prevNode].choices || []);
          
          const count = await fetchCommentCount(storyId, newPage);
          setCommentCount(count);
        } else {
          console.error(`Back navigation error: Node "${prevNode}" not found`);
        }
      } else if (story) {
        console.log("Back navigation: Loading previous story state");
        try {
          story.state.LoadJson(previousState);
          
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
          
          const count = await fetchCommentCount(storyId, newPage);
          setCommentCount(count);
        } catch (error) {
          console.error("Error loading previous state:", error);
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
    
    setCurrentPage(1);
    setCurrentStoryPosition(1);
    
    if (usingCustomFormat && customStory) {
      const startNode = customStory.start ? 'start' : 'root';
      setCurrentNode(startNode);
      
      const startNodeData = customStory[startNode];
      if (startNodeData && startNodeData.text) {
        setCurrentText(startNodeData.text);
        setCurrentChoices(startNodeData.choices || []);
      } else {
        setCurrentText("Story begins...");
        setCurrentChoices([]);
      }
      
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

  const handlePageChange = async (newPage: number) => {
    if (!storyId || newPage === currentPage || newPage < 1 || newPage > totalPages) {
      console.log(`Invalid page navigation attempt: current=${currentPage}, target=${newPage}, max=${totalPages}`);
      return;
    }
    
    console.log(`Navigating to page ${newPage} (current: ${currentPage})`);
    
    if (usingCustomFormat && customStory) {
      const targetNode = nodeMappings.pageToNode[newPage];
      
      if (targetNode && customStory[targetNode]) {
        console.log(`Found node ${targetNode} for page ${newPage}`);
        
        setStoryHistory(prev => [...prev, currentNode]);
        setCanGoBack(true);
        
        setCurrentNode(targetNode);
        setCurrentText(customStory[targetNode].text);
        setCurrentChoices(customStory[targetNode].choices || []);
        
        setCurrentPage(newPage);
        setCurrentStoryPosition(newPage);
        
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
    else if (story) {
      const currentState = story.state.toJson();
      setStoryHistory(prev => [...prev, currentState]);
      setCanGoBack(true);
      
      if (newPage < currentPage) {
        console.log(`Backwards navigation from ${currentPage} to ${newPage}`);
        try {
          const originalState = story.state.toJson();
          story.ResetState();
          
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
    currentNode,
    handleContinue,
    handleChoice,
    handleBack,
    handleRestart,
    handlePageChange,
    updateCommentCount,
  };
};
