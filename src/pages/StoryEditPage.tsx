
import React, { useCallback, useEffect } from "react";
import { useParams, useBeforeUnload } from "react-router-dom";
import Header from "@/components/Header";
import StoryEditorHeader from "@/components/story/editor/StoryEditorHeader";
import StoryEditorContent from "@/components/story/editor/StoryEditorContent";
import LoadingState from "@/components/story/editor/LoadingState";
import ErrorState from "@/components/story/editor/ErrorState";
import EmptyState from "@/components/story/editor/EmptyState";
import UnsavedChangesDialog from "@/components/story/editor/UnsavedChangesDialog";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";
import { StoryStore } from "@/stores/storyState/types";

const StoryEditPage = () => {
  const { id } = useParams();
  const storyId = id as string;
  
  // Select only the state we need from the store
  const {
    storyData,
    title,
    loading,
    error,
    saving,
    hasUnsavedChanges,
    currentNode,
    currentPage,
    totalPages,
    initializeStory,
    handlePageChange,
    handleNodeChange,
    handleStoryDataChange,
    handleSave,
  } = useStoryStore((state: StoryStore) => ({
    storyData: state.storyData,
    title: state.title,
    loading: state.loading,
    error: state.error,
    saving: state.saving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    currentNode: state.currentNode,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    initializeStory: state.initializeStory,
    handlePageChange: state.handlePageChange,
    handleNodeChange: state.handleNodeChange,
    handleStoryDataChange: state.handleStoryDataChange,
    handleSave: state.handleSave,
  }), shallow);
  
  // State for leave dialog
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = React.useState(false);
  
  // Initialize story on component mount
  useEffect(() => {
    if (storyId) {
      initializeStory(storyId);
    }
  }, [storyId, initializeStory]);

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
  
  const confirmNavigation = () => {
    setIsLeaveDialogOpen(false);
  };

  const handleNavigate = (target: string) => {
    if (target === 'back' && useStoryStore.getState().canGoBack) {
      useStoryStore.getState().goBack();
    } else if (target === 'restart') {
      useStoryStore.getState().handleRestart();
    }
  };

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
