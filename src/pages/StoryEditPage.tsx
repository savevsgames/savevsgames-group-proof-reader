
import React, { useCallback } from "react";
import { useParams, useBeforeUnload } from "react-router-dom";
import Header from "@/components/Header";
import StoryEditorHeader from "@/components/story/editor/StoryEditorHeader";
import StoryEditorContent from "@/components/story/editor/StoryEditorContent";
import LoadingState from "@/components/story/editor/LoadingState";
import ErrorState from "@/components/story/editor/ErrorState";
import EmptyState from "@/components/story/editor/EmptyState";
import UnsavedChangesDialog from "@/components/story/editor/UnsavedChangesDialog";
import { useStoryStore } from "@/stores/storyState";
import { selectHasUnsavedChanges, selectLoading, selectSaving, 
  selectCurrentNode, selectCurrentPage, selectTotalPages, 
  selectError, selectTitle, selectStoryData } from "@/stores/storyState/selectors";
import { useStoryInitialization } from "@/hooks/useStoryInitialization";
import StoryNavigationHandler from "@/components/story/editor/StoryNavigationHandler";
import StorySaveHandler from "@/components/story/editor/StorySaveHandler";
import { useState } from "react";

const StoryEditPage = () => {
  const { id } = useParams();
  const storyId = id as string;
  
  // Use individual selectors to prevent unnecessary re-renders
  const storyData = useStoryStore(selectStoryData);
  const title = useStoryStore(selectTitle);
  const loading = useStoryStore(selectLoading);
  const error = useStoryStore(selectError);
  const saving = useStoryStore(selectSaving);
  const hasUnsavedChanges = useStoryStore(selectHasUnsavedChanges);
  const currentNode = useStoryStore(selectCurrentNode);
  const currentPage = useStoryStore(selectCurrentPage);
  const totalPages = useStoryStore(selectTotalPages);
  
  // Get initialization state from our custom hook
  const { isPublicEditable, localError } = useStoryInitialization({ storyId });

  // Set hasUnsavedChanges from the store
  const setHasUnsavedChanges = useStoryStore(state => state.setHasUnsavedChanges);
  
  // State for leave dialog (local UI state)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  
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
  
  const confirmNavigation = useCallback(() => {
    setIsLeaveDialogOpen(false);
  }, []);
  
  // Handle showing error state
  const displayError = error || localError;

  return (
    <div className="bg-[#F5F1E8] min-h-screen">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <StorySaveHandler>
          {({ handleSave, handleStoryDataChange }) => (
            <StoryNavigationHandler>
              {({ handlePageChange, handleNodeChange, handleNavigate }) => (
                <>
                  {/* Header with page navigation */}
                  <StoryEditorHeader
                    title={title}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isLoading={loading || saving}
                    onPageChange={handlePageChange}
                    onSave={handleSave}
                    isPublicEditable={isPublicEditable}
                  />
                  
                  {/* Content area */}
                  {loading ? (
                    <LoadingState />
                  ) : displayError ? (
                    <ErrorState errorMessage={displayError} />
                  ) : (
                    <>
                      {storyData ? (
                        <StoryEditorContent
                          storyId={storyId}
                          storyData={storyData}
                          currentNode={currentNode || 'root'}
                          saving={saving}
                          hasUnsavedChanges={hasUnsavedChanges}
                          onStoryDataChange={handleStoryDataChange}
                          onUnsavedChanges={setHasUnsavedChanges}
                          onNodeChange={handleNodeChange}
                          onSave={handleSave}
                          onNavigate={handleNavigate}
                          isPublicEditable={isPublicEditable}
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
                </>
              )}
            </StoryNavigationHandler>
          )}
        </StorySaveHandler>
      </main>
    </div>
  );
};

export default StoryEditPage;
