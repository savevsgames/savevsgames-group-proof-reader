
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  CustomStory, 
  generateNodeMappings,
  storyNodeToPageMap,
  pageToStoryNodeMap
} from "@/lib/storyUtils";
import { useToast } from "@/hooks/use-toast";

export const useStoryEditor = (storyId: string) => {
  const [story, setStory] = useState<any | null>(null);
  const [storyData, setStoryData] = useState<CustomStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentNode, setCurrentNode] = useState<string>("root");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const [nodeMappings, setNodeMappings] = useState({
    nodeToPage: storyNodeToPageMap,
    pageToNode: pageToStoryNodeMap
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate node mappings when storyData changes
  useEffect(() => {
    if (storyData) {
      // Generate fresh mappings with total pages
      const { storyNodeToPageMap: updatedNodeToPage, pageToStoryNodeMap: updatedPageToNode, totalPages: calculatedPages } = 
        generateNodeMappings(storyData);
      
      setNodeMappings({
        nodeToPage: updatedNodeToPage,
        pageToNode: updatedPageToNode
      });
      
      // Update total pages based on the mapping
      setTotalPages(calculatedPages);
      
      // Log all nodes found in the story data
      const allNodes = Object.keys(storyData).filter(key => 
        key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
      );
      
      console.log("Story nodes found:", allNodes);
      console.log("Total story nodes:", allNodes.length);
      console.log("Node to page mapping:", updatedNodeToPage);
      console.log("Page to node mapping:", updatedPageToNode);
      
      console.log(`useStoryEditor: Total story nodes: ${calculatedPages}, updated mappings`);
    }
  }, [storyData]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    // Get the node name for this page using our mappings
    const nodeName = nodeMappings.pageToNode[newPage];
    
    if (!nodeName) {
      console.error(`No node found for page ${newPage}`);
      return;
    }
    
    console.log(`Page changed to ${newPage}, corresponding to node: ${nodeName}`);
    setCurrentNode(nodeName);
    setCurrentPage(newPage);
  };

  // Handle node change
  const handleNodeChange = (nodeName: string) => {
    if (!nodeName || !storyData || !storyData[nodeName]) {
      console.error(`Invalid node: ${nodeName}`);
      return;
    }
    
    setCurrentNode(nodeName);
    
    // Calculate page number from node
    const pageNumber = nodeMappings.nodeToPage[nodeName] || 1;
    
    console.log(`Node changed to ${nodeName}, corresponding to page: ${pageNumber}`);
    setCurrentPage(pageNumber);
  };

  // Confirmation when navigating away with unsaved changes
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setNavigationPath(path);
      setIsLeaveDialogOpen(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    setIsLeaveDialogOpen(false);
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

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
          
          // Try to get story content from various possible sources
          let storyContent = null;
          
          // First, check if story_content exists (it might have been added in previous edits)
          if (data.story_content) {
            try {
              storyContent = JSON.parse(data.story_content);
              console.log("Found story_content, using that");
            } catch (parseError) {
              console.error("Error parsing story_content:", parseError);
            }
          }
          
          // If no valid story_content, try to fetch from story_url
          if (!storyContent && data.story_url) {
            try {
              console.log("Attempting to fetch story from URL:", data.story_url);
              const response = await fetch(data.story_url);
              if (response.ok) {
                storyContent = await response.json();
                console.log("Successfully loaded story from URL");
                
                // Log the complete structure of the fetched story
                console.log("Story structure:", storyContent);
                
                // Count and log all nodes in the story
                const allNodes = Object.keys(storyContent).filter(key => 
                  key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
                );
                console.log("All story nodes:", allNodes);
                console.log("Total nodes found:", allNodes.length);
              } else {
                console.error("Failed to fetch story from URL:", response.statusText);
              }
            } catch (fetchError) {
              console.error("Error fetching story from URL:", fetchError);
            }
          }
          
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
  }, [storyId]);

  // When story data is updated, recalculate mappings
  const handleStoryDataChange = (data: CustomStory) => {
    setStoryData(data);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!storyData) {
        throw new Error("No story data to save.");
      }

      const { error } = await supabase
        .from("books")
        .update({ story_content: JSON.stringify(storyData) })
        .eq("id", storyId);

      if (error) {
        throw error;
      }

      setHasUnsavedChanges(false);
      
      toast({
        title: "Success",
        description: "Story saved successfully!",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Error saving story:", error);
      toast({
        title: "Error",
        description: `Failed to save story: ${error.message}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
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
