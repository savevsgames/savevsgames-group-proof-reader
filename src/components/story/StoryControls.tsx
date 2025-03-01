
import React from 'react';
import { StoryContinueButton } from './StoryContinueButton';
import { StoryChoices } from './StoryChoices';
import { StoryChoice } from '@/lib/storyUtils';
import { Comment } from '../CommentModal';
import { User } from '@/lib/supabase';

interface StoryControlsProps {
  canContinue?: boolean;
  choices?: StoryChoice[];
  isEnding: boolean;
  text?: string;
  comments?: Comment[];
  currentUser: User | null;
  storyId: string;
  canGoBack: boolean;
  onContinue?: () => void;
  onChoice?: (index: number) => void;
  onOpenCommentModal: () => void;
  onRestart: () => void;
  onBack: () => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  canContinue,
  choices = [],
  isEnding,
  text = '',
  comments = [],
  currentUser,
  storyId,
  canGoBack,
  onContinue,
  onChoice,
  onOpenCommentModal,
  onRestart,
  onBack
}) => {
  if (isEnding || !text) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-4">
          <StoryContinueButton onClick={onRestart} label="Restart Story" />
          <button 
            onClick={onOpenCommentModal}
            className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
          >
            View Comments
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      {canContinue && onContinue ? (
        <StoryContinueButton onClick={onContinue} />
      ) : choices.length > 0 && onChoice ? (
        <StoryChoices choices={choices} onChoice={onChoice} />
      ) : null}
      
      <div className="flex flex-col space-y-2 mt-6">
        {canGoBack && (
          <button 
            onClick={onBack}
            className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
          >
            Go Back
          </button>
        )}
        <button 
          onClick={onOpenCommentModal}
          className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
        >
          View Comments ({comments.length})
        </button>
      </div>
    </div>
  );
};
