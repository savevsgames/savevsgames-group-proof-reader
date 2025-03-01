
import React from 'react';
import { StoryChoice } from '@/lib/storyUtils';
import { StoryText } from './StoryText';
import { StoryControls } from './StoryControls';
import { EmptyStoryContent } from './EmptyStoryContent';

interface StoryDisplayProps {
  text: string;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  text,
  canContinue,
  choices,
  isEnding,
  onContinue,
  onChoice
}) => {
  return (
    <div className="w-full bg-[#E8DCC4] p-4 md:p-6 lg:p-10 min-h-[400px] md:min-h-[600px] relative book-page rounded-lg md:rounded-none shadow-md md:shadow-none">
      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        {text ? (
          <>
            <StoryText text={text} />
            
            {/* Story Controls - now on the left page */}
            <div className="mt-4 md:mt-8">
              <StoryControls
                canContinue={canContinue}
                choices={choices}
                isEnding={isEnding}
                text={text}
                onContinue={onContinue}
                onChoice={onChoice}
              />
            </div>
          </>
        ) : (
          <EmptyStoryContent onContinue={onContinue} />
        )}
      </div>
    </div>
  );
};
