
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import StoryTabs from "@/components/story/StoryTabs";
import { CustomStory } from "@/lib/storyUtils";
import { useNavigate } from "react-router-dom";

interface StoryEditorContentProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onStoryDataChange: (data: CustomStory) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
  onNodeChange: (nodeName: string) => void;
  onSave: () => Promise<void>;
  onNavigate: (path: string) => void;
  llmContext?: string;
  setLlmContext?: (context: string) => void;
  onAddToLlmContext?: (text: string) => void;
}

const StoryEditorContent: React.FC<StoryEditorContentProps> = ({
  storyId,
  storyData,
  currentNode,
  saving,
  hasUnsavedChanges,
  onStoryDataChange,
  onUnsavedChanges,
  onNodeChange,
  onSave,
  onNavigate,
  llmContext,
  setLlmContext,
  onAddToLlmContext
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <StoryTabs 
        storyId={storyId} 
        storyData={storyData} 
        onStoryDataChange={onStoryDataChange}
        onUnsavedChanges={onUnsavedChanges}
        currentNode={currentNode}
        onNodeChange={onNodeChange}
        llmContext={llmContext}
        setLlmContext={setLlmContext}
        onAddToLlmContext={onAddToLlmContext}
      />
      
      <div className="mt-6 flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => onNavigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        
        <Button 
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className={`${hasUnsavedChanges ? 'bg-[#F97316] hover:bg-[#E86305]' : 'bg-gray-400'} text-white`}
        >
          {saving ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StoryEditorContent;
