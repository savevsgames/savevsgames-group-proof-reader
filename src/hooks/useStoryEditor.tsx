
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CustomStory } from "@/lib/storyUtils";
import { generateAndLogNodeMappings, NodeMappings, extractStoryContent } from "@/lib/storyEditorUtils";
import { useNavigation, NavigationState, NavigationActions } from "@/hooks/navigation";
import { useStorySaving } from "@/hooks/useStorySaving";

export const useStoryEditor = (storyId: string) => {
  console.log("[StoryEditor] Initializing story editor for ID:", storyId);
  
  const [story, setStory] = useState<any | null>(null);
  const [storyData, setStoryData] = useState<CustomStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [nodeMappings, setNodeMappings] = useState<NodeMappings>({
    nodeToPage: {},
    pageToNode: {}
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
  const [navigationState, navigationActions] = useNavigation({
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
    console.log(`[StoryEditor] Node change requested to: ${nodeName}`);
    
    if (!nodeMappings.nodeToPage) {
      console.warn("[StoryEditor] No node mappings available for navigation");
      return;
    }
    
    const pageNumber = nodeMappings.nodeToPage[nodeName] || 1;
    console.log(`[StoryEditor] Node "${nodeName}" maps to page ${pageNumber}`);
    
    handlePageChange(pageNumber);
  };
  
  const handleNavigation = (target: string) => {
    console.log(`[StoryEditor] Navigation requested to: ${target}`);
    
    // Navigate to a specific target
    if (target === 'back' && navigationState.canGoBack) {
      console.log("[StoryEditor] Navigating back in history");
      navigationActions.handleBack();
    } else if (target === 'restart') {
      console.log("[StoryEditor] Restarting story navigation");
      navigationActions.handleRestart();
    }
  };
  
  const confirmNavigation = () => {
    console.log("[StoryEditor] Navigation confirmed");
    // Confirm navigation action
    setIsLeaveDialogOpen(false);
  };

  // Generate node mappings when storyData changes with improved logging
  useEffect(() => {
    if (storyData) {
      console.log("[StoryEditor] Story data changed, regenerating node mappings");
      
      const { nodeMappings: updatedMappings, totalPages: calculatedPages } = 
        generateAndLogNodeMappings(storyData);
      
      console.log(`[StoryEditor] New mapping generated: ${Object.keys(updatedMappings.nodeToPage).length} nodes, ${calculatedPages} pages`);
      
      setNodeMappings(updatedMappings);
      setTotalPages(calculatedPages);
    }
  }, [storyData]);

  // Wrapper for story data change to handle multiple concerns
  const handleStoryDataChange = (data: CustomStory) => {
    console.log("[StoryEditor] Story data change requested");
    setStoryData(data);
    return saveHandleStoryDataChange(data);
  };

  // Wrapper for save to pass the current storyData
  const handleSave = async () => {
    console.log("[StoryEditor] Save requested");
    await saveStoryData(storyData);
  };

  // Fetch the story data with improved logging
  useEffect(() => {
    const fetchStory = async () => {
      console.log("[StoryEditor] Fetching story data", { storyId });
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", storyId)
          .single();

        if (error) {
          console.error("[StoryEditor] Supabase error:", error);
          throw error;
        }

        if (data) {
          console.log("[StoryEditor] Story data fetched successfully", {
            title: data.title,
            hasStoryUrl: !!data.story_url,
            hasStoryContent: !!data.story_content
          });
          
          setStory(data);
          
          // Extract story content with our utility function
          console.log("[StoryEditor] Extracting story content");
          const storyContent = await extractStoryContent(data);
          
          // If we have valid story content, use it
          if (storyContent) {
            console.log(`[StoryEditor] Valid story content extracted with ${Object.keys(storyContent).length} nodes`);
            setStoryData(storyContent);
            setError(null);
          } else {
            // Create a default empty story structure as fallback
            console.log("[StoryEditor] No valid story content found, creating default structure");
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
          console.error("[StoryEditor] Story not found");
          setError("Story not found.");
        }
      } catch (error: any) {
        console.error("[StoryEditor] Error fetching story:", error);
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
