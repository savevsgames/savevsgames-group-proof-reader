
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronLeft, MessageSquare, SkipBack, Home } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onPageChange: (pageNumber: number) => void;
  hidePageSelector?: boolean;
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
  onPageChange,
  hidePageSelector = false
}) => {
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());
  const navigate = useNavigate();
  
  // Update the page input value when currentPage changes
  React.useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPageInputValue(value);
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInputValue);
    
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // Reset to current page if invalid
      setPageInputValue(currentPage.toString());
    }
  };

  // Navigate to dashboard
  const handleDashboardClick = () => {
    navigate('/');
  };

  // Calculate visible page range for pagination
  const getPageNumbers = () => {
    const range = [];
    const maxVisiblePages = 5;
    let start, end;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      start = 1;
      end = totalPages;
    } else {
      // Calculate range around current page
      const offset = Math.floor(maxVisiblePages / 2);
      
      if (currentPage <= offset) {
        // Near start
        start = 1;
        end = maxVisiblePages;
      } else if (currentPage > totalPages - offset) {
        // Near end
        start = totalPages - maxVisiblePages + 1;
        end = totalPages;
      } else {
        // Middle
        start = currentPage - offset;
        end = currentPage + offset;
      }
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  };

  return (
    <div className="flex justify-between items-center py-4 px-6 bg-[#3A2618] text-[#E8DCC4] rounded-t-lg md:rounded-t-none">
      {/* Left side - Book title and navigation controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <SkipBack className="h-4 w-4 text-[#E8DCC4]" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="text-[#E8DCC4] hover:text-white hover:bg-[#4A3628]"
            title="Start Over"
            type="button"
          >
            <span>Restart</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <ChevronLeft className="h-4 w-4 text-[#E8DCC4]" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={!canGoBack}
            className="text-[#E8DCC4] hover:text-white hover:bg-[#4A3628] disabled:opacity-50"
            title="Go Back"
            type="button"
          >
            <span>Back</span>
          </Button>
        </div>
        
        <h1 className="font-serif text-lg md:text-xl font-medium">{bookTitle}</h1>
      </div>
      
      {/* Right side - Comment button, Dashboard button and page selector */}
      <div className="flex items-center space-x-4">
        {!hidePageSelector && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer group">
                <BookOpen className="h-4 w-4 text-[#E8DCC4]" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-[#4A3628] text-[#E8DCC4] hover:text-white"
                  type="button"
                >
                  <span className="text-sm">
                    Page <span className="font-bold">{currentPage}</span> of {totalPages}
                  </span>
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#E8DCC4] text-[#3A2618] p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Jump to Page</h4>
                
                <form onSubmit={handlePageSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={pageInputValue}
                    onChange={handlePageInputChange}
                    className="w-16 px-2 py-1 border border-[#3A2618] rounded text-center"
                    aria-label="Enter page number"
                  />
                  <Button 
                    type="submit" 
                    className="bg-[#3A2618] text-[#E8DCC4] hover:bg-[#4A3628]"
                  >
                    Go
                  </Button>
                </form>
                
                <div className="flex flex-wrap gap-1 justify-center">
                  {getPageNumbers().map(page => (
                    <div
                      key={`page-${page}`}
                      onClick={() => onPageChange(page)}
                      className={`px-2 py-1 min-w-[30px] text-center ${
                        currentPage === page
                          ? 'bg-[#3A2618] text-[#E8DCC4]'
                          : 'hover:bg-[#3A2618]/10'
                      } rounded cursor-pointer`}
                    >
                      {page}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-[#E8DCC4]" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenComments}
            className="text-[#E8DCC4] hover:text-white hover:bg-[#4A3628] relative"
            title="View Comments"
            type="button"
          >
            <span>Comments</span>
            {commentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {commentCount > 9 ? '9+' : commentCount}
              </span>
            )}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Home className="h-4 w-4 text-[#E8DCC4]" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDashboardClick}
            className="text-[#E8DCC4] hover:text-white hover:bg-[#4A3628]"
            title="Back to Dashboard"
            type="button"
          >
            <span>Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
