
import React, { useState, useEffect } from 'react';
import { Story } from 'inkjs';
import storyContent from '../stories/dog-story.ink.json';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

export const StoryEngine = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [currentText, setCurrentText] = useState<string>('');
  const [currentChoices, setCurrentChoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const initStory = async () => {
      try {
        const newStory = new Story(storyContent);
        setStory(newStory);
        
        // Initial continuation of the story
        let text = '';
        while (newStory.canContinue) {
          text += newStory.Continue() + '\n';
        }
        
        setCurrentText(text.trim());
        setCurrentChoices(newStory.currentChoices);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing story:', error);
        setIsLoading(false);
      }
    };

    initStory();
  }, []);

  const continueStory = (storyToUse: Story) => {
    if (!storyToUse.canContinue && storyToUse.currentChoices.length === 0) {
      setHasEnded(true);
      return;
    }

    let newText = '';
    while (storyToUse.canContinue) {
      newText += storyToUse.Continue() + '\n';
    }

    setCurrentText(newText.trim());
    setCurrentChoices(storyToUse.currentChoices);
  };

  const handleChoice = (index: number) => {
    if (!story) return;
    
    story.ChooseChoiceIndex(index);
    continueStory(story);
  };

  const handleRestart = () => {
    if (!story) return;
    
    story.ResetState();
    setHasEnded(false);
    continueStory(story);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-fade-in">Loading story...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <div className="story-text animate-fade-in mb-8">
            {currentText}
          </div>
          
          {!hasEnded ? (
            <div className="choices-container space-y-4">
              {currentChoices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(index)}
                  className="choice-button w-full text-left px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center mt-8 animate-fade-in">
              <p className="text-gray-600 mb-4">The story has ended.</p>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
