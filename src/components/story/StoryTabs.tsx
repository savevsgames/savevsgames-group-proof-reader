import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JsonEditor from "./JsonEditor";
import InkView from "./InkView";
import LlmIntegration from "./LlmIntegration";
import CommentsView from "./CommentsView";
import ReaderView from "./ReaderView";
import { useAuth } from "@/context/AuthContext";
import { generateNodeMappings } from "@/lib/story/mappings";
import { CustomStory } from "@/lib/storyUtils";
import { NodeMappings } from "@/lib/storyEditorUtils";
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

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
  
  const [mappings, setMappings] = useState<NodeMappings>({
    nodeToPage: {},
    pageToNode: {}
  });
  
  useEffect(() => {
    if (!storyData) {
      console.log("[StoryTabs] No story data available for mapping");
      return;
    }
    
    console.log("[StoryTabs] Generating node mappings for tabs");
    
    const { storyNodeToPageMap, pageToStoryNodeMap, totalPages } = generateNodeMappings(storyData);
    
    console.log(`[StoryTabs] Generated mappings with ${Object.keys(storyNodeToPageMap).length} nodes and ${totalPages} pages`);
    
    const previewCount = Math.min(5, Object.keys(storyNodeToPageMap).length);
    const previewMappings = Object.entries(storyNodeToPageMap)
      .slice(0, previewCount)
      .reduce((acc, [node, page]) => {
        acc[node] = page;
        return acc;
      }, {} as Record<string, number>);
    
    console.log(`[StoryTabs] First ${previewCount} mappings:`, previewMappings);
    
    setMappings({
      nodeToPage: storyNodeToPageMap,
      pageToNode: pageToStoryNodeMap
    });
  }, [storyData]);
  
  const handleNodeSelection = (nodeName: string) => {
    console.log(`[StoryTabs] Node selection changed to: ${nodeName}`);
    if (onNodeChange) {
      onNodeChange(nodeName);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };

  const handleCommentsUpdate = (count: number) => {
    setCommentCount(count);
  };

  const currentPage = currentNode && mappings.nodeToPage ? 
    (mappings.nodeToPage[currentNode] || 1) : 1;
  
  const totalPages = mappings.pageToNode ? Object.keys(mappings.pageToNode).length : 0;
  
  console.log(`[StoryTabs] Navigation state:`, {
    currentNode,
    currentPage,
    totalPages,
    mappedNodes: Object.keys(mappings.nodeToPage).length
  });

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const prevNodeName = mappings.pageToNode[prevPage];
      
      console.log(`[StoryTabs] Navigating to previous page ${prevPage}, node: ${prevNodeName}`);
      
      if (prevNodeName && onNodeChange) {
        onNodeChange(prevNodeName);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const nextNodeName = mappings.pageToNode[nextPage];
      
      console.log(`[StoryTabs] Navigating to next page ${nextPage}, node: ${nextNodeName}`);
      
      if (nextNodeName && onNodeChange) {
        onNodeChange(nextNodeName);
      }
    }
  };

  const handleAddToLlmContext = (commentType: string, commentText: string, username: string) => {
    // This is now properly typed to match the updated components
  };

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
        
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            type="button"
            className="p-1 h-8 w-8"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center text-sm text-gray-500">
            <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
            <span>Page {currentPage}/{totalPages || 1}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            type="button"
            className="p-1 h-8 w-8"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </TabsList>

      <Card className="p-4">
        <TabsContent value="json" className="mt-0">
          <JsonEditor
            storyData={storyData}
            onChange={(data) => {
              console.log("[StoryTabs] Story data changed in JSON editor");
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
            onAddToLlmContext={handleAddToLlmContext}
          />
        </TabsContent>

        <TabsContent value="llm" className="mt-0">
          <LlmIntegration 
            storyId={storyId} 
            storyData={storyData}
            currentNode={currentNode} 
            onStoryUpdate={(data) => {
              console.log("[StoryTabs] Story updated from LLM integration");
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
