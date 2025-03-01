
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
    <div className="max-w-6xl w-full relative book-container mt-6 px-4 md:px-0 mx-auto bg-[#3A2618] rounded-lg overflow-hidden">
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
      
      {/* Enhanced book shadow */}
      <div className="absolute inset-0 shadow-2xl rounded-lg"></div>
      
      {/* Book pages - consistent side-by-side layout with parent controlling height */}
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden min-h-[600px] h-[80vh]">
        {/* Story page */}
        <div className="w-full md:w-2/5 lg:w-[45%] h-full relative">
          <div className="absolute inset-0 bg-[#E8DCC4] p-4 md:p-6 lg:p-10 book-page rounded-lg md:rounded-l-lg md:rounded-r-none overflow-y-auto">
            <StoryDisplay 
              text={currentText} 
              canContinue={canContinue}
              choices={choices}
              isEnding={isEnding}
              onContinue={onContinue}
              onChoice={onChoice}
              onRestart={onRestart}
            />
          </div>
        </div>
        
        {/* Comments page */}
        <div className="w-full md:w-3/5 lg:w-[55%] h-full relative">
          <div className="absolute inset-0 bg-[#E8DCC4] p-4 md:p-6 lg:p-10 book-page rounded-lg md:rounded-l-none md:rounded-r-lg overflow-y-auto">
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
