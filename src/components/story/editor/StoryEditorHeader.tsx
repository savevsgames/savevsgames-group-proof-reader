
import React from "react";
import { AlertTriangle, BookOpen } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface StoryEditorHeaderProps {
  title: string;
  currentPage: number;
  totalPages: number;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
}

const StoryEditorHeader: React.FC<StoryEditorHeaderProps> = ({
  title,
  currentPage,
  totalPages,
  hasUnsavedChanges,
  isLoading,
  onPageChange
}) => {
  // Generate available page numbers
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-serif font-bold text-[#3A2618]">Edit Story</h1>
        
        {!isLoading && (
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-[#3A2618]" />
            <Select 
              value={currentPage.toString()} 
              onValueChange={(value) => onPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-[180px] bg-white border-[#3A2618] text-[#3A2618]">
                <SelectValue placeholder={`Page ${currentPage} of ${totalPages}`} />
              </SelectTrigger>
              <SelectContent>
                {pageNumbers.map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    Page {page} of {totalPages}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {title && (
        <h2 className="text-xl text-[#5A3A28] mt-2">{title}</h2>
      )}
      
      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="mt-2 flex items-center text-amber-600">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span className="text-sm">You have unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default StoryEditorHeader;
