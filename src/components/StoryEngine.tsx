
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Story } from 'inkjs';
import dogStory from '../stories/dog-story.ink.json';
import darkEyeStory from '../stories/dark-eye-story.ink.json';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

// Map story IDs to their respective story data files
const storyMap: Record<string, any> = {
  'dog-story': dogStory,
  'dark-eye-story': darkEyeStory
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

  // Initialize the story
  useEffect(() => {
    try {
      if (!storyId || !storyMap[storyId]) {
        setError(`Story not found: ${storyId}`);
        setIsLoading(false);
        return;
      }

      const newStory = new Story(storyMap[storyId]);
      setStory(newStory);
      
      // Continue the story until we get to the first choice
      const text: string[] = [];
      while (newStory.canContinue) {
        const nextText = newStory.Continue();
        text.push(nextText);
      }
      
      setCurrentText(text);
      setCurrentChoices(newStory.currentChoices);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing story:', error);
      setError('Failed to load story data');
      setIsLoading(false);
    }
  }, [storyId]);

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
            onClick={() => window.history.back()}
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
            >
              ↩
            </button>
          )}
          <button 
            onClick={handleRestart} 
            className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
          >
            ✕
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
    </div>
  );
};
