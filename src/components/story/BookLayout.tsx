
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
  currentNode: string;
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
  onPageChange: (pageNumber: number) => void;
}

export const BookLayout: React.FC<BookLayoutProps> = ({
  bookTitle,
  currentPage,
  totalPages,
  currentText,
  currentNode,
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
  onOpenComments,
  onPageChange
}) => {
  return (
    <div className="max-w-6xl w-full relative book-container mt-6 px-4 md:px-0 overflow-x-hidden">
      <BookHeader 
        bookTitle={bookTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        canGoBack={canGoBack}
        commentCount={commentCount}
        onBack={onBack}
        onRestart={onRestart}
        onOpenComments={onOpenComments}
        onPageChange={onPageChange}
      />
      
      {/* Book shadow - enhanced */}
      <div className="absolute inset-0 shadow-2xl rounded-lg"></div>
      
      {/* Book pages - stack on mobile, side-by-side on tablet and up */}
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden">
        {/* Story page - takes 40% on medium screens, 45% on large screens */}
        <div className="w-full md:w-2/5 lg:w-[45%]">
          <StoryDisplay 
            text={currentText} 
            canContinue={canContinue}
            choices={choices}
            isEnding={isEnding}
            onContinue={onContinue}
            onChoice={onChoice}
          />
        </div>
        
        {/* Comments page - takes 60% on medium screens, 55% on large screens */}
        <div className="w-full md:w-3/5 lg:w-[55%] mb-4 md:mb-0">
          <StoryControls 
            isEnding={isEnding}
            text={currentText}
            canContinue={canContinue}
            choices={choices}
            comments={comments}
            currentUser={currentUser}
            storyId={storyId}
            currentNode={currentNode}
            currentPage={currentPage}
            onOpenCommentModal={onOpenComments}
            onRestart={onRestart}
            canGoBack={canGoBack}
            onBack={onBack}
            onContinue={onContinue}
            onChoice={onChoice}
          />
        </div>
      </div>
    </div>
  );
};
