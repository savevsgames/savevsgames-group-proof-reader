
import React, { useCallback, useEffect, useState } from "react";
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
  
  // Add local error state for better error handling
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Get actions from the store
  const {
    initializeStory,
    handlePageChange,
    handleNodeChange,
    handleStoryDataChange,
    handleSave,
    goBack,
    handleRestart,
    setHasUnsavedChanges
  } = useStoryStore();
  
  // State for leave dialog (local UI state)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  
  // Use ref to track initialization
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize story on component mount, with error handling
  useEffect(() => {
    if (storyId && !isInitialized) {
      console.log("[StoryEditPage] Initializing story:", storyId);
      
      try {
        setIsInitialized(true);
        initializeStory(storyId);
      } catch (err: any) {
        console.error("[StoryEditPage] Initialization error:", err);
        setLocalError(err?.message || "Failed to initialize story");
      }
    }
    
    // Cleanup function
    return () => {
      console.log("[StoryEditPage] Cleaning up");
      // Reset initialization on unmount
      setIsInitialized(false);
    };
  }, [storyId, initializeStory, isInitialized]);

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

  const handleNavigate = useCallback((target: string) => {
    console.log("[StoryEditPage] Navigation request:", target);
    
    if (target === 'back' && useStoryStore.getState().canGoBack) {
      goBack();
    } else if (target === 'restart') {
      handleRestart();
    }
  }, [goBack, handleRestart]);
  
  const handleStoryUpdate = useCallback((newData: any) => {
    console.log("[StoryEditPage] Story data update requested");
    try {
      handleStoryDataChange(newData);
    } catch (err: any) {
      console.error("[StoryEditPage] Story update error:", err);
      setLocalError(err?.message || "Failed to update story data");
    }
  }, [handleStoryDataChange]);
  
  const handlePageChangeWithGuard = useCallback((page: number) => {
    console.log("[StoryEditPage] Page change requested:", page);
    if (isNaN(page) || page < 1) {
      console.warn("[StoryEditPage] Invalid page number:", page);
      return;
    }
    
    try {
      handlePageChange(page);
    } catch (err: any) {
      console.error("[StoryEditPage] Page change error:", err);
      setLocalError(err?.message || "Failed to change page");
    }
  }, [handlePageChange]);
  
  // Handle showing error state
  const displayError = error || localError;

  console.log("[StoryEditPage] Render state:", { 
    storyId, 
    currentPage, 
    totalPages, 
    loading, 
    hasUnsavedChanges,
    error: displayError
  });

  return (
    <div className="bg-[#F5F1E8] min-h-screen">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        {/* Header with page navigation */}
        <StoryEditorHeader
          title={title}
          currentPage={currentPage}
          totalPages={totalPages}
          hasUnsavedChanges={hasUnsavedChanges}
          isLoading={loading || saving}
          onPageChange={handlePageChangeWithGuard}
          onSave={handleSave}
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
                onStoryDataChange={handleStoryUpdate}
                onUnsavedChanges={setIsLeaveDialogOpen}
                onNodeChange={handleNodeChange}
                onSave={handleSave}
                onNavigate={handleNavigate}
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
