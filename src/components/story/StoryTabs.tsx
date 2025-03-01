
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import JsonEditor from "./JsonEditor";
import InkView from "./InkView";
import LlmIntegration from "./LlmIntegration";
import { useAuth } from "@/context/AuthContext";
import { CustomStory } from "@/lib/storyUtils";

interface StoryTabsProps {
  storyId: string;
  storyData: CustomStory;
  onStoryDataChange: (data: CustomStory) => void;
}

export type TabType = "json" | "ink" | "llm";

const StoryTabs: React.FC<StoryTabsProps> = ({
  storyId,
  storyData,
  onStoryDataChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("json");
  const { user } = useAuth();

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };

  return (
    <Tabs
      defaultValue="json"
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="mb-4 w-full justify-start">
        <TabsTrigger value="json">JSON View</TabsTrigger>
        <TabsTrigger value="ink">Ink View</TabsTrigger>
        <TabsTrigger value="llm">LLM Integration</TabsTrigger>
      </TabsList>

      <Card className="p-4">
        <TabsContent value="json" className="mt-0">
          <JsonEditor
            storyData={storyData}
            onChange={onStoryDataChange}
          />
        </TabsContent>

        <TabsContent value="ink" className="mt-0">
          <InkView storyData={storyData} />
        </TabsContent>

        <TabsContent value="llm" className="mt-0">
          <LlmIntegration storyId={storyId} storyData={storyData} onStoryUpdate={onStoryDataChange} />
        </TabsContent>
      </Card>
    </Tabs>
  );
};

export default StoryTabs;
