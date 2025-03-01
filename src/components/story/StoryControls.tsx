
import React from 'react';
import { StoryContinueButton } from './StoryContinueButton';
import { StoryChoices } from './StoryChoices';
import { StoryChoice } from '@/lib/storyUtils';

interface StoryControlsProps {
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  text: string;
  onContinue: () => void;
  onChoice: (index: number) => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  canContinue,
  choices,
  isEnding,
  text,
  onContinue,
  onChoice
}) => {
  if (isEnding || !text) return null;
  
  return (
    <div className="space-y-4 md:space-y-6">
      {canContinue ? (
        <StoryContinueButton onClick={onContinue} />
      ) : choices.length > 0 ? (
        <StoryChoices choices={choices} onChoice={onChoice} />
      ) : null}
    </div>
  );
};
