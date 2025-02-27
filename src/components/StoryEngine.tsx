
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Story } from 'inkjs';
import dogStoryJson from '../stories/placeholder-dog-story.json';
import darkEyeStoryJson from '../stories/placeholder-dark-eye-story.json';
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

// Map story IDs to their respective story data files
const storyMap: Record<string, any> = {
  'dog-story': dogStoryJson,
  'dark-eye-story': darkEyeStoryJson
};

export const StoryEngine = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [currentText, setCurrentText] = useState<string[]>([]);
  const [currentChoices, setCurrentChoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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

      // Create a new story instance with the imported JSON
      const storyData = storyMap[storyId];
      console.log("Loading story:", storyId);
      
      try {
        const newStory = new Story(storyData);
        setStory(newStory);
        
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
        
        setIsLoading(false);
      } catch (storyError) {
        console.error('Error initializing story:', storyError);
        setError(`Error loading story: ${storyError.message}`);
        toast({
          title: "Story Error",
          description: "There was an issue loading the story. Please try another story or check if you've replaced the placeholder JSON files with properly compiled Ink stories.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
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

  const handleChoice = (index: number) => {
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
    
    // Update current story position for comments
    if (story.state) {
      const position = story.state.toJson();
      setCurrentStoryPosition(position);
      fetchCommentCount(storyId || '', position);
    }
  };

  const handleBack = () => {
    if (!story || storyHistory.length === 0) return;

    // Pop the last state from history
    const newHistory = [...storyHistory];
    const previousState = newHistory.pop();
    
    if (previousState) {
      story.state.LoadJson(previousState);
      setStoryHistory(newHistory);
      
      // Update current text and choices
      const text: string[] = [];
      while (story.canContinue) {
        const nextText = story.Continue();
        text.push(nextText);
      }
      
      setCurrentText(text);
      setCurrentChoices(story.currentChoices);
      setCanGoBack(newHistory.length > 0);
      
      // Update current story position for comments
      if (story.state) {
        const position = story.state.toJson();
        setCurrentStoryPosition(position);
        fetchCommentCount(storyId || '', position);
      }
    }
  };

  const handleRestart = () => {
    if (!story) return;
    
    story.ResetState();
    setStoryHistory([]);
    setCanGoBack(false);
    
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
            
            {commentCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-white text-[#3A2618] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {commentCount}
              </div>
            )}
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
