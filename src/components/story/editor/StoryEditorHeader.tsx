
import React, { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
          
          <span className="mx-4 text-sm text-gray-500">
            Page {displayCurrentPage} of {displayTotalPages}
          </span>
          
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
