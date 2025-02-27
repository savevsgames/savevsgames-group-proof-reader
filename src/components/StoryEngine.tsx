
import React, { useState, useEffect } from 'react';
import storyContent from '../stories/dog-story.json';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

type StoryNode = {
  text: string;
  choices: {
    text: string;
    nextNode: string;
  }[];
  isEnding?: boolean;
};

type StoryContent = {
  [key: string]: StoryNode;
};

export const StoryEngine = () => {
  const [currentNode, setCurrentNode] = useState<string>('start');
  const [nodeContent, setNodeContent] = useState<StoryNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      console.log("Initializing story...");
      const content = storyContent as StoryContent;
      setNodeContent(content[currentNode]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing story:', error);
      setIsLoading(false);
    }
  }, [currentNode]);

  const handleChoice = (nextNode: string) => {
    setCurrentNode(nextNode);
  };

  const handleRestart = () => {
    setCurrentNode('start');
  };

  if (isLoading || !nodeContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-fade-in">Loading story...</div>
      </div>
    );
  }

  const isEnding = nodeContent.isEnding || nodeContent.choices.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <div className="story-text animate-fade-in mb-8">
            {nodeContent.text}
          </div>
          
          {!isEnding ? (
            <div className="choices-container space-y-4">
              {nodeContent.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(choice.nextNode)}
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
