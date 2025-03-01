
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NodeMappings } from "@/lib/storyEditorUtils";
import { CustomStory } from "@/lib/storyUtils";
import { Story } from "inkjs";
import { fetchCommentCount } from "@/lib/storyUtils";

interface UseStoryNavigationProps {
  storyData: CustomStory | null;
  story: Story | null;
  usingCustomFormat: boolean;
  storyId: string | undefined;
  nodeMappings: NodeMappings;
  totalPages: number;
}

export interface NavigationState {
  currentNode: string;
  currentPage: number;
  currentText: string;
  currentChoices: any[];
  canContinue: boolean;
  canGoBack: boolean;
  commentCount: number;
  currentStoryPosition: number;
  storyHistory: string[];
}

export interface NavigationActions {
  handleContinue: () => Promise<void>;
  handleChoice: (index: number) => Promise<void>;
  handleBack: () => Promise<void>;
  handleRestart: () => Promise<void>;
  handlePageChange: (newPage: number) => Promise<void>;
  updateCommentCount: () => Promise<void>;
}

export const useStoryNavigation = ({
  storyData,
  story,
  usingCustomFormat,
  storyId,
  nodeMappings,
  totalPages
}: UseStoryNavigationProps): [NavigationState, NavigationActions] => {
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
    } else if (story) {
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
    }
  }, [usingCustomFormat, storyData, story]);

  // Handle continue with node mapping
  const handleContinue = async () => {
    if (!story && !storyData || !storyId) return;
    
    // Save current state for history
    if (!usingCustomFormat && story) {
      const currentState = story.state.toJson();
      setStoryHistory(prev => [...prev, currentState]);
    } else {
      setStoryHistory(prev => [...prev, currentNode]);
    }
    
    setCanGoBack(true);
    
    if (!usingCustomFormat && story) {
      // Ink story continues
      const nextText = story.Continue();
      setCurrentText(nextText);
      setCanContinue(story.canContinue);
      
      if (!story.canContinue) {
        setCurrentChoices(story.currentChoices);
      } else {
        setCurrentChoices([]);
      }
    } else if (usingCustomFormat && storyData && currentChoices.length === 1) {
      // Follow single choice in custom story
      const nextNode = currentChoices[0].nextNode;
      if (storyData[nextNode]) {
        setCurrentNode(nextNode);
        setCurrentText(storyData[nextNode].text);
        setCurrentChoices(storyData[nextNode].choices || []);
      }
    }
    
    // Update page number using node mappings
    const newPage = Math.min(currentPage + 1, totalPages);
    const newNode = nodeMappings.pageToNode[newPage];
    
    if (newNode && ((!usingCustomFormat && story) || (usingCustomFormat && storyData && storyData[newNode]))) {
      console.log(`Navigating to page ${newPage}, node: ${newNode}`);
      
      // If using custom format, also update currentNode
      if (usingCustomFormat && storyData) {
        setCurrentNode(newNode);
      }
      
      setCurrentPage(newPage);
      setCurrentStoryPosition(newPage);
      
      const count = await fetchCommentCount(storyId, newPage);
      setCommentCount(count);
    } else {
      console.warn(`Navigation issue: No valid node found for page ${newPage}`);
    }
  };

  // Handle ink choice with node mapping
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

  // Handle custom choice with node mapping
  const handleCustomChoice = async (nextNode: string) => {
    if (!storyData || !storyId) return;

    setStoryHistory(prev => [...prev, currentNode]);
    setCanGoBack(true);

    const nextStoryNode = storyData[nextNode];
    if (nextStoryNode) {
      setCurrentNode(nextNode);
      setCurrentText(nextStoryNode.text);
      setCurrentChoices(nextStoryNode.choices || []);
      
      // Update page using node mappings
      const nextPage = nodeMappings.nodeToPage[nextNode];
      
      if (nextPage) {
        console.log(`Choice navigation: node ${nextNode} maps to page ${nextPage}`);
        setCurrentPage(nextPage);
        setCurrentStoryPosition(nextPage);
      } else {
        console.warn(`No page mapping for node ${nextNode}, using incremental page`);
        const newPage = Math.min(currentPage + 1, totalPages);
        setCurrentPage(newPage);
        setCurrentStoryPosition(newPage);
      }
      
      const count = await fetchCommentCount(storyId, currentPage);
      setCommentCount(count);
    } else {
      console.error(`Node "${nextNode}" not found in story`);
    }
  };

  // Handle choice with proper node mapping determination
  const handleChoice = async (index: number) => {
    if (usingCustomFormat) {
      const choice = currentChoices[index];
      if (choice && choice.nextNode) {
        await handleCustomChoice(choice.nextNode);
      }
    } else {
      await handleInkChoice(index);
    }
  };

  // Handle back navigation with node mappings
  const handleBack = async () => {
    if (!storyId || storyHistory.length === 0) return;

    console.log("Back navigation triggered, history length:", storyHistory.length);

    const newHistory = [...storyHistory];
    const previousState = newHistory.pop();
    
    if (previousState) {
      setStoryHistory(newHistory);
      setCanGoBack(newHistory.length > 0);
      
      // Determine previous page based on node mappings
      const prevPage = Math.max(currentPage - 1, 1);
      console.log(`Back navigation: Page ${currentPage} → ${prevPage}`);
      
      setCurrentPage(prevPage);
      setCurrentStoryPosition(prevPage);
      
      if (usingCustomFormat && storyData) {
        const prevNode = previousState as string;
        if (storyData[prevNode]) {
          setCurrentNode(prevNode);
          
          const textContent = storyData[prevNode].text;
          setCurrentText(textContent + " ");
          setTimeout(() => setCurrentText(textContent), 10);
          
          setCurrentChoices(storyData[prevNode].choices || []);
          
          const count = await fetchCommentCount(storyId, prevPage);
          setCommentCount(count);
        } else {
          console.error(`Back navigation error: Node "${prevNode}" not found`);
        }
      } else if (story) {
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
      }
    } else {
      console.error("Back navigation: No previous state found in history");
    }
  };

  // Handle restart with node mappings
  const handleRestart = async () => {
    if (!storyId) return;
    
    setStoryHistory([]);
    setCanGoBack(false);
    
    // Always reset to page 1
    setCurrentPage(1);
    setCurrentStoryPosition(1);
    
    if (usingCustomFormat && storyData) {
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
    }

    const count = await fetchCommentCount(storyId, 1);
    setCommentCount(count);
  };

  // Handle page change with node mappings 
  const handlePageChange = async (newPage: number) => {
    if (!storyId || newPage === currentPage || newPage < 1 || newPage > totalPages) {
      console.log(`Invalid page navigation attempt: current=${currentPage}, target=${newPage}, max=${totalPages}`);
      return;
    }
    
    console.log(`Navigating to page ${newPage} (current: ${currentPage})`);
    
    // Get the target node for this page
    const targetNode = nodeMappings.pageToNode[newPage];
    
    if (!targetNode) {
      console.error(`No node mapping found for page ${newPage}`);
      return;
    }
    
    // Save current state for back navigation
    if (usingCustomFormat) {
      setStoryHistory(prev => [...prev, currentNode]);
    } else if (story) {
      const currentState = story.state.toJson();
      setStoryHistory(prev => [...prev, currentState]);
    }
    
    setCanGoBack(true);
    
    if (usingCustomFormat && storyData) {
      if (storyData[targetNode]) {
        console.log(`Found node ${targetNode} for page ${newPage}`);
        
        setCurrentNode(targetNode);
        setCurrentText(storyData[targetNode].text);
        setCurrentChoices(storyData[targetNode].choices || []);
        
        setCurrentPage(newPage);
        setCurrentStoryPosition(newPage);
        
        const count = await fetchCommentCount(storyId, newPage);
        setCommentCount(count);
      } else {
        console.error(`Node "${targetNode}" not found in story data`);
      }
    } 
    else if (story) {
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
    }
  };

  // Update comment count
  const updateCommentCount = async () => {
    if (!storyId) return;
    const count = await fetchCommentCount(storyId, currentStoryPosition);
    setCommentCount(count);
  };

  // Return the state and actions
  return [
    {
      currentNode,
      currentPage,
      currentText,
      currentChoices,
      canContinue,
      canGoBack,
      commentCount,
      currentStoryPosition,
      storyHistory
    },
    {
      handleContinue,
      handleChoice,
      handleBack,
      handleRestart,
      handlePageChange,
      updateCommentCount
    }
  ];
};
