
import React from 'react';
import { StoryDisplay } from './StoryDisplay';
import { BookHeader } from './BookHeader';
import { StoryChoice } from '@/lib/storyUtils';
import { Comment } from '../comments/types';
import { User } from '@/lib/supabase';
import CommentsView from './CommentsView';

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
      
      {/* Book pages - side-by-side layout */}
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden">
        {/* Story page - story content and controls */}
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
        
        {/* Comments page - only shows comments */}
        <div className="w-full md:w-3/5 lg:w-[55%] mb-4 md:mb-0">
          <div className="w-full bg-white p-4 md:p-6 lg:p-8 min-h-[400px] md:min-h-[600px] rounded-lg md:rounded-none">
            <h3 className="text-xl font-serif mb-4">Comments</h3>
            <CommentsView 
              storyId={storyId}
              currentNode={currentNode}
              currentPage={currentPage}
              onCommentsUpdate={(count) => {/* This is a no-op to prevent unnecessary re-renders */}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
