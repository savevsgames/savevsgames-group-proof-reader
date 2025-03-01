
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CustomStory, storyNodeToPageMap, pageToStoryNodeMap } from "@/lib/storyUtils";
import { generateAndLogNodeMappings, extractStoryContent, NodeMappings } from "@/lib/storyEditorUtils";
import { useStoryNavigation, NavigationState, NavigationActions } from "@/hooks/useStoryNavigation";
import { useStorySaving } from "@/hooks/useStorySaving";

export const useStoryEditor = (storyId: string) => {
  const [story, setStory] = useState<any | null>(null);
  const [storyData, setStoryData] = useState<CustomStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [nodeMappings, setNodeMappings] = useState<NodeMappings>({
    nodeToPage: storyNodeToPageMap,
    pageToNode: pageToStoryNodeMap
  });

  // Initialize nested hooks
  const {
    saving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleStoryDataChange: saveHandleStoryDataChange,
    handleSave: saveStoryData,
  } = useStorySaving({ storyId });

  // Use the navigation state and actions
  const [navigationState, navigationActions] = useStoryNavigation({
    storyData,
    story: null,
    usingCustomFormat: true,
    storyId,
    nodeMappings,
    totalPages
  });

  // Extract values from navigation state and actions
  const currentNode = navigationState.currentNode;
  const currentPage = navigationState.currentPage;
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const handlePageChange = navigationActions.handlePageChange;
  
  // Add custom handlers for editor-specific navigation
  const handleNodeChange = (nodeName: string) => {
    const pageNumber = nodeMappings.nodeToPage[nodeName] || 1;
    handlePageChange(pageNumber);
  };
  
  const handleNavigation = (target: string) => {
    // Navigate to a specific target
    if (target === 'back' && navigationState.canGoBack) {
      navigationActions.handleBack();
    } else if (target === 'restart') {
      navigationActions.handleRestart();
    }
  };
  
  const confirmNavigation = () => {
    // Confirm navigation action
    setIsLeaveDialogOpen(false);
  };

  // Generate node mappings when storyData changes
  useEffect(() => {
    if (storyData) {
      const { nodeMappings: updatedMappings, totalPages: calculatedPages } = 
        generateAndLogNodeMappings(storyData);
      
      setNodeMappings(updatedMappings);
      setTotalPages(calculatedPages);
    }
  }, [storyData]);

  // Wrapper for story data change to handle multiple concerns
  const handleStoryDataChange = (data: CustomStory) => {
    setStoryData(data);
    return saveHandleStoryDataChange(data);
  };

  // Wrapper for save to pass the current storyData
  const handleSave = async () => {
    await saveStoryData(storyData);
  };

  // Fetch the story data
  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        console.log("Fetching story with ID:", storyId);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", storyId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Fetched story data:", data);
          setStory(data);
          
          // Extract story content with our utility function
          const storyContent = await extractStoryContent(data);
          
          // If we have valid story content, use it
          if (storyContent) {
            setStoryData(storyContent);
            setError(null);
          } else {
            // Create a default empty story structure as fallback
            console.log("No valid story content found, creating default structure");
            const defaultStory = {
              root: {
                text: "Start writing your story here...",
                choices: [],
              },
            };
            setStoryData(defaultStory);
          }
          
          // Reset unsaved changes flag
          setHasUnsavedChanges(false);
        } else {
          setError("Story not found.");
        }
      } catch (error: any) {
        console.error("Error fetching story:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, setHasUnsavedChanges]);

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
