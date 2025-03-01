
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
import { 
  CustomStory, 
  generateNodeMappings,
  storyNodeToPageMap,
  pageToStoryNodeMap
} from "@/lib/storyUtils";
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
  
  // Calculate total pages
  const totalPages = Object.keys(mappings.pageToNode).length;

  // Navigate to previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const prevNodeName = mappings.pageToNode[currentPage - 1];
      if (prevNodeName && onNodeChange) {
        onNodeChange(prevNodeName);
      }
    }
  };

  // Navigate to next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextNodeName = mappings.pageToNode[currentPage + 1];
      if (nextNodeName && onNodeChange) {
        onNodeChange(nextNodeName);
      }
    }
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
        
        {/* Page navigation with chevron buttons */}
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
            <span>Page {currentPage}/{totalPages}</span>
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
