
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
