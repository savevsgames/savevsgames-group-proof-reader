
import React from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';
import { StoryChoice } from '@/lib/storyUtils';

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
  // Process text to handle newlines, which is common in Ink.js text output
  const formattedText = text
    .split('\n')
    .map((paragraph, index) => (
      <p key={index} className="mb-4">{paragraph}</p>
    ));

  return (
    <div className="w-full bg-[#E8DCC4] p-4 md:p-6 lg:p-10 min-h-[400px] md:min-h-[600px] relative book-page rounded-lg md:rounded-none shadow-md md:shadow-none">
      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        <div className="story-text mb-8 md:mb-16 text-[#3A2618] font-serif leading-relaxed text-base md:text-lg">
          {formattedText}
        </div>
        
        {/* Story Controls - now on the left page */}
        <div className="mt-4 md:mt-8">
          {!isEnding ? (
            <div className="space-y-4 md:space-y-6">
              {canContinue ? (
                <div className="flex justify-center">
                  <Button 
                    onClick={onContinue}
                    className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
                  >
                    Continue Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : choices.length > 0 ? (
                <>
                  <p className="text-[#3A2618] font-serif text-center italic">What would you like to do?</p>
                  <div className="flex flex-col space-y-4 md:space-y-6">
                    {choices.map((choice, index) => (
                      <div key={index} className="text-center">
                        <button
                          onClick={() => onChoice(index)}
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
          ) : null}
        </div>
      </div>
    </div>
  );
};
