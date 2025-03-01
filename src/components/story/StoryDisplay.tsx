
import React from 'react';
import { StoryChoice } from '@/lib/storyUtils';
import { StoryText } from './StoryText';
import { StoryContinueButton } from './StoryContinueButton';
import { StoryChoices } from './StoryChoices';
import { EmptyStoryContent } from './EmptyStoryContent';

interface StoryDisplayProps {
  text: string;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onRestart?: () => void; // Add the onRestart prop
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  text,
  canContinue,
  choices,
  isEnding,
  onContinue,
  onChoice,
  onRestart
}) => {
  return (
    <div className="w-full bg-[#E8DCC4] p-4 md:p-6 lg:p-10 min-h-[400px] md:min-h-[600px] relative book-page rounded-lg md:rounded-none shadow-md md:shadow-none">
      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        {text ? (
          <>
            <StoryText text={text} />
            
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
    </div>
  );
};
