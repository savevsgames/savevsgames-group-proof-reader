
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import dogStory from '../stories/dog-story.json';
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

// Map story IDs to their respective story data files
const storyMap: Record<string, any> = {
  'dog-story': dogStory
};

export const StoryEngine = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [currentNode, setCurrentNode] = useState<string>('start');
  const [nodeContent, setNodeContent] = useState<StoryNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log("Initializing story...", storyId);
      
      if (!storyId || !storyMap[storyId]) {
        setError(`Story not found: ${storyId}`);
        setIsLoading(false);
        return;
      }
      
      const content = storyMap[storyId] as StoryContent;
      
      if (!content[currentNode]) {
        setError(`Node not found in story: ${currentNode}`);
        setIsLoading(false);
        return;
      }
      
      setNodeContent(content[currentNode]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing story:', error);
      setError('Failed to load story data');
      setIsLoading(false);
    }
  }, [storyId, currentNode]);

  const handleChoice = (nextNode: string) => {
    setCurrentNode(nextNode);
  };

  const handleRestart = () => {
    setCurrentNode('start');
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
            className="px-6 py-3 bg-[#8B2E2E] text-[#E8DCC4] font-serif rounded hover:bg-[#6A2424] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!nodeContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3A2618]">
        <div className="text-[#E8DCC4] font-serif">Story content not found</div>
      </div>
    );
  }

  const isEnding = nodeContent.isEnding || nodeContent.choices.length === 0;

  return (
    <div className="min-h-screen bg-[#3A2618] py-8 px-4 flex items-center justify-center">
      <div className="max-w-5xl w-full relative book-container">
        {/* Close button */}
        <button 
          onClick={handleRestart} 
          className="absolute right-2 top-2 z-10 bg-[#8B2E2E] text-[#E8DCC4] w-10 h-10 flex items-center justify-center"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
        >
          ✕
        </button>
        
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
                {nodeContent.text}
              </div>
            </div>
          </div>
          
          {/* Right page */}
          <div className="w-1/2 bg-[#E8DCC4] p-6 md:p-10 min-h-[600px] flex flex-col justify-end book-page">
            {!isEnding ? (
              <div className="space-y-4 mb-10">
                <p className="text-[#3A2618] font-serif mb-4">What would you like to do?</p>
                <div className="flex flex-col space-y-4">
                  {nodeContent.choices.map((choice, index) => (
                    <div key={index} className="text-center">
                      <button
                        onClick={() => handleChoice(choice.nextNode)}
                        className="choice-text font-serif text-[#3A2618] hover:text-[#8B2E2E] transition-colors inline-block border-b border-[#3A2618] hover:border-[#8B2E2E] px-4 py-1"
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
                  className="px-6 py-3 bg-[#8B2E2E] text-[#E8DCC4] font-serif rounded hover:bg-[#6A2424] transition-colors"
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
