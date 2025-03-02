
import React, { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import StoryTabs from "@/components/story/StoryTabs";
import { CustomStory, StoryEditorContentProps } from "@/types";

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({
  storyId,
  storyData,
  currentNode,
  saving,
  hasUnsavedChanges,
  onStoryDataChange,
  onUnsavedChanges,
  onSave,
  onNodeChange,
  onNavigate
}) => {
  console.log("[StoryEditorContent] Rendering with node:", currentNode);
  
  // Safety check for storyData to prevent errors
  useEffect(() => {
    if (!storyData || typeof storyData !== 'object') {
      console.error("[StoryEditorContent] Invalid story data:", storyData);
    }
  }, [storyData]);
  
  // Safely handle data changes
  const handleStoryDataChange = useCallback((data: CustomStory) => {
    try {
      console.log("[StoryEditorContent] Story data changed");
      onStoryDataChange(data);
    } catch (err) {
      console.error("[StoryEditorContent] Error updating story data:", err);
    }
  }, [onStoryDataChange]);
  
  // Safely handle save action
  const handleSave = useCallback(() => {
    try {
      console.log("[StoryEditorContent] Save requested");
      onSave();
    } catch (err) {
      console.error("[StoryEditorContent] Error during save:", err);
    }
  }, [onSave]);
  
  return (
    <div className="bg-white rounded-lg border border-[#E8DCC4] p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-serif text-[#3A2618]">
          Editing Node: <span className="font-mono text-sm bg-[#F5F1E8] px-2 py-1 rounded">{currentNode || 'root'}</span>
        </h3>
        
        <Button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className={`bg-[#3A2618] hover:bg-[#5A3A28] text-white`}
          type="button"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      {storyData && (
        <StoryTabs
          storyId={storyId}
          storyData={storyData}
          onStoryDataChange={handleStoryDataChange}
          onUnsavedChanges={onUnsavedChanges}
          currentNode={currentNode || 'root'}
          onNodeChange={onNodeChange}
        />
      )}
    </div>
  );
};

export default StoryEditorContent;
