
import React from 'react';
import { StoryDisplay } from './StoryDisplay';
import { StoryControls } from './StoryControls';
import { BookHeader } from './BookHeader';
import { StoryChoice } from '@/lib/storyUtils';

interface BookLayoutProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  currentText: string;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  canGoBack: boolean;
  commentCount: number;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onBack: () => void;
  onRestart: () => void;
  onOpenComments: () => void;
}

export const BookLayout: React.FC<BookLayoutProps> = ({
  bookTitle,
  currentPage,
  totalPages,
  currentText,
  canContinue,
  choices,
  isEnding,
  canGoBack,
  commentCount,
  onContinue,
  onChoice,
  onBack,
  onRestart,
  onOpenComments
}) => {
  return (
    <div className="max-w-5xl w-full relative book-container">
      <BookHeader 
        bookTitle={bookTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        canGoBack={canGoBack}
        commentCount={commentCount}
        onBack={onBack}
        onRestart={onRestart}
        onOpenComments={onOpenComments}
      />
      
      {/* Book binding */}
      <div className="absolute left-1/2 top-0 bottom-0 w-4 -ml-2 bg-[#2E1D11] z-10"></div>
      
      {/* Book shadow */}
      <div className="absolute inset-0 shadow-xl rounded-lg"></div>
      
      {/* Book pages */}
      <div className="flex rounded-lg overflow-hidden">
        <StoryDisplay text={currentText} />
        <StoryControls 
          canContinue={canContinue}
          choices={choices}
          isEnding={isEnding}
          onContinue={onContinue}
          onChoice={onChoice}
          onRestart={onRestart}
        />
      </div>
    </div>
  );
};
