
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

const StoryEditPage = () => {
  const { id } = useParams();
  const storyId = id as string;
  
  // Select state from the store using individual selectors
  const storyData = useStoryStore(state => state.storyData);
  const title = useStoryStore(state => state.title);
  const loading = useStoryStore(state => state.loading);
  const error = useStoryStore(state => state.error);
  const saving = useStoryStore(state => state.saving);
  const hasUnsavedChanges = useStoryStore(state => state.hasUnsavedChanges);
  const currentNode = useStoryStore(state => state.currentNode);
  const currentPage = useStoryStore(state => state.currentPage);
  const totalPages = useStoryStore(state => state.totalPages);
  
  // Get actions from the store
  const initializeStory = useStoryStore(state => state.initializeStory);
  const handlePageChange = useStoryStore(state => state.handlePageChange);
  const handleNodeChange = useStoryStore(state => state.handleNodeChange);
  const handleStoryDataChange = useStoryStore(state => state.handleStoryDataChange);
  const handleSave = useStoryStore(state => state.handleSave);
  
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
