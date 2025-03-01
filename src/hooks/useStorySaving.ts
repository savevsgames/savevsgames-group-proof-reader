
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CustomStory } from "@/lib/storyUtils";
import { useToast } from "@/hooks/use-toast";

interface UseStorySavingProps {
  storyId: string;
}

export const useStorySaving = ({ storyId }: UseStorySavingProps) => {
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const handleStoryDataChange = (data: CustomStory) => {
    setHasUnsavedChanges(true);
    return data;
  };

  const handleSave = async (storyData: CustomStory | null) => {
    if (!storyData) {
      toast({
        title: "Error",
        description: "No story data to save.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setSaving(true);
    try {
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
    saving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleStoryDataChange,
    handleSave,
  };
};
