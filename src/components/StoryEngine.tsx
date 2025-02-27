
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Story } from 'inkjs';
import darkEyeStoryJson from '../stories/ShadowtideEndTestJSON.json';
import { useToast } from '@/hooks/use-toast';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import { MessageSquare } from 'lucide-react';
import { CommentModal } from './CommentModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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

// Map story IDs to their respective story data files
const storyMap: Record<string, any> = {
  'dark-eye-story': darkEyeStoryJson
};

export const StoryEngine = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [customStory, setCustomStory] = useState<CustomStory | null>(null);
  const [usingCustomFormat, setUsingCustomFormat] = useState(false);
  const [currentNode, setCurrentNode] = useState<string>('start');
  const [currentText, setCurrentText] = useState<string[]>([]);
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
  const [totalPages, setTotalPages] = useState(16); // Estimated from the story content
  
  // Comment state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [currentStoryPosition, setCurrentStoryPosition] = useState<string>('');

  // Initialize the story
  useEffect(() => {
    try {
      if (!storyId || !storyMap[storyId]) {
        setError(`Story not found: ${storyId}`);
        setIsLoading(false);
        return;
      }

      // Get the story data
      const storyData = storyMap[storyId];
      console.log("Loading story:", storyId);
      
      // Check if it's a custom format (has a "start" node) or an inkjs format
      if (storyData.start) {
        console.log("Using custom story format");
        setUsingCustomFormat(true);
        setCustomStory(storyData);
        setCurrentNode('start');
        setCurrentText([storyData.start.text]);
        setCurrentChoices(storyData.start.choices);
        setCurrentStoryPosition('start');
        fetchCommentCount(storyId, 'start');
        setIsLoading(false);
      } else {
        // It's an inkjs format
        console.log("Using inkjs story format");
        try {
          const newStory = new Story(storyData);
          setStory(newStory);
          setUsingCustomFormat(false);
          
          // Continue the story until we get to the first choice
          const text: string[] = [];
          while (newStory.canContinue) {
            const nextText = newStory.Continue();
            text.push(nextText);
          }
          
          setCurrentText(text);
          setCurrentChoices(newStory.currentChoices);
          
          // Save current story position for comments
          if (newStory.state) {
            const position = newStory.state.toJson();
            setCurrentStoryPosition(position);
            fetchCommentCount(storyId, position);
          }
        } catch (storyError) {
          console.error('Error initializing inkjs story:', storyError);
          setError(`Error loading story: ${storyError.message}`);
          toast({
            title: "Story Error",
            description: "There was an issue loading the story. Please try another story or check if you've replaced the placeholder JSON files with properly compiled Ink stories.",
            variant: "destructive"
          });
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('General error:', error);
      setError('Failed to load story data');
      setIsLoading(false);
    }
  }, [storyId, toast]);

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
      setCurrentText([nextStoryNode.text]);
      setCurrentChoices(nextStoryNode.choices);
      setCurrentStoryPosition(nextNode);
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
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

    // Make the choice and continue the story
    story.ChooseChoiceIndex(index);
    
    const text: string[] = [];
    while (story.canContinue) {
      const nextText = story.Continue();
      text.push(nextText);
    }

    setCurrentText(text);
    setCurrentChoices(story.currentChoices);
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
    
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
      setCurrentPage(prev => Math.max(prev - 1, 1));
      
      if (usingCustomFormat && customStory) {
        // For custom format, previousState is the node name
        const prevNode = customStory[previousState];
        if (prevNode) {
          setCurrentNode(previousState);
          setCurrentText([prevNode.text]);
          setCurrentChoices(prevNode.choices);
          setCurrentStoryPosition(previousState);
          fetchCommentCount(storyId || '', previousState);
        }
      } else if (story) {
        // For inkjs format
        story.state.LoadJson(previousState);
        
        // Update current text and choices
        const text: string[] = [];
        while (story.canContinue) {
          const nextText = story.Continue();
          text.push(nextText);
        }
        
        setCurrentText(text);
        setCurrentChoices(story.currentChoices);
        
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
    
    if (usingCustomFormat && customStory) {
      // Reset to start node for custom format
      setCurrentNode('start');
      setCurrentText([customStory.start.text]);
      setCurrentChoices(customStory.start.choices);
      setCurrentStoryPosition('start');
      fetchCommentCount(storyId || '', 'start');
    } else if (story) {
      // Reset inkjs story
      story.ResetState();
      
      const text: string[] = [];
      while (story.canContinue) {
        const nextText = story.Continue();
        text.push(nextText);
      }
      
      setCurrentText(text);
      setCurrentChoices(story.currentChoices);
      
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

  const isEnding = currentChoices.length === 0;

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
              <div className="story-text mb-16 text-[#3A2618] font-serif leading-relaxed text-lg space-y-4">
                {currentText.map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right page */}
          <div className="w-1/2 bg-[#E8DCC4] p-6 md:p-10 min-h-[600px] flex flex-col justify-end book-page">
            {!isEnding ? (
              <div className="space-y-6 mb-10">
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
