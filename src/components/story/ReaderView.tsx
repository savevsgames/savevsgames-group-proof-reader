
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipBack, BookOpen, AlertCircle } from "lucide-react";
import { CustomStory } from "@/lib/storyUtils";
import { StoryChoice } from "@/lib/storyUtils";
import { useToast } from "@/hooks/use-toast";

interface ReaderViewProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onNodeChange?: (nodeName: string) => void;
  nodeMappings?: {
    nodeToPage: Record<string, number>;
    pageToNode: Record<number, string>;
  };
}

const ReaderView: React.FC<ReaderViewProps> = ({
  storyId,
  storyData,
  currentNode,
  onNodeChange,
  nodeMappings = { 
    nodeToPage: {}, 
    pageToNode: {} 
  }
}) => {
  const [currentText, setCurrentText] = useState<string>("");
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [canContinue, setCanContinue] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const { toast } = useToast();

  // Generate proper node mappings on component load if not provided
  const [mappings, setMappings] = useState(nodeMappings);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Always update with the latest provided mappings
    if (nodeMappings) {
      setMappings(nodeMappings);
      console.log("ReaderView: Updated with latest mappings", nodeMappings);
    }
  }, [nodeMappings]);

  // Get current page number from node name using provided mappings
  const currentPage = currentNode && mappings.nodeToPage ? mappings.nodeToPage[currentNode] || 1 : 1;
  
  // Calculate total pages based on number of story nodes (excluding metadata nodes)
  const totalPages = mappings.pageToNode ? 
    Math.max(...Object.keys(mappings.pageToNode).map(Number).filter(page => {
      const node = mappings.pageToNode[page];
      return node !== "inkVersion" && node !== "listDefs";
    })) : 
    (storyData ? Object.keys(storyData).filter(key => key !== "inkVersion" && key !== "listDefs").length : 1);

  // Load the story node's content when currentNode changes
  useEffect(() => {
    if (!storyData || !currentNode) {
      console.log("ReaderView: No storyData or currentNode", { storyData, currentNode });
      setError("No story data available.");
      return;
    }
    
    // Reset error state
    setError(null);
    
    const node = storyData[currentNode];
    if (!node) {
      console.error(`ReaderView: Node "${currentNode}" not found in story data`);
      setError(`Node "${currentNode}" not found in story data.`);
      return;
    }
    
    console.log(`ReaderView: Loading node "${currentNode}"`, node);
    setCurrentText(node.text || "");
    setChoices(node.choices || []);
    setCanContinue(node.choices && node.choices.length === 1 && node.choices[0].text === "Continue");
    setIsEnding(!!node.isEnding);
  }, [storyData, currentNode]);

  // Handler for navigating to a specific node
  const handleNavigateToNode = (nodeName: string) => {
    if (!storyData[nodeName]) {
      console.error(`ReaderView: Node "${nodeName}" not found in story data`);
      setError(`Node "${nodeName}" not found in story data.`);
      return;
    }
    
    // Reset error state
    setError(null);
    
    // Save current node to history for back navigation
    setHistory(prev => [...prev, currentNode]);
    
    // Update the current node
    if (onNodeChange) {
      onNodeChange(nodeName);
    }
  };

  // Handler for the Continue button
  const handleContinue = () => {
    if (!canContinue || choices.length === 0) return;
    
    const nextNode = choices[0].nextNode;
    handleNavigateToNode(nextNode);
  };

  // Handler for making a choice
  const handleChoice = (index: number) => {
    if (index < 0 || index >= choices.length) return;
    
    const choice = choices[index];
    handleNavigateToNode(choice.nextNode);
  };

  // Handler for going back to the previous node
  const handleBack = () => {
    if (history.length === 0) return;
    
    const prevHistory = [...history];
    const prevNode = prevHistory.pop();
    
    if (prevNode) {
      // Update history
      setHistory(prevHistory);
      
      // Update current node
      if (onNodeChange) {
        onNodeChange(prevNode);
      }
    }
  };

  // Handler for restarting the story
  const handleRestart = () => {
    // Clear history
    setHistory([]);
    
    // Navigate to root node
    if (onNodeChange) {
      onNodeChange("root");
    }
  };

  // Handler for going to a specific page by number
  const handleGoToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      console.error(`ReaderView: Invalid page number ${pageNumber}, total pages: ${totalPages}`);
      return;
    }
    
    // Debug output to trace the issue
    console.log(`Attempting to navigate to page ${pageNumber}`);
    console.log("Available pageToNode mappings:", mappings.pageToNode);
    
    // We need to access the correct node name for this page number
    const nodeName = mappings.pageToNode[pageNumber];
    
    if (!nodeName) {
      console.error(`ReaderView: No node mapping found for page ${pageNumber}`);
      toast({
        title: "Navigation Error",
        description: `Could not find node mapping for page ${pageNumber}`,
        variant: "destructive"
      });
      setError(`No node found for page ${pageNumber}`);
      return;
    }
    
    // Make sure the node exists in storyData and is not a metadata node
    if (nodeName === "inkVersion" || nodeName === "listDefs") {
      console.error(`ReaderView: Cannot navigate to metadata node "${nodeName}"`);
      toast({
        title: "Navigation Error",
        description: `Cannot navigate to metadata node "${nodeName}"`,
        variant: "destructive"
      });
      setError(`Cannot navigate to metadata node "${nodeName}"`);
      return;
    }
    
    if (!storyData[nodeName]) {
      console.error(`ReaderView: Node "${nodeName}" not found in storyData for page ${pageNumber}`);
      toast({
        title: "Navigation Error",
        description: `Node "${nodeName}" not found in story data`,
        variant: "destructive"
      });
      setError(`Node "${nodeName}" not found in storyData for page ${pageNumber}`);
      return;
    }
    
    console.log(`ReaderView: Navigating to page ${pageNumber}, node: ${nodeName}`);
    
    // Save current node to history for back navigation
    setHistory(prev => [...prev, currentNode]);
    
    // Update the current node
    if (onNodeChange) {
      onNodeChange(nodeName);
    }
  };

  // Function to format text to handle newlines
  const formatText = (text: string) => {
    return text
      .split('\n')
      .map((paragraph, index) => (
        <p key={`p-${index}`} className="mb-4">{paragraph}</p>
      ));
  };

  // Function to get valid page numbers for the dropdown
  const getValidPageNumbers = () => {
    if (!mappings.pageToNode) return [1];
    
    return Object.entries(mappings.pageToNode)
      .filter(([_, node]) => node !== "inkVersion" && node !== "listDefs" && storyData[node])
      .map(([page]) => parseInt(page))
      .sort((a, b) => a - b);
  };

  const validPages = getValidPageNumbers();

  return (
    <div className="flex flex-col space-y-6">
      {/* Story Navigation Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            title="Restart Story"
          >
            <SkipBack className="h-4 w-4 mr-1" />
            Restart
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={history.length === 0}
            title="Go Back"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-[#F97316]" />
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        {/* Page Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">Go to:</span>
          <select
            className="border rounded p-1 text-sm"
            value={currentPage}
            onChange={(e) => handleGoToPage(parseInt(e.target.value))}
          >
            {validPages.map(page => (
              <option key={page} value={page}>
                Page {page}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Story Content */}
      <div className="bg-[#E8DCC4] p-6 rounded-lg min-h-[300px] prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        {currentText ? (
          <div className="text-[#3A2618] font-serif leading-relaxed text-lg mb-8">
            {formatText(currentText)}
          </div>
        ) : (
          <div className="text-[#3A2618] font-serif leading-relaxed text-lg mb-8 italic text-center">
            No content available for this node.
          </div>
        )}
        
        {/* Story Controls */}
        <div className="mt-8">
          {!isEnding ? (
            <div className="space-y-6">
              {canContinue ? (
                <div className="flex justify-center">
                  <Button 
                    onClick={handleContinue}
                    className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
                  >
                    Continue Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : choices.length > 0 ? (
                <>
                  <p className="text-[#3A2618] font-serif text-center italic">What would you like to do?</p>
                  <div className="flex flex-col space-y-4">
                    {choices.map((choice, index) => (
                      <div key={`choice-${index}`} className="text-center">
                        <button
                          onClick={() => handleChoice(index)}
                          className="font-serif text-[#3A2618] hover:text-[#F97316] transition-colors border-b border-[#3A2618] hover:border-[#F97316] px-4 py-1 italic"
                        >
                          {choice.text}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#3A2618] font-serif mb-4">The story has ended.</p>
              <Button
                onClick={handleRestart}
                className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors"
              >
                Start Over
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Story Node Information (helpful for editors) */}
      <div className="border-t pt-4 text-sm text-gray-500">
        <p>Current Node: <span className="font-mono">{currentNode}</span></p>
        <p>Available Choices: {choices.length}</p>
        <p>Valid Pages: {validPages.join(', ')}</p>
      </div>
    </div>
  );
};

export default ReaderView;
