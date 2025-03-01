import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipBack, BookOpen, AlertCircle } from "lucide-react";
import { 
  CustomStory,
  storyNodeToPageMap,
  pageToStoryNodeMap,
  parseInkNode
} from "@/lib/storyUtils";
import { useToast } from "@/hooks/use-toast";
import { StoryDisplay } from "./StoryDisplay";

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
    nodeToPage: storyNodeToPageMap, 
    pageToNode: pageToStoryNodeMap
  }
}) => {
  const [currentText, setCurrentText] = useState<string>("");
  const [choices, setChoices] = useState<any[]>([]);
  const [canContinue, setCanContinue] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const currentPage = currentNode ? (nodeMappings.nodeToPage[currentNode] || 1) : 1;
  const totalPages = Object.keys(nodeMappings.pageToNode).length;

  useEffect(() => {
    if (!storyData || !currentNode) {
      console.log("ReaderView: No storyData or currentNode", { storyData, currentNode });
      setError("No story data available.");
      return;
    }
    
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
    
    setCanContinue(
      node.choices && 
      node.choices.length === 1 && 
      node.choices[0].text.toLowerCase().includes("continue")
    );
    
    setIsEnding(!!node.isEnding);
  }, [storyData, currentNode]);

  const handleNavigateToNode = (nodeName: string) => {
    if (!storyData[nodeName]) {
      console.error(`ReaderView: Node "${nodeName}" not found in story data`);
      setError(`Node "${nodeName}" not found in story data.`);
      return;
    }
    
    setError(null);
    
    setHistory(prev => [...prev, currentNode]);
    
    if (onNodeChange) {
      console.log(`ReaderView: Navigating to node "${nodeName}"`);
      onNodeChange(nodeName);
    }
  };

  const handleContinue = () => {
    if (!canContinue || choices.length === 0) {
      console.log("ReaderView: Cannot continue - no valid choice available");
      return;
    }
    
    const nextNode = choices[0].nextNode;
    console.log(`ReaderView: Continuing to node "${nextNode}"`);
    handleNavigateToNode(nextNode);
  };

  const handleChoice = (index: number) => {
    if (index < 0 || index >= choices.length) {
      console.log(`ReaderView: Invalid choice index ${index}`);
      return;
    }
    
    const choice = choices[index];
    console.log(`ReaderView: Selected choice ${index}: "${choice.text}" -> "${choice.nextNode}"`);
    handleNavigateToNode(choice.nextNode);
  };

  const handleBack = () => {
    if (history.length === 0) {
      console.log("ReaderView: Cannot go back - no history available");
      return;
    }
    
    const prevHistory = [...history];
    const prevNode = prevHistory.pop();
    
    if (prevNode) {
      console.log(`ReaderView: Going back to node "${prevNode}"`);
      setHistory(prevHistory);
      if (onNodeChange) {
        onNodeChange(prevNode);
      }
    }
  };

  const handleRestart = () => {
    setHistory([]);
    console.log("ReaderView: Restarting from root");
    
    if (onNodeChange) {
      onNodeChange("root");
    }
  };

  const handleGoToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      console.error(`ReaderView: Invalid page number ${pageNumber}, total pages: ${totalPages}`);
      return;
    }
    
    const nodeName = nodeMappings.pageToNode[pageNumber];
    
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
    
    if (nodeName === "inkVersion" || nodeName === "listDefs" || nodeName === "#f") {
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
    
    setHistory(prev => [...prev, currentNode]);
    
    if (onNodeChange) {
      onNodeChange(nodeName);
    }
  };

  const formatText = (text: string) => {
    return text
      .split('\n')
      .map((paragraph, index) => (
        <p key={`p-${index}`} className="mb-4">{paragraph}</p>
      ));
  };

  const getValidPageNumbers = () => {
    if (!nodeMappings?.pageToNode) return [1];
    
    return Object.entries(nodeMappings.pageToNode)
      .filter(([_, node]) => {
        const nodeName = node as string;
        return nodeName !== "inkVersion" && 
               nodeName !== "listDefs" && 
               nodeName !== "#f" && 
               storyData[nodeName];
      })
      .map(([page]) => parseInt(page))
      .sort((a, b) => a - b);
  };

  const handleContinueToNextNode = () => {
    const currentPageNumber = nodeMappings.nodeToPage[currentNode] || 1;
    const nextPageNumber = currentPageNumber + 1;
    
    if (nextPageNumber <= totalPages) {
      const nextNodeName = nodeMappings.pageToNode[nextPageNumber];
      if (nextNodeName && storyData[nextNodeName]) {
        handleNavigateToNode(nextNodeName);
      } else {
        toast({
          title: "Navigation Error",
          description: "Could not find the next node",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "End of Story",
        description: "You've reached the end of the story",
        variant: "default"
      });
    }
  };

  const validPages = getValidPageNumbers();

  return (
    <div className="flex flex-col space-y-6">
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
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div className="bg-[#E8DCC4] p-6 rounded-lg min-h-[300px] prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        {currentText ? (
          <div className="text-[#3A2618] font-serif leading-relaxed text-lg mb-8">
            {formatText(currentText)}
          </div>
        ) : (
          <div className="text-[#3A2618] font-serif leading-relaxed text-lg mb-8 italic text-center">
            <p>No content available for this node.</p>
            
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleContinueToNextNode}
                className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
              >
                Continue to Next Node <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
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
      
      <div className="border-t pt-4 text-sm text-gray-500">
        <p>Current Node: <span className="font-mono">{currentNode}</span></p>
        <p>Current Page: <span className="font-mono">{currentPage}</span></p>
        <p>Available Choices: {choices.length}</p>
        <p>Valid Pages: {validPages.join(', ')}</p>
      </div>
    </div>
  );
};

export default ReaderView;
