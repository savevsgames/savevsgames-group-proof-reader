import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookNavigationProps } from '@/components/story/BookLayout';
// Import Comment type from the correct location
import { Comment } from '@/components/comments/types';

interface StoryControlsProps extends BookNavigationProps {
  commentCount: number;
  currentNode: string;
  storyId: string;
  comments: Comment[];
  onOpenComments: () => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  currentPage,
  totalPages,
  canContinue,
  canGoBack,
  choices,
  isEnding,
  commentCount,
  currentNode,
  storyId,
  comments,
  onContinue,
  onChoice,
  onBack,
  onRestart,
  onOpenComments,
  onPageChange,
}) => {
  return (
    <div className="flex flex-col items-center justify-center mt-6">
      <div className="flex justify-between w-full max-w-md mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Back
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenComments}
          className="relative"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Comments
          {commentCount > 0 && (
            <span className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full px-2 text-xs">
              {commentCount}
            </span>
          )}
        </Button>
      </div>

      <div className="flex justify-center items-center space-x-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>

      {canContinue && (
        <Button onClick={onContinue} className="w-full max-w-md mb-4">
          Continue
        </Button>
      )}

      {choices.length > 0 && (
        <div className="w-full max-w-md">
          {choices.map((choice: any, index: number) => (
            <Button
              key={index}
              onClick={() => onChoice(index)}
              className="w-full mb-2"
            >
              {choice.text}
            </Button>
          ))}
        </div>
      )}

      {isEnding && (
        <Button onClick={onRestart} className="w-full max-w-md">
          Restart Story
        </Button>
      )}
    </div>
  );
};
