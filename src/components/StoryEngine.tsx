
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Story } from 'inkjs';
import { useToast } from '@/hooks/use-toast';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { CommentModal } from './CommentModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';

// Define interfaces for the custom story format
interface StoryChoice {
  text: string;
  nextNode: string;
}

interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
}

interface CustomStory {
  [key: string]: StoryNode;
}

// Map to track story sections for page counting
const storyNodeToPageMap: Record<string, number> = {
  'root': 1,
  'vault_description': 2,
  'dark_eye_introduction': 3,
  'mages_attempt': 4,
  'kavan_arrival': 5,
  'kavan_determination': 6,
  'dark_eye_awakens': 7,
  'dark_eye_speaks': 8,
  'kavan_response': 9,
  'battle_begins': 10,
  'kavan_struggle': 11,
  'kavan_love': 12,
  'kavan_fight': 13,
  'dark_eye_reaction': 14,
  'dark_eye_withdraws': 15,
  'final_blast': 16,
  'story_ending': 17
};

// Define an interface for book data
interface BookData {
  id: string;
  title: string;
  story_url?: string;
}

export const StoryEngine = () => {
  const { storyId } = useParams<{ storyId: string }>();
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Book info state
  const [bookTitle, setBookTitle] = useState('Shadowtide');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(17); // There are 17 distinct sections in this story (including the ending)
  
  // Comment state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [currentStoryPosition, setCurrentStoryPosition] = useState<string>('');
  
  // State to track if the story can continue
  const [canContinue, setCanContinue] = useState(false);
  
  // Track current story path for page counting
  const [currentPath, setCurrentPath] = useState<string>('root');

  // First, fetch the book details and story URL
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!storyId) {
        setError('No story ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', storyId)
          .single();

        if (error) {
          console.error("Error fetching book:", error);
          throw new Error(`Failed to fetch book details: ${error.message}`);
        }

        if (!data) {
          throw new Error('Book not found');
        }

        console.log("Fetched book data:", data);
        
        // Set book title for display
        if (data.title) {
          setBookTitle(data.title);
        }
        
        // Determine if we need to set total pages
        if (data.total_pages) {
          setTotalPages(data.total_pages);
        }

        // Now attempt to load the story content from the URL
        if (data.story_url) {
          await fetchStoryContent(data.story_url);
        } else {
          throw new Error('This book has no story content URL');
        }
      } catch (err) {
        console.error("Error in fetchBookDetails:", err);
        setError(err.message || 'Failed to load story');
        setIsLoading(false);
        toast({
          title: "Error",
          description: err.message || "Failed to load story",
          variant: "destructive"
        });
      }
    };

    fetchBookDetails();
  }, [storyId, toast]);

  // Function to fetch story content from URL
  const fetchStoryContent = async (storyUrl: string) => {
    try {
      console.log("Fetching story from URL:", storyUrl);
      const response = await fetch(storyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch story content: ${response.statusText}`);
      }
      
      const storyData = await response.json();
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
        fetchCommentCount(storyId || '', 'start');
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
            fetchCommentCount(storyId || '', position);
          }
        } catch (storyError) {
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
            fetchCommentCount(storyId || '', 'root');
          } else {
            throw new Error(`Error loading story: ${storyError.message}`);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching story content:', error);
      setError(`Failed to load story content: ${error.message}`);
      setIsLoading(false);
      toast({
        title: "Story Error",
        description: `There was an issue loading the story: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Helper function to extract a custom story format from ink JSON
  const extractCustomStoryFromInkJSON = (inkJSON: any): CustomStory => {
    try {
      const customStory: CustomStory = {};
      
      // Extract the root node text
      if (inkJSON.root && Array.isArray(inkJSON.root) && inkJSON.root.length > 0) {
        const rootText = inkJSON.root
          .filter(item => typeof item === 'string' && item.startsWith('^'))
          .map(item => (item as string).substring(1))
          .join(' ');
        
        customStory.root = {
          text: rootText || "Story begins...",
          choices: [{
            text: "Continue",
            nextNode: "vault_description"
          }]
        };
        
        // Try to extract other nodes from the structure
        if (inkJSON.vault_description) {
          extractNodesRecursively(inkJSON, customStory, "vault_description");
        }
      }
      
      return customStory;
    } catch (e) {
      console.error("Error extracting custom story from Ink JSON:", e);
      return {
        root: {
          text: "Failed to parse story format.",
          choices: []
        }
      };
    }
  };
  
  // Helper to recursively extract nodes
  const extractNodesRecursively = (inkJSON: any, customStory: CustomStory, nodeName: string) => {
    if (!inkJSON[nodeName]) return;
    
    try {
      // Extract text from the node
      const nodeText = Array.isArray(inkJSON[nodeName][0]) 
        ? inkJSON[nodeName][0]
            .filter(item => typeof item === 'string' && item.startsWith('^'))
            .map(item => (item as string).substring(1))
            .join(' ')
        : "Continue the story...";
      
      // Find the next node reference if any
      let nextNode = "";
      if (Array.isArray(inkJSON[nodeName][0])) {
        const lastItem = inkJSON[nodeName][0][inkJSON[nodeName][0].length - 1];
        if (lastItem && typeof lastItem === 'object' && lastItem["^->"]) {
          nextNode = lastItem["^->"];
        }
      }
      
      customStory[nodeName] = {
        text: nodeText,
        choices: nextNode ? [{
          text: "Continue",
          nextNode: nextNode
        }] : []
      };
      
      // If we found a next node, recursively process it
      if (nextNode && !customStory[nextNode]) {
        extractNodesRecursively(inkJSON, customStory, nextNode);
      }
    } catch (e) {
      console.error(`Error extracting node ${nodeName}:`, e);
    }
  };

  // Fetch comment count for the current position
  const fetchCommentCount = async (sid: string, position: string) => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', sid)
        .eq('story_position', position);
      
      if (error) {
        throw error;
      }
      
      setCommentCount(count || 0);
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };

  // Handle the "Continue" button for inkjs format
  const handleContinue = () => {
    if (!story) return;
    
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
      fetchCommentCount(storyId || '', position);
    }
  };

  // Handle choice for custom story format
  const handleCustomChoice = (nextNode: string) => {
    if (!customStory) return;

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
      
      fetchCommentCount(storyId || '', nextNode);
    } else {
      console.error(`Node "${nextNode}" not found in story`);
      setError(`Story navigation error: Node "${nextNode}" not found`);
    }
  };

  // Handle choice for inkjs format
  const handleInkChoice = (index: number) => {
    if (!story) return;

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
      // If we can't parse the state, just increment the page
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }
    
    // Update current story position for comments
    if (story.state) {
      const position = story.state.toJson();
      setCurrentStoryPosition(position);
      fetchCommentCount(storyId || '', position);
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
  const handleBack = () => {
    if (storyHistory.length === 0) return;

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
          
          fetchCommentCount(storyId || '', previousState);
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
          fetchCommentCount(storyId || '', position);
        }
      }
    }
  };

  // Reset functionality
  const handleRestart = () => {
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
      fetchCommentCount(storyId || '', 'start');
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
        fetchCommentCount(storyId || '', position);
      }
    }
  };
  
  // Handle the comment modal open state change
  const handleCommentModalOpenChange = (open: boolean) => {
    setIsCommentModalOpen(open);
    
    // Refresh comment count when modal closes (in case comments were added/deleted)
    if (!open) {
      fetchCommentCount(storyId || '', currentStoryPosition);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3A2618]">
        <div className="animate-fade-in text-[#E8DCC4] font-serif">Loading story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3A2618]">
        <div className="text-[#E8DCC4] font-serif">
          <p className="text-xl mb-4">Error: {error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-[#F97316] text-[#E8DCC4] font-serif rounded hover:bg-[#E86305] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isEnding = currentChoices.length === 0 && !canContinue;

  return (
    <div className="min-h-screen bg-[#3A2618] py-8 px-4 flex items-center justify-center">
      <div className="max-w-5xl w-full relative book-container">
        {/* Book Title and Page Number */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 bg-[#F97316] text-[#E8DCC4] px-4 py-1 rounded-full z-10 whitespace-nowrap">
          <span className="font-serif">{bookTitle} - Page {currentPage} of {totalPages}</span>
        </div>
        
        {/* Controls */}
        <div className="absolute right-2 top-2 z-10 flex gap-2">
          {canGoBack && (
            <button 
              onClick={handleBack}
              className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
              title="Go back"
            >
              ↩
            </button>
          )}
          <button 
            onClick={handleRestart} 
            className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            title="Reset story"
          >
            ✕
          </button>
          <button 
            onClick={() => setIsCommentModalOpen(true)}
            className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors relative"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            title="Comments"
          >
            <MessageSquare className="h-5 w-5" />
            
            <div className="absolute -top-2 -right-2 bg-white text-[#3A2618] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {commentCount}
            </div>
          </button>
        </div>
        
        {/* Book binding */}
        <div className="absolute left-1/2 top-0 bottom-0 w-4 -ml-2 bg-[#2E1D11] z-10"></div>
        
        {/* Book shadow */}
        <div className="absolute inset-0 shadow-xl rounded-lg"></div>
        
        {/* Book pages */}
        <div className="flex rounded-lg overflow-hidden">
          {/* Left page */}
          <div className="w-1/2 bg-[#E8DCC4] p-6 md:p-10 min-h-[600px] relative book-page">
            <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
              <div className="story-text mb-16 text-[#3A2618] font-serif leading-relaxed text-lg">
                <p>{currentText}</p>
              </div>
            </div>
          </div>
          
          {/* Right page */}
          <div className="w-1/2 bg-[#E8DCC4] p-6 md:p-10 min-h-[600px] flex flex-col justify-end book-page">
            {!isEnding ? (
              <div className="space-y-6 mb-10">
                {canContinue ? (
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleContinue}
                      className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
                    >
                      Continue Reading <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : currentChoices.length > 0 ? (
                  <>
                    <p className="text-[#3A2618] font-serif text-center italic">What would you like to do?</p>
                    <div className="flex flex-col space-y-6">
                      {currentChoices.map((choice, index) => (
                        <div key={index} className="text-center">
                          <button
                            onClick={() => handleChoice(index)}
                            className="font-serif text-[#3A2618] hover:text-[#F97316] transition-colors border-b border-[#3A2618] hover:border-[#F97316] px-4 py-1 italic"
                          >
                            {choice.text}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="text-center mt-8 mb-10">
                <p className="text-[#3A2618] font-serif mb-6">The story has ended.</p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-[#F97316] text-[#E8DCC4] font-serif rounded hover:bg-[#E86305] transition-colors"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onOpenChange={handleCommentModalOpenChange}
        storyId={storyId || ''}
        storyPosition={currentStoryPosition}
        currentUser={user}
      />
    </div>
  );
};
