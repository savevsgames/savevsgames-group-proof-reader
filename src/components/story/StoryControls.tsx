
import React from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';

interface StoryChoice {
  text: string;
  nextNode?: string;
}

interface StoryControlsProps {
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onRestart: () => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  canContinue,
  choices,
  isEnding,
  onContinue,
  onChoice,
  onRestart
}) => {
  return (
    <div className="w-1/2 bg-[#E8DCC4] p-6 md:p-10 min-h-[600px] flex flex-col justify-end book-page">
      {!isEnding ? (
        <div className="space-y-6 mb-10">
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
              <div className="flex flex-col space-y-6">
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
      ) : (
        <div className="text-center mt-8 mb-10">
          <p className="text-[#3A2618] font-serif mb-6">The story has ended.</p>
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-[#F97316] text-[#E8DCC4] font-serif rounded hover:bg-[#E86305] transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};
