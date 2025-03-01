
import React from 'react';
import { StoryChoice } from '@/lib/storyUtils';

interface StoryChoicesProps {
  choices: StoryChoice[];
  onChoice: (index: number) => void;
}

export const StoryChoices: React.FC<StoryChoicesProps> = ({ choices, onChoice }) => {
  if (choices.length === 0) return null;
  
  return (
    <>
      <p className="text-[#3A2618] font-serif text-center italic">What would you like to do?</p>
      <div className="flex flex-col space-y-4 md:space-y-6">
        {choices.map((choice, index) => (
          <div key={`choice-${index}`} className="text-center">
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
  );
};
