import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import StoryTabs from "@/components/story/StoryTabs";
import { CustomStory, StoryEditorContentProps } from "@/types/story-types.definitions";

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
  
  return (
    <div className="bg-white rounded-lg border border-[#E8DCC4] p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-serif text-[#3A2618]">
          Editing Node: <span className="font-mono text-sm bg-[#F5F1E8] px-2 py-1 rounded">{currentNode}</span>
        </h3>
        
        <Button
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className={`bg-[#3A2618] hover:bg-[#5A3A28] text-white`}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      <StoryTabs
        storyId={storyId}
        storyData={storyData}
        onStoryDataChange={onStoryDataChange}
        onUnsavedChanges={onUnsavedChanges}
        currentNode={currentNode}
        onNodeChange={onNodeChange}
      />
    </div>
  );
};

export default StoryEditorContent;
