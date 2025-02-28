
import React from 'react';
import { StoryDisplay } from './StoryDisplay';
import { StoryControls } from './StoryControls';
import { BookHeader } from './BookHeader';
import { StoryChoice } from '@/lib/storyUtils';
import { Comment } from '../CommentModal';
import { User } from '@/lib/supabase';

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
  comments: Comment[];
  currentUser: User | null;
  storyId: string;
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
  comments,
  currentUser,
  storyId,
  onContinue,
  onChoice,
  onBack,
  onRestart,
  onOpenComments
}) => {
  return (
    <div className="max-w-5xl w-full relative book-container mt-6 px-4 md:px-0 overflow-x-hidden">
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
      
      {/* Book binding - only show on md screens and up */}
      <div className="absolute left-1/2 top-0 bottom-0 w-4 -ml-2 bg-[#2E1D11] z-10 hidden md:block"></div>
      
      {/* Book shadow - enhanced */}
      <div className="absolute inset-0 shadow-2xl rounded-lg"></div>
      
      {/* Book pages - stack on mobile, side-by-side on tablet and up */}
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden">
        <StoryDisplay 
          text={currentText} 
          canContinue={canContinue}
          choices={choices}
          isEnding={isEnding}
          onContinue={onContinue}
          onChoice={onChoice}
        />
        <StoryControls 
          isEnding={isEnding}
          comments={comments}
          currentUser={currentUser}
          storyId={storyId}
          onOpenCommentModal={onOpenComments}
          onRestart={onRestart}
        />
      </div>
    </div>
  );
};
