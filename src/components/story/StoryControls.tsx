
import React from 'react';
import { StoryChoices } from './StoryChoices';
import { StoryContinueButton } from './StoryContinueButton';
import { StoryChoice } from '@/lib/storyUtils';

interface StoryControlsProps {
  currentPage: number;
  totalPages: number;
  canContinue: boolean;
  canGoBack: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onBack: () => void;
  onRestart: () => void;
  onPageChange: (pageNumber: number) => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  currentPage,
  totalPages,
  canContinue,
  canGoBack,
  choices,
  isEnding,
  onContinue,
  onChoice,
  onBack,
  onRestart,
  onPageChange,
}) => {
  return (
    <div className="space-y-6 mt-6">
      {choices.length > 0 ? (
        <StoryChoices choices={choices} onChoice={onChoice} />
      ) : (
        <StoryContinueButton 
          onContinue={onContinue} 
          canContinue={canContinue} 
          isEnding={isEnding}
          onRestart={onRestart}
        />
      )}
    </div>
  );
};
