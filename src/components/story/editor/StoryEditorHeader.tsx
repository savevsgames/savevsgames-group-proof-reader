
import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, ShieldCheck, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface StoryEditorHeaderProps {
  title: string;
  currentPage: number;
  totalPages: number;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSave?: () => void;
  isPublicEditable?: boolean;
}

// Use memo to prevent unnecessary re-renders
const StoryEditorHeader: React.FC<StoryEditorHeaderProps> = memo(({
  title,
  currentPage,
  totalPages,
  hasUnsavedChanges,
  isLoading,
  onPageChange,
  onSave,
  isPublicEditable = false
}) => {
  // Prevent unnecessary calculations on every render with proper type safety
  const isFirstPage = useMemo(() => {
    return typeof currentPage === 'number' && currentPage <= 1;
  }, [currentPage]);
  
  const isLastPage = useMemo(() => {
    const validTotalPages = typeof totalPages === 'number' && totalPages >= 1 ? totalPages : 1;
    return typeof currentPage === 'number' && currentPage >= validTotalPages;
  }, [currentPage, totalPages]);
  
  // Use a ref to track and prevent rapid consecutive calls
  const lastActionTimestamp = React.useRef(0);
  
  // State for page selection popover
  const [pageInputValue, setPageInputValue] = useState<string>(String(currentPage));
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Update input value when currentPage changes AND not while popover is open
  useEffect(() => {
    if (!isPopoverOpen) {
      setPageInputValue(String(currentPage));
    }
  }, [currentPage, isPopoverOpen]);
  
  // Memoize the handlers to prevent recreation on every render with rate limiting
  const handlePrevious = useCallback(() => {
    if (!isFirstPage && !isLoading) {
      const now = Date.now();
      if (now - lastActionTimestamp.current < 300) {
        console.log('[StoryEditorHeader] Throttling rapid navigation clicks');
        return;
      }
      
      lastActionTimestamp.current = now;
      console.log('[StoryEditorHeader] Navigate to previous page', currentPage - 1);
      onPageChange(currentPage - 1);
    }
  }, [currentPage, isFirstPage, onPageChange, isLoading]);
  
  const handleNext = useCallback(() => {
    if (!isLastPage && !isLoading) {
      const now = Date.now();
      if (now - lastActionTimestamp.current < 300) {
        console.log('[StoryEditorHeader] Throttling rapid navigation clicks');
        return;
      }
      
      lastActionTimestamp.current = now;
      console.log('[StoryEditorHeader] Navigate to next page', currentPage + 1);
      onPageChange(currentPage + 1);
    }
  }, [currentPage, isLastPage, onPageChange, isLoading]);
  
  const handleSave = useCallback(() => {
    if (onSave && hasUnsavedChanges && !isLoading) {
      const now = Date.now();
      if (now - lastActionTimestamp.current < 300) {
        console.log('[StoryEditorHeader] Throttling rapid save clicks');
        return;
      }
      
      lastActionTimestamp.current = now;
      console.log('[StoryEditorHeader] Triggering save');
      onSave();
    }
  }, [onSave, hasUnsavedChanges, isLoading]);
  
  // Handlers for page input
  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPageInputValue(value);
  }, []);

  const handlePageSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInputValue);
    
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      // Close the popover first to prevent any re-render issues
      setIsPopoverOpen(false);
      // Delay the page change slightly to ensure popover state is updated
      setTimeout(() => {
        if (pageNum !== currentPage) { // Only update if the page actually changed
          onPageChange(pageNum);
        }
      }, 50);
    } else {
      // Reset to current page if invalid
      setPageInputValue(String(currentPage));
    }
  }, [pageInputValue, totalPages, currentPage, onPageChange]);
  
  // Calculate page numbers to show in the selector
  const pageNumbers = useMemo(() => {
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
  }, [currentPage, totalPages]);
  
  // Memoize the page selection handler
  const handlePageClick = useCallback((page: number) => {
    if (page === currentPage) return; // Don't update if clicking current page
    
    setIsPopoverOpen(false);
    // Delay the page change to ensure popover closes first
    setTimeout(() => {
      onPageChange(page);
    }, 50);
  }, [currentPage, onPageChange]);
  
  // Safeguard against invalid values with safe fallbacks
  const displayCurrentPage = useMemo(() => {
    return typeof currentPage === 'number' && !isNaN(currentPage) && currentPage >= 1 
      ? currentPage 
      : 1;
  }, [currentPage]);
  
  const displayTotalPages = useMemo(() => {
    return typeof totalPages === 'number' && !isNaN(totalPages) && totalPages >= 1
      ? totalPages
      : 1;
  }, [totalPages]);
  
  // Limit logging frequency to debug
  const shouldLog = useMemo(() => {
    const now = Date.now();
    const shouldLog = now - (window as any)._lastHeaderLogTime > 1000;
    if (shouldLog) {
      (window as any)._lastHeaderLogTime = now;
      return true;
    }
    return false;
  }, []);
  
  // Add debugging for props to help identify issues, but limit frequency
  if (shouldLog) {
    console.log('[StoryEditorHeader] Rendering with:', { 
      title, 
      currentPage: displayCurrentPage, 
      totalPages: displayTotalPages,
      hasUnsavedChanges, 
      isLoading 
    });
  }
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-baseline space-x-4">
        <h1 className="text-2xl font-bold text-gray-800">{title || 'Untitled Story'}</h1>
        
        {isPublicEditable && (
          <Badge 
            variant="outline" 
            className="bg-green-50 text-green-700 border-green-200 flex items-center"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Community Editable
          </Badge>
        )}
        
        {hasUnsavedChanges && !isLoading && (
          <Badge 
            variant="outline" 
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Unsaved Changes
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center mr-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={isFirstPage || isLoading}
            type="button"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mx-2 flex items-center hover:bg-gray-100"
                disabled={isLoading}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="text-sm text-gray-500">
                  Page <span className="font-bold">{displayCurrentPage}</span> of {displayTotalPages}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Jump to Page</h4>
                
                <form onSubmit={handlePageSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={pageInputValue}
                    onChange={handlePageInputChange}
                    className="w-16 px-2 py-1 border rounded text-center"
                    aria-label="Enter page number"
                  />
                  <Button 
                    type="submit"
                    size="sm"
                  >
                    Go
                  </Button>
                </form>
                
                <div className="flex flex-wrap gap-1 justify-center">
                  {pageNumbers.map(page => (
                    <div
                      key={`page-${page}`}
                      onClick={() => handlePageClick(page)}
                      className={`px-2 py-1 min-w-[30px] text-center ${
                        displayCurrentPage === page
                          ? 'bg-gray-800 text-white'
                          : 'hover:bg-gray-100'
                      } rounded cursor-pointer`}
                    >
                      {page}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={isLastPage || isLoading}
            type="button"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {onSave && (
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isLoading}
            className="bg-[#F97316] hover:bg-[#E86305]"
            type="button"
          >
            {isLoading ? "Saving..." : "Save"}
            <Save className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
});

// Add display name for better debugging
StoryEditorHeader.displayName = 'StoryEditorHeader';

export default StoryEditorHeader;
