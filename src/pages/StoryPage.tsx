
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
  
  // Group selectors to minimize re-renders
  const {
    storyId,
    loading,
    error,
    title,
    totalPages
  } = useStoryStore(state => ({
    storyId: state.storyId,
    loading: state.loading,
    error: state.error,
    title: state.title,
    totalPages: state.totalPages
  }), shallow);
  
  // Actions selector - separate from state to avoid re-renders
  const initializeStory = useStoryStore(state => state.initializeStory);
  
  // Memoize the initialization to prevent multiple calls
  const handleInitialization = useCallback(async (storyId: string) => {
    console.log("[StoryPage] Initializing story with ID:", storyId);
    await initializeStory(storyId);
  }, [initializeStory]);
  
  // Initialize story on mount or when ID changes
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
        totalPages
      });
    }
  }, [id, navigate, toast, handleInitialization, storyId]);

  // Monitor totalPages changes in a separate effect
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
