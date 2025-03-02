
import React, { useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StoryEngine } from "@/components/StoryEngine";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useStoryStore } from "@/stores/storyState";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Track initialization status with a ref to prevent multiple initializations
  const initializationAttempted = useRef(false);
  
  // Select only what we need from the store with proper typing
  const storyId = useStoryStore(state => state.storyId);
  const loading = useStoryStore(state => state.loading);
  const error = useStoryStore(state => state.error);
  const totalPages = useStoryStore(state => state.totalPages);
  
  // Get the initialize function from the store
  const initializeStory = useStoryStore(state => state.initializeStory);
  
  // Memoize the initialization to prevent multiple calls
  const handleInitialization = useCallback(async (storyId: string) => {
    // Track that we've attempted initialization
    initializationAttempted.current = true;
    
    console.log("[StoryPage] Initializing story with ID:", storyId);
    await initializeStory(storyId);
  }, [initializeStory]);
  
  // Use a more controlled useEffect to prevent infinite loops
  useEffect(() => {
    console.log("[StoryPage] Component mounted or ID changed:", id);
    
    if (!id) {
      toast({
        title: "Error",
        description: "No story ID provided. Redirecting to dashboard.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // Use the ref to ensure we don't initialize multiple times
    if (!initializationAttempted.current) {
      // Only initialize if needed (storyId doesn't match or not initialized yet)
      if (id !== storyId || loading || error) {
        handleInitialization(id);
      } else {
        console.log("[StoryPage] Story already initialized:", {
          storyId,
          totalPages
        });
      }
    }
    
    // Reset ref when ID changes
    return () => {
      if (id !== storyId) {
        initializationAttempted.current = false;
      }
    };
  }, [id, navigate, toast, handleInitialization, storyId, loading, error, totalPages]);

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
