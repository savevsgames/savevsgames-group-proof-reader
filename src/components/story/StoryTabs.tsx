
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import JsonEditor from "./JsonEditor";
import InkView from "./InkView";
import LlmIntegration from "./LlmIntegration";
import CommentsView from "./CommentsView";
import ReaderView from "./ReaderView";
import { useAuth } from "@/context/AuthContext";
import { 
  CustomStory, 
  storyNodeToPageMap, 
  pageToStoryNodeMap, 
  generateNodeMappings 
} from "@/lib/storyUtils";
import { AlertCircle } from "lucide-react";

interface StoryTabsProps {
  storyId: string;
  storyData: CustomStory;
  onStoryDataChange: (data: CustomStory) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
  currentNode?: string;
  onNodeChange?: (nodeName: string) => void;
}

export type TabType = "json" | "ink" | "reader" | "comments" | "llm";

const StoryTabs: React.FC<StoryTabsProps> = ({
  storyId,
  storyData,
  onStoryDataChange,
  onUnsavedChanges,
  currentNode = "root",
  onNodeChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("json");
  const [commentCount, setCommentCount] = useState<number>(0);
  const { user } = useAuth();
  
  // Generate dynamic mappings when storyData changes
  const [mappings, setMappings] = useState({
    nodeToPage: storyNodeToPageMap,
    pageToNode: pageToStoryNodeMap
  });
  
  useEffect(() => {
    if (storyData) {
      const { storyNodeToPageMap: updatedNodeToPage, pageToStoryNodeMap: updatedPageToNode } = 
        generateNodeMappings(storyData);
      
      setMappings({
        nodeToPage: updatedNodeToPage,
        pageToNode: updatedPageToNode
      });
    }
  }, [storyData]);
  
  // Update parent component when JSON editor changes node selection
  const handleNodeSelection = (nodeName: string) => {
    if (onNodeChange) {
      onNodeChange(nodeName);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };

  const handleCommentsUpdate = () => {
    // Trigger comment count refresh
    setCommentCount(prev => prev + 1);
  };

  // Calculate current page number from node name
  // Using our dynamic mappings
  const currentPage = currentNode ? (mappings.nodeToPage[currentNode] || 1) : 1;

  return (
    <Tabs
      defaultValue="json"
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="mb-4 w-full justify-start">
        <TabsTrigger value="json">JSON View</TabsTrigger>
        <TabsTrigger value="ink">Ink View</TabsTrigger>
        <TabsTrigger value="reader">Reader</TabsTrigger>
        <TabsTrigger value="comments" className="relative">
          Comments
          {commentCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] text-white">
              {commentCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="llm">LLM Integration</TabsTrigger>
      </TabsList>

      <Card className="p-4">
        <TabsContent value="json" className="mt-0">
          <JsonEditor
            storyData={storyData}
            onChange={(data) => {
              onStoryDataChange(data);
              onUnsavedChanges(true);
            }}
            currentNode={currentNode}
            onNodeSelect={handleNodeSelection}
          />
        </TabsContent>

        <TabsContent value="ink" className="mt-0">
          <InkView 
            storyData={storyData} 
            currentNode={currentNode}
          />
        </TabsContent>
        
        <TabsContent value="reader" className="mt-0">
          <ReaderView 
            storyId={storyId}
            storyData={storyData}
            currentNode={currentNode}
            onNodeChange={handleNodeSelection}
            nodeMappings={mappings}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-0">
          <CommentsView 
            storyId={storyId} 
            currentNode={currentNode}
            onCommentsUpdate={handleCommentsUpdate}
            currentPage={currentPage}
          />
        </TabsContent>

        <TabsContent value="llm" className="mt-0">
          <LlmIntegration 
            storyId={storyId} 
            storyData={storyData}
            currentNode={currentNode} 
            onStoryUpdate={(data) => {
              onStoryDataChange(data);
              onUnsavedChanges(true);
            }}
          />
        </TabsContent>
      </Card>
    </Tabs>
  );
};

export default StoryTabs;
