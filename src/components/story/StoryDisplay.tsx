import React from 'react';
import { StoryChoice, StoryDisplayProps } from '@/types';
import { StoryText } from './StoryText';
import { StoryContinueButton } from './StoryContinueButton';
import { StoryChoices } from './StoryChoices';
import { EmptyStoryContent } from './EmptyStoryContent';

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  text,
  storyId,
  currentNode,
  currentPage,
  canContinue,
  choices,
  isEnding,
  onContinue,
  onChoice,
  onRestart
}) => {
  return (
    <div className="prose prose-lg max-w-none overflow-hidden prose-headings:font-serif prose-p:font-serif">
      {text ? (
        <>
          <StoryText 
            text={text} 
            storyId={storyId}
            currentNode={currentNode}
            currentPage={currentPage}
          />
          
          {/* Story Controls - simplified for this component */}
          <div className="mt-4 md:mt-8">
            {isEnding ? (
              <div className="text-center">
                <p className="text-[#3A2618] font-serif mb-4">The story has ended.</p>
                <StoryContinueButton 
                  isEnding={true} 
                  onRestart={onRestart} 
                  label="Restart Story"
                />
              </div>
            ) : !text ? null : (
              <div className="space-y-4 md:space-y-6">
                {canContinue ? (
                  <StoryContinueButton 
                    onContinue={onContinue} 
                    canContinue={canContinue}
                  />
                ) : choices.length > 0 ? (
                  <StoryChoices choices={choices} onChoice={onChoice} />
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyStoryContent onContinue={onContinue} />
      )}
    </div>
  );
};
