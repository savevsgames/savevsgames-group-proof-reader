
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NodeMappings } from "@/lib/storyEditorUtils";
import { CustomStory } from "@/lib/storyUtils";

interface UseStoryNavigationProps {
  storyData: CustomStory | null;
  hasUnsavedChanges: boolean;
  nodeMappings: NodeMappings;
  totalPages: number;
}

export const useStoryNavigation = ({
  storyData,
  hasUnsavedChanges,
  nodeMappings,
  totalPages
}: UseStoryNavigationProps) => {
  const [currentNode, setCurrentNode] = useState<string>("root");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    // Get the node name for this page using our mappings
    const nodeName = nodeMappings.pageToNode[newPage];
    
    if (!nodeName) {
      console.error(`No node found for page ${newPage}`);
      return;
    }
    
    console.log(`Page changed to ${newPage}, corresponding to node: ${nodeName}`);
    setCurrentNode(nodeName);
    setCurrentPage(newPage);
  };

  // Handle node change
  const handleNodeChange = (nodeName: string) => {
    if (!nodeName || !storyData || !storyData[nodeName]) {
      console.error(`Invalid node: ${nodeName}`);
      return;
    }
    
    setCurrentNode(nodeName);
    
    // Calculate page number from node
    const pageNumber = nodeMappings.nodeToPage[nodeName] || 1;
    
    console.log(`Node changed to ${nodeName}, corresponding to page: ${pageNumber}`);
    setCurrentPage(pageNumber);
  };

  // Confirmation when navigating away with unsaved changes
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setNavigationPath(path);
      setIsLeaveDialogOpen(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    setIsLeaveDialogOpen(false);
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  return {
    currentNode,
    currentPage,
    isLeaveDialogOpen,
    setIsLeaveDialogOpen,
    handlePageChange,
    handleNodeChange,
    handleNavigation,
    confirmNavigation,
  };
};
