
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BookHeaderProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  canGoBack: boolean;
  commentCount: number;
  onBack: () => void;
  onRestart: () => void;
  onOpenComments: () => void;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  bookTitle,
  currentPage,
  totalPages,
  commentCount,
}) => {
  return (
    <>
      {/* Book Title and Page Number */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 bg-[#F97316] text-[#E8DCC4] px-6 py-2 rounded-full z-10 whitespace-nowrap shadow-md">
        <span className="font-serif">{bookTitle} - Page {currentPage} of {totalPages}</span>
      </div>

      {/* We now export the comment count for StoryControls to use */}
      <div className="hidden">
        {/* This is invisible - just to make the data available to StoryControls component */}
        <span id="comment-count-data" data-count={commentCount}></span>
      </div>
    </>
  );
};
