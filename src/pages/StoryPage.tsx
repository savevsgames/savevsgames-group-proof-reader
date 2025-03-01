
import React, { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StoryEngine } from "@/components/StoryEngine";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useStoryStore } from "@/stores/storyState";
import { shallow } from "zustand/shallow";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use separate selectors to avoid unnecessary re-renders
  const initializeStory = useStoryStore(state => state.initializeStory);
  const storyId = useStoryStore(state => state.storyId);
  const title = useStoryStore(state => state.title);
  const totalPages = useStoryStore(state => state.totalPages);
  const nodeMappings = useStoryStore(state => state.nodeMappings);
  const currentPage = useStoryStore(state => state.currentPage);
  const currentNode = useStoryStore(state => state.currentNode);
  
  // Memoize the initialization to prevent multiple calls
  const handleInitialization = useCallback(async (storyId: string) => {
    console.log("[StoryPage] Initializing story with ID:", storyId);
    await initializeStory(storyId);
    
    // Log post-initialization state 
    console.log("[StoryPage] Post-initialization state:", {
      storyId,
      title,
      totalPages,
      hasNodeMappings: nodeMappings && Object.keys(nodeMappings.nodeToPage || {}).length > 0,
      currentPage,
      currentNode
    });
  }, [initializeStory, title, totalPages, nodeMappings, currentPage, currentNode]);
  
  // Initialize story on mount
  useEffect(() => {
    console.log("[StoryPage] Component mounted with ID:", id);
    
    if (!id) {
      toast({
        title: "Error",
        description: "No story ID provided. Redirecting to dashboard.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // Only initialize if needed (storyId doesn't match or not initialized yet)
    if (id !== storyId) {
      handleInitialization(id);
    } else {
      console.log("[StoryPage] Story already initialized:", {
        storyId,
        totalPages,
        currentNode
      });
    }
  }, [id, navigate, toast, handleInitialization, storyId, totalPages, currentNode]);

  // Monitor totalPages changes without creating infinite loops
  useEffect(() => {
    if (totalPages > 0) {
      console.log(`[StoryPage] totalPages detected: ${totalPages}`);
    }
  }, [totalPages]);

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
