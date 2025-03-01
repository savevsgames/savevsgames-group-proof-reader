
import { useState, useEffect, useCallback } from "react";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";
import type { NodeMappings } from "@/lib/storyNodeMapping";
import { CustomStory } from "@/lib/storyUtils";
import { StoryStore } from "@/stores/storyState/types";

export const useStoryEditor = (storyId: string) => {
  console.log("[StoryEditor] Initializing story editor for ID:", storyId);
  
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  
  // Get everything we need from the store
  const {
    storyData,
    story,
    loading,
    error,
    saving,
    hasUnsavedChanges,
    currentNode,
    currentPage,
    totalPages,
    nodeMappings,
    
    initializeStory,
    handlePageChange,
    handleNodeChange,
    handleStoryDataChange,
    handleSave,
  } = useStoryStore(
    (state: StoryStore) => ({
      storyData: state.storyData,
      story: state.story,
      loading: state.loading,
      error: state.error,
      saving: state.saving,
      hasUnsavedChanges: state.hasUnsavedChanges,
      currentNode: state.currentNode,
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      nodeMappings: state.nodeMappings,
      
      initializeStory: state.initializeStory,
      handlePageChange: state.handlePageChange,
      handleNodeChange: state.handleNodeChange,
      handleStoryDataChange: state.handleStoryDataChange,
      handleSave: state.handleSave,
    }),
    shallow
  );
  
  // Initialize story when component mounts
  useEffect(() => {
    initializeStory(storyId);
  }, [storyId, initializeStory]);
  
  // Create navigation handlers
  const handleNavigation = (target: string) => {
    console.log(`[StoryEditor] Navigation requested to: ${target}`);
    
    // Navigate to a specific target using the store
    if (target === 'back') {
      console.log("[StoryEditor] Navigating back in history");
      useStoryStore.getState().goBack();
    } else if (target === 'restart') {
      console.log("[StoryEditor] Restarting story navigation");
      useStoryStore.getState().handleRestart();
    }
  };
  
  const confirmNavigation = () => {
    console.log("[StoryEditor] Navigation confirmed");
    setIsLeaveDialogOpen(false);
  };
  
  return {
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
    nodeMappings,
    setIsLeaveDialogOpen,
    handlePageChange,
    handleNodeChange,
    handleNavigation,
    confirmNavigation,
    handleStoryDataChange,
    handleSave,
  };
};
