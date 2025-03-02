
import React, { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StoryEditorHeaderProps {
  title: string;
  currentPage: number;
  totalPages: number;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSave?: () => void;
}

const StoryEditorHeader: React.FC<StoryEditorHeaderProps> = memo(({
  title,
  currentPage,
  totalPages,
  hasUnsavedChanges,
  isLoading,
  onPageChange,
  onSave
}) => {
  // Prevent unnecessary calculations on every render
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  
  // Memoize the handlers to prevent recreation on every render
  const handlePrevious = useCallback(() => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, isFirstPage, onPageChange]);
  
  const handleNext = useCallback(() => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, isLastPage, onPageChange]);
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-baseline space-x-4">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        
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
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <span className="mx-4 text-sm text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={isLastPage || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {onSave && (
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isLoading}
            className="bg-[#F97316] hover:bg-[#E86305]"
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
