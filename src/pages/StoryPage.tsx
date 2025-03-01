
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StoryEngine } from "@/components/StoryEngine";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useStoryStore } from "@/stores/storyState";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initializeStory = useStoryStore(state => state.initializeStory);
  
  // Log store state directly for debugging
  const storeState = useStoryStore.getState();
  console.log("[StoryPage] Current store state:", {
    storyId: storeState.storyId,
    title: storeState.title,
    totalPages: storeState.totalPages,
    mappedNodes: storeState.nodeMappings ? Object.keys(storeState.nodeMappings.nodeToPage || {}).length : 0,
    currentPage: storeState.currentPage,
    currentNode: storeState.currentNode
  });
  
  useEffect(() => {
    console.log("[StoryPage] Component mounted with ID:", id);
    
    if (!id) {
      toast({
        title: "Error",
        description: "No story ID provided. Redirecting to dashboard.",
        variant: "destructive"
      });
      navigate("/");
    } else {
      // Log the initialization
      console.log("[StoryPage] Initializing story with ID:", id);
      
      // Initialize the story in the store
      initializeStory(id).then(() => {
        // Check the result after initialization
        const postInitState = useStoryStore.getState();
        console.log("[StoryPage] Post-initialization state:", {
          storyId: postInitState.storyId,
          title: postInitState.title,
          totalPages: postInitState.totalPages,
          mappedNodes: postInitState.nodeMappings ? Object.keys(postInitState.nodeMappings.nodeToPage || {}).length : 0,
          currentPage: postInitState.currentPage,
          currentNode: postInitState.currentNode
        });
      });
    }
  }, [id, navigate, toast, initializeStory]);

  useEffect(() => {
    // Additional tracking of total pages changes
    const unsubscribe = useStoryStore.subscribe(
      (state) => state.totalPages,
      (totalPages, previousTotalPages) => {
        console.log(`[StoryPage] totalPages changed from ${previousTotalPages} to ${totalPages}`);
        
        // Log detailed state when totalPages changes
        const currentState = useStoryStore.getState();
        console.log('[StoryPage] Store state when totalPages changed:', {
          storyId: currentState.storyId,
          nodeMappingsSize: currentState.nodeMappings ? Object.keys(currentState.nodeMappings.nodeToPage || {}).length : 0,
          storyDataNodesCount: currentState.storyData ? Object.keys(currentState.storyData).length : 0
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#3A2618] w-full overflow-x-hidden">
      <Header />
      
      <div className="mx-auto px-4 w-full">
        {id && <StoryEngine storyId={id} />}
      </div>
    </div>
  );
};

export default StoryPage;
