
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookHeaderProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  canGoBack: boolean;
  commentCount: number;
  onBack: () => void;
  onRestart: () => void;
  onOpenComments: () => void;
  onPageChange: (pageNumber: number) => void;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  bookTitle,
  currentPage,
  totalPages,
  canGoBack,
  commentCount,
  onBack,
  onRestart,
  onOpenComments,
  onPageChange
}) => {
  const navigate = useNavigate();
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const [isEditing, setIsEditing] = useState(false);

  // Extract subtitle if title contains a hyphen
  const titleParts = bookTitle.split(' - ');
  const mainTitle = titleParts[0];
  const subtitle = titleParts.length > 1 ? titleParts[1] : '';

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage = parseInt(pageInput);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
    setIsEditing(false);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Update pageInput when currentPage changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Function to handle Back to Library click
  const handleBackToLibraryClick = () => {
    console.log("Navigating to dashboard");
    navigate('/dashboard');
  };

  return (
    <div className="w-full bg-[#F1F1F1] text-[#3A2618] shadow-md rounded-lg mb-6 p-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
        {/* Back to Library Button */}
        <Button
          variant="ghost"
          onClick={handleBackToLibraryClick}
          className="text-[#3A2618] hover:bg-[#3A2618]/10 mb-3 sm:mb-0"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Library
        </Button>

        {/* Title and Page Navigation */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-[#F97316] mr-2 hidden sm:block" />
            <div className="text-center sm:text-left">
              <h1 className="font-serif font-bold text-lg sm:text-xl">{mainTitle}</h1>
              {subtitle && (
                <p className="text-[#3A2618]/70 text-sm font-serif italic">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <form onSubmit={handlePageSubmit} className="flex items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageSubmit}
                  autoFocus
                  className="w-12 h-8 text-center border border-[#3A2618]/20 rounded"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 min-w-[80px] text-center hover:bg-[#3A2618]/10 rounded"
                >
                  <span className="font-medium">{currentPage}</span> of {totalPages}
                </button>
              )}
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hidden comment count data for use by other components */}
        <div className="hidden">
          <span id="comment-count-data" data-count={commentCount}></span>
        </div>
      </div>
    </div>
  );
};
