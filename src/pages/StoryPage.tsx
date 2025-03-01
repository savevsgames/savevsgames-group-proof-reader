
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StoryEngine } from "@/components/StoryEngine";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useStoryStore } from "@/stores/storyState";
import { StoryStore } from "@/stores/storyState/types";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initializeStory = useStoryStore((state: StoryStore) => state.initializeStory);
  
  useEffect(() => {
    if (!id) {
      toast({
        title: "Error",
        description: "No story ID provided. Redirecting to dashboard.",
        variant: "destructive"
      });
      navigate("/");
    } else {
      // Initialize the story in the store
      initializeStory(id);
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
