
import React, { useCallback, useEffect, useState, useMemo } from "react";
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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
  
  // Add state for public editable flag
  const [isPublicEditable, setIsPublicEditable] = useState(false);
  
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
  const initializationAttempts = React.useRef(0);
  
  // Add a debounce guard for state updates
  const lastUpdateTimestamp = React.useRef(0);
  
  // Check if story is publicly editable
  useEffect(() => {
    async function checkPublicEditable() {
      if (!storyId) return;
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('is_public_editable')
          .eq('id', storyId)
          .single();
        
        if (error) {
          console.error("[StoryEditPage] Error checking public editable status:", error);
          return;
        }
        
        if (data) {
          console.log("[StoryEditPage] Book public editable status:", data.is_public_editable);
          setIsPublicEditable(!!data.is_public_editable);
        }
      } catch (err) {
        console.error("[StoryEditPage] Error fetching public editable status:", err);
      }
    }
    
    checkPublicEditable();
  }, [storyId]);
  
  // Initialize story on component mount, with error handling and prevention of multiple initialization
  useEffect(() => {
    if (!storyId) {
      console.error("[StoryEditPage] No story ID provided");
      setLocalError("No story ID provided");
      return;
    }
    
    if (isInitialized) {
      console.log("[StoryEditPage] Story already initialized, skipping");
      return;
    }
    
    // Prevent multiple initialization attempts close together
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 500) {
      console.log("[StoryEditPage] Throttling initialization attempts");
      return;
    }
    lastUpdateTimestamp.current = now;
    
    const attemptCount = initializationAttempts.current + 1;
    initializationAttempts.current = attemptCount;
    
    // Limit maximum initialization attempts to prevent loops
    if (attemptCount > 3) {
      console.error("[StoryEditPage] Too many initialization attempts, stopping");
      setLocalError("Failed to initialize story after multiple attempts");
      return;
    }
    
    console.log("[StoryEditPage] Initializing story:", storyId, "attempt:", attemptCount);
    
    try {
      setIsInitialized(true);
      
      // Wrap in a try-catch to handle any initialization errors
      const initPromise = initializeStory(storyId);
      
      // Show a toast while initializing
      toast.loading("Loading story...", {
        id: "story-init",
        duration: 2000,
      });
      
      initPromise.catch(err => {
        console.error("[StoryEditPage] Initialization error:", err);
        setLocalError(err?.message || "Failed to initialize story");
        toast.error("Failed to load story", {
          id: "story-init"
        });
      });
    } catch (err: any) {
      console.error("[StoryEditPage] Initialization error:", err);
      setLocalError(err?.message || "Failed to initialize story");
      toast.error("Failed to load story");
    }
    
    // Cleanup function
    return () => {
      console.log("[StoryEditPage] Cleaning up");
      // Reset initialization on unmount
      setIsInitialized(false);
      initializationAttempts.current = 0;
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
    
    // Prevent rapid consecutive navigations
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 300) {
      console.log("[StoryEditPage] Throttling rapid navigation");
      return;
    }
    lastUpdateTimestamp.current = now;
    
    try {
      if (target === 'back' && useStoryStore.getState().canGoBack) {
        goBack();
      } else if (target === 'restart') {
        handleRestart();
      }
    } catch (err: any) {
      console.error("[StoryEditPage] Navigation error:", err);
      setLocalError(err?.message || "Navigation failed");
      toast.error("Navigation failed");
    }
  }, [goBack, handleRestart]);
  
  const handleStoryUpdate = useCallback((newData: any) => {
    console.log("[StoryEditPage] Story data update requested");
    
    // Prevent rapid consecutive updates
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 300) {
      console.log("[StoryEditPage] Throttling rapid story updates");
      return;
    }
    lastUpdateTimestamp.current = now;
    
    try {
      handleStoryDataChange(newData);
    } catch (err: any) {
      console.error("[StoryEditPage] Story update error:", err);
      setLocalError(err?.message || "Failed to update story data");
      toast.error("Failed to update story");
    }
  }, [handleStoryDataChange]);
  
  const handlePageChangeWithGuard = useCallback((page: number) => {
    console.log("[StoryEditPage] Page change requested:", page);
    
    // Validate page number
    if (isNaN(page) || page < 1) {
      console.warn("[StoryEditPage] Invalid page number:", page);
      return;
    }
    
    // Prevent rapid consecutive page changes
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 300) {
      console.log("[StoryEditPage] Throttling rapid page changes");
      return;
    }
    lastUpdateTimestamp.current = now;
    
    try {
      handlePageChange(page);
    } catch (err: any) {
      console.error("[StoryEditPage] Page change error:", err);
      setLocalError(err?.message || "Failed to change page");
      toast.error("Failed to change page");
    }
  }, [handlePageChange]);
  
  // Handle saving with error handling and throttling
  const handleSaveWithGuard = useCallback(() => {
    console.log("[StoryEditPage] Save requested");
    
    // Prevent rapid consecutive saves
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 500) {
      console.log("[StoryEditPage] Throttling rapid save requests");
      return;
    }
    lastUpdateTimestamp.current = now;
    
    try {
      toast.loading("Saving changes...", {
        id: "story-save"
      });
      
      const savePromise = handleSave();
      
      savePromise.then(() => {
        toast.success("Story saved successfully", {
          id: "story-save"
        });
      }).catch(err => {
        console.error("[StoryEditPage] Save error:", err);
        toast.error("Failed to save story", {
          id: "story-save"
        });
      });
    } catch (err: any) {
      console.error("[StoryEditPage] Save error:", err);
      setLocalError(err?.message || "Failed to save story");
      toast.error("Failed to save story");
    }
  }, [handleSave]);
  
  // Handle showing error state
  const displayError = error || localError;

  // Limit console logging to prevent flooding
  const shouldLog = useMemo(() => {
    const now = Date.now();
    const shouldLog = now - (window as any)._lastPageLogTime > 1000;
    if (shouldLog) {
      (window as any)._lastPageLogTime = now;
      return true;
    }
    return false;
  }, []);

  if (shouldLog) {
    console.log("[StoryEditPage] Render state:", { 
      storyId, 
      currentPage, 
      totalPages, 
      loading, 
      hasUnsavedChanges,
      isPublicEditable,
      error: displayError
    });
  }

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
          onSave={handleSaveWithGuard}
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
                onStoryDataChange={handleStoryUpdate}
                onUnsavedChanges={setHasUnsavedChanges}
                onNodeChange={handleNodeChange}
                onSave={handleSaveWithGuard}
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
      </main>
    </div>
  );
};

export default StoryEditPage;
