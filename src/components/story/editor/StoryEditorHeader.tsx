
import React from "react";
import { AlertTriangle } from "lucide-react";
import { BookHeader } from "@/components/story/BookHeader";

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
  return (
    <div className="mb-6">
      {!isLoading && (
        <BookHeader
          bookTitle={title || "Untitled Story"}
          currentPage={currentPage}
          totalPages={totalPages}
          canGoBack={false}
          commentCount={0}
          onBack={() => {}}
          onRestart={() => {}}
          onOpenComments={() => {}}
          onPageChange={onPageChange}
          hidePageSelector={true}
        />
      )}

      <h1 className="text-3xl font-serif font-bold text-[#3A2618]">Edit Story</h1>
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
