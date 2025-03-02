
import React, { useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Save, LayoutDashboard } from "lucide-react";
import StoryTabs from "@/components/story/StoryTabs";
import { CustomStory, StoryEditorContentProps } from "@/types";
import { Link } from "react-router-dom";
import { useStoryStore } from "@/stores/storyState";

// Memoize the component to prevent unnecessary re-renders
const StoryEditorContent: React.FC<StoryEditorContentProps> = memo(({
  storyId,
  storyData,
  currentNode,
  saving,
  hasUnsavedChanges,
  onStoryDataChange,
  onUnsavedChanges,
  onSave,
  onNodeChange,
  onNavigate,
  isPublicEditable = false
}) => {
  console.log("[StoryEditorContent] Rendering with node:", currentNode);
  
  // Get current page from the store
  const currentPage = useStoryStore(state => state.currentPage);
  
  // Safety check for storyData to prevent errors
  useEffect(() => {
    if (!storyData || typeof storyData !== 'object') {
      console.error("[StoryEditorContent] Invalid story data:", storyData);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      console.log("[StoryEditorContent] Unmounting");
    };
  }, [storyData]);
  
  // Add throttling to data change handling to prevent too many updates
  const lastUpdateTimestamp = React.useRef(0);
  
  // Safely handle data changes with throttling
  const handleStoryDataChange = useCallback((data: CustomStory) => {
    try {
      // Throttle updates to prevent excessive re-renders
      const now = Date.now();
      if (now - lastUpdateTimestamp.current < 200) {
        console.log("[StoryEditorContent] Throttling rapid updates");
        return;
      }
      
      lastUpdateTimestamp.current = now;
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
  
  // Guard against invalid data
  if (!storyData) {
    console.warn("[StoryEditorContent] No story data available for rendering");
    return (
      <div className="bg-white rounded-lg border border-[#E8DCC4] p-6 mb-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Story data is not available or invalid</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-[#E8DCC4] p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-serif text-[#3A2618]">
          Editing Node: <span className="font-mono text-sm bg-[#F5F1E8] px-2 py-1 rounded">{currentNode || 'root'}</span>
        </h3>
        
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          
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
      </div>
      
      {storyData && (
        <StoryTabs
          storyId={storyId}
          storyData={storyData}
          onStoryDataChange={handleStoryDataChange}
          onUnsavedChanges={onUnsavedChanges}
          currentNode={currentNode || 'root'}
          currentPage={currentPage}
          onNodeChange={onNodeChange}
          isPublicEditable={isPublicEditable}
        />
      )}
    </div>
  );
});

// Add displayName for better debugging
StoryEditorContent.displayName = 'StoryEditorContent';

export default StoryEditorContent;
