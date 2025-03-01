
import React from 'react';
import { StoryContinueButton } from './StoryContinueButton';

interface EmptyStoryContentProps {
  onContinue: () => void;
}

export const EmptyStoryContent: React.FC<EmptyStoryContentProps> = ({ onContinue }) => {
  return (
    <div className="text-center italic">
      <p>No content available for this node.</p>
      <div className="mt-4">
        <StoryContinueButton onClick={onContinue} label="Continue" />
      </div>
    </div>
  );
};
