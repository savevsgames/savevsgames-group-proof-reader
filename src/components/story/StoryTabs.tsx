import React, { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReaderView from "@/components/story/ReaderView";
import JsonEditor from "@/components/story/JsonEditor";
import LlmIntegration from "@/components/story/LlmIntegration";
import { CustomStory } from "@/lib/storyUtils";

interface StoryTabsProps {
  storyId: string;
  storyData: CustomStory;
  onStoryDataChange: (data: CustomStory) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
  currentNode: string;
  onNodeChange: (nodeName: string) => void;
  llmContext?: string;
  setLlmContext?: (context: string) => void;
  onAddToLlmContext?: (text: string) => void;
}

const StoryTabs: React.FC<StoryTabsProps> = ({
  storyId,
  storyData,
  onStoryDataChange,
  onUnsavedChanges,
  currentNode,
  onNodeChange,
  llmContext,
  setLlmContext,
  onAddToLlmContext
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const handleStoryUpdate = useCallback(
    (updatedStory: CustomStory) => {
      onStoryDataChange(updatedStory);
      onUnsavedChanges(true);
    },
    [onStoryDataChange, onUnsavedChanges]
  );

  return (
    <Tabs defaultValue="reader" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="reader">Reader View</TabsTrigger>
        <TabsTrigger value="json">JSON Editor</TabsTrigger>
        <TabsTrigger value="llm">LLM Integration</TabsTrigger>
      </TabsList>
      
      <TabsContent value="reader" className="mt-4">
        <ReaderView
          storyData={storyData}
          currentNode={currentNode}
          onNodeChange={onNodeChange}
        />
      </TabsContent>
      
      <TabsContent value="json" className="mt-4">
        <JsonEditor
          storyData={storyData}
          onStoryDataChange={handleStoryUpdate}
          onUnsavedChanges={onUnsavedChanges}
        />
      </TabsContent>
      
      <TabsContent value="llm" className="mt-4">
        <LlmIntegration 
          storyId={storyId}
          storyData={storyData}
          currentNode={currentNode}
          onStoryUpdate={handleStoryUpdate}
          currentPage={currentPage}
          llmContext={llmContext}
          setLlmContext={setLlmContext}
          onAddToLlmContext={onAddToLlmContext}
        />
      </TabsContent>
    </Tabs>
  );
};

export default StoryTabs;
