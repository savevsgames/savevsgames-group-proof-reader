
import { useState, useEffect, useCallback } from 'react';
import { useStoryStore } from '@/stores/storyState';
import { CustomStory } from '@/types';

export const useStoryEditor = (storyId: string) => {
  // Get store state and actions
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
  } = useStoryStore();
  
  // Local state for the editor UI
  const [activeTab, setActiveTab] = useState('json');
  const [editingNode, setEditingNode] = useState('');
  
  // Initialize on component mount
  useEffect(() => {
    if (storyId) {
      initializeStory(storyId);
    }
  }, [storyId, initializeStory]);
  
  // Set editing node when currentNode changes
  useEffect(() => {
    if (currentNode && !editingNode) {
      setEditingNode(currentNode);
    }
  }, [currentNode, editingNode]);
  
  // Handle node selection in the editor
  const handleNodeSelection = useCallback((nodeName: string) => {
    setEditingNode(nodeName);
    handleNodeChange(nodeName);
  }, [handleNodeChange]);
  
  // Handle story data changes
  const updateStoryData = useCallback((newStoryData: CustomStory) => {
    handleStoryDataChange(newStoryData);
  }, [handleStoryDataChange]);
  
  // Save the story
  const saveStory = useCallback(async () => {
    await handleSave();
  }, [handleSave]);
  
  return {
    // State
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
    activeTab,
    editingNode,
    
    // Actions
    setActiveTab,
    handleNodeSelection,
    updateStoryData,
    saveStory,
    handlePageChange,
  };
};
