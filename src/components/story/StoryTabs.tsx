
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
  generateNodeMappings,
  storyNodeToPageMap,
  pageToStoryNodeMap
} from "@/lib/storyUtils";
import { AlertCircle, BookOpen } from "lucide-react";

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
  
  // Generate mappings when storyData changes
  const [mappings, setMappings] = useState({
    nodeToPage: storyNodeToPageMap,
    pageToNode: pageToStoryNodeMap
  });
  
  useEffect(() => {
    if (storyData) {
      // Generate fresh mappings from the story data
      const { storyNodeToPageMap, pageToStoryNodeMap } = generateNodeMappings(storyData);
      
      // Update mappings state
      setMappings({
        nodeToPage: storyNodeToPageMap,
        pageToNode: pageToStoryNodeMap
      });
      
      console.log("StoryTabs: Using node mappings", { 
        storyNodeToPageMap, 
        pageToStoryNodeMap,
        nodeCount: Object.keys(storyData).filter(key => 
          key !== 'inkVersion' && key !== 'listDefs' && key !== '#f'
        ).length
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

  const handleCommentsUpdate = (count: number) => {
    // Update comment count with the provided value
    setCommentCount(count);
  };

  // Calculate current page number from node name
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
        
        {/* Page indicator in the tab menu */}
        <div className="ml-auto flex items-center text-sm text-gray-500">
          <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
          <span>Page {currentPage} • Node: {currentNode}</span>
        </div>
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
            currentPage={currentPage}
          />
        </TabsContent>
      </Card>
    </Tabs>
  );
};

export default StoryTabs;
