
import { useState, useEffect, useRef } from 'react';
import { useStoryStore } from '@/stores/storyState';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseStoryInitializationProps {
  storyId: string | undefined;
}

interface UseStoryInitializationResult {
  isInitialized: boolean;
  isPublicEditable: boolean;
  localError: string | null;
}

export const useStoryInitialization = ({ storyId }: UseStoryInitializationProps): UseStoryInitializationResult => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPublicEditable, setIsPublicEditable] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const initializationAttempts = useRef(0);
  const lastUpdateTimestamp = useRef(0);
  
  const initializeStory = useStoryStore(state => state.initializeStory);
  
  // Check if story is publicly editable
  useEffect(() => {
    async function checkPublicEditable() {
      if (!storyId) return;
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('is_public_editable')
          .eq('id', storyId)
          .single();
        
        if (error) {
          console.error("[useStoryInitialization] Error checking public editable status:", error);
          return;
        }
        
        if (data) {
          console.log("[useStoryInitialization] Book public editable status:", data.is_public_editable);
          setIsPublicEditable(!!data.is_public_editable);
        }
      } catch (err) {
        console.error("[useStoryInitialization] Error fetching public editable status:", err);
      }
    }
    
    checkPublicEditable();
  }, [storyId]);
  
  // Initialize story on component mount, with error handling and prevention of multiple initialization
  useEffect(() => {
    if (!storyId) {
      console.error("[useStoryInitialization] No story ID provided");
      setLocalError("No story ID provided");
      return;
    }
    
    if (isInitialized) {
      console.log("[useStoryInitialization] Story already initialized, skipping");
      return;
    }
    
    // Prevent multiple initialization attempts close together
    const now = Date.now();
    if (now - lastUpdateTimestamp.current < 500) {
      console.log("[useStoryInitialization] Throttling initialization attempts");
      return;
    }
    lastUpdateTimestamp.current = now;
    
    const attemptCount = initializationAttempts.current + 1;
    initializationAttempts.current = attemptCount;
    
    // Limit maximum initialization attempts to prevent loops
    if (attemptCount > 3) {
      console.error("[useStoryInitialization] Too many initialization attempts, stopping");
      setLocalError("Failed to initialize story after multiple attempts");
      return;
    }
    
    console.log("[useStoryInitialization] Initializing story:", storyId, "attempt:", attemptCount);
    
    try {
      setIsInitialized(true);
      
      // Wrap in a try-catch to handle any initialization errors
      const initPromise = initializeStory(storyId);
      
      // Show a toast while initializing
      toast.loading("Loading story...", {
        id: "story-init",
        duration: 2000,
      });
      
      initPromise.catch(err => {
        console.error("[useStoryInitialization] Initialization error:", err);
        setLocalError(err?.message || "Failed to initialize story");
        toast.error("Failed to load story", {
          id: "story-init"
        });
      });
    } catch (err: any) {
      console.error("[useStoryInitialization] Initialization error:", err);
      setLocalError(err?.message || "Failed to initialize story");
      toast.error("Failed to load story");
    }
    
    // Cleanup function
    return () => {
      console.log("[useStoryInitialization] Cleaning up");
      // Reset initialization on unmount
      setIsInitialized(false);
      initializationAttempts.current = 0;
    };
  }, [storyId, initializeStory, isInitialized]);

  return {
    isInitialized,
    isPublicEditable,
    localError
  };
};
