import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JsonEditor from "./JsonEditor";
import InkView from "./InkView";
import LlmIntegration from "./LlmIntegration";
import CommentsView from "./CommentsView";
import ReaderView from "./ReaderView";
import TextEditorView from "./TextEditorView";
import { useAuth } from "@/context/AuthContext";
import { generateNodeMappings } from "@/lib/story/mappings";
import { CustomStory, NodeMappings, TabType } from "@/types";
import { useStoryStore } from "@/stores/storyState";
import { Edit } from "lucide-react";
import { shallow } from "zustand/shallow";

interface StoryTabsProps {
  storyId: string;
  storyData: CustomStory;
  onStoryDataChange: (data: CustomStory) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
  currentNode?: string;
  currentPage?: number;
  onNodeChange?: (nodeName: string) => void;
  isPublicEditable?: boolean;
}

const StoryTabs: React.FC<StoryTabsProps> = ({
  storyId,
  storyData,
  onStoryDataChange,
  onUnsavedChanges,
  currentNode = "root",
  currentPage = 1,
  onNodeChange,
  isPublicEditable = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("json");
  const { user } = useAuth();
  
  const commentCount = useStoryStore(state => state.commentCount);
  
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
    
    if (value === 'comments') {
      const currentPageNumber = currentPage || (currentNode && mappings.nodeToPage ? 
        (mappings.nodeToPage[currentNode] || 1) : 1);
      
      useStoryStore.getState().fetchComments(storyId, currentPageNumber);
    }
  };

  const totalPages = mappings.pageToNode ? Object.keys(mappings.pageToNode).length : 0;
  
  console.log(`[StoryTabs] Navigation state:`, {
    currentNode,
    currentPage,
    totalPages,
    mappedNodes: Object.keys(mappings.nodeToPage).length
  });

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
        <TabsTrigger value="text-editor">
          <Edit className="h-4 w-4 mr-1" />
          Text Editor
        </TabsTrigger>
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
              console.log("[StoryTabs] Story data changed in JSON editor");
              onStoryDataChange(data);
              onUnsavedChanges(true);
            }}
            currentNode={currentNode}
            currentPage={currentPage}
            nodeMappings={mappings}
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
        
        <TabsContent value="text-editor" className="mt-0">
          <TextEditorView
            storyData={storyData}
            currentNode={currentNode}
            onStoryDataChange={(data) => {
              console.log("[StoryTabs] Story data changed in Text Editor");
              onStoryDataChange(data);
              onUnsavedChanges(true);
            }}
            isPublicEditable={isPublicEditable}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-0">
          <CommentsView 
            storyId={storyId} 
            currentNode={currentNode}
            currentPage={currentPage || 1}
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
            currentPage={currentPage || 1}
          />
        </TabsContent>
      </Card>
    </Tabs>
  );
};

export default StoryTabs;
