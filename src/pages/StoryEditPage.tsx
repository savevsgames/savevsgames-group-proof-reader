
import React, { useCallback } from "react";
import { useParams, useBeforeUnload } from "react-router-dom";
import { storyNodeToPageMap, pageToStoryNodeMap } from "@/lib/storyUtils";
import Header from "@/components/Header";
import StoryEditorHeader from "@/components/story/editor/StoryEditorHeader";
import StoryEditorContent from "@/components/story/editor/StoryEditorContent";
import LoadingState from "@/components/story/editor/LoadingState";
import ErrorState from "@/components/story/editor/ErrorState";
import EmptyState from "@/components/story/editor/EmptyState";
import UnsavedChangesDialog from "@/components/story/editor/UnsavedChangesDialog";
import { useStoryEditor } from "@/hooks/useStoryEditor";

const StoryEditPage = () => {
  const { id } = useParams();
  const storyId = id as string;
  
  const {
    story,
    storyData,
    loading,
    error,
    saving,
    hasUnsavedChanges,
    currentNode,
    currentPage,
    totalPages,
    isLeaveDialogOpen,
    setIsLeaveDialogOpen,
    handlePageChange,
    handleNodeChange,
    handleNavigation,
    confirmNavigation,
    handleStoryDataChange,
    handleSave,
  } = useStoryEditor(storyId);

  // Warn the user if they try to close the tab with unsaved changes
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          return "You have unsaved changes. Are you sure you want to leave?";
        }
      },
      [hasUnsavedChanges]
    )
  );

  return (
    <div className="bg-[#F5F1E8] min-h-screen">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        {/* Header with page navigation */}
        <StoryEditorHeader
          title={story?.title || "Untitled Story"}
          currentPage={currentPage}
          totalPages={totalPages}
          hasUnsavedChanges={hasUnsavedChanges}
          isLoading={loading}
          onPageChange={handlePageChange}
        />
        
        {/* Content area */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState errorMessage={error} />
        ) : (
          <>
            {storyData ? (
              <StoryEditorContent
                storyId={storyId}
                storyData={storyData}
                currentNode={currentNode}
                saving={saving}
                hasUnsavedChanges={hasUnsavedChanges}
                onStoryDataChange={handleStoryDataChange}
                onUnsavedChanges={setIsLeaveDialogOpen}
                onNodeChange={handleNodeChange}
                onSave={handleSave}
                onNavigate={handleNavigation}
              />
            ) : (
              <EmptyState />
            )}
          </>
        )}
        
        {/* Navigation confirmation dialog */}
        <UnsavedChangesDialog
          isOpen={isLeaveDialogOpen}
          onOpenChange={setIsLeaveDialogOpen}
          onConfirm={confirmNavigation}
        />
      </main>
    </div>
  );
};

export default StoryEditPage;
