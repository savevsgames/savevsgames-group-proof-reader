import React, { useState } from 'react';
import { StoryDisplay } from './StoryDisplay';
import { StoryControls } from './StoryControls';
import { BookHeader } from './BookHeader';
import { StoryChoice } from '@/lib/storyUtils';
import { Comment } from '../CommentModal';
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
  const [showComments, setShowComments] = useState(false);
  const handleCommentsUpdate = (count: number) => {
    // Update comment count if needed
  };

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
          {showComments ? (
            <div className="w-full bg-white p-4 md:p-6 lg:p-8 min-h-[400px] md:min-h-[600px] rounded-lg md:rounded-none">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-serif">Comments</h3>
                <button 
                  onClick={() => setShowComments(false)}
                  className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
                >
                  Back to Story
                </button>
              </div>
              <CommentsView 
                storyId={storyId}
                currentNode={currentNode}
                currentPage={currentPage}
                onCommentsUpdate={handleCommentsUpdate}
              />
            </div>
          ) : (
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
              onOpenCommentModal={() => setShowComments(true)}
              onRestart={onRestart}
              canGoBack={canGoBack}
              onBack={onBack}
              onContinue={onContinue}
              onChoice={onChoice}
            />
          )}
        </div>
      </div>
    </div>
  );
};
