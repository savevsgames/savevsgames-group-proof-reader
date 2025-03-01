
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipBack, BookOpen } from "lucide-react";
import { CustomStory, storyNodeToPageMap, pageToStoryNodeMap } from "@/lib/storyUtils";
import { StoryChoice } from "@/lib/storyUtils";

interface ReaderViewProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onNodeChange?: (nodeName: string) => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({
  storyId,
  storyData,
  currentNode,
  onNodeChange,
}) => {
  const [currentText, setCurrentText] = useState<string>("");
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [canContinue, setCanContinue] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);

  // Get current page number from node name
  const currentPage = currentNode ? (storyNodeToPageMap[currentNode] || 1) : 1;
  
  // Calculate total pages based on number of nodes in the story
  const totalPages = Object.keys(storyNodeToPageMap).length;

  // Load the story node's content when currentNode changes
  useEffect(() => {
    if (!storyData || !currentNode) return;
    
    const node = storyData[currentNode];
    if (!node) return;
    
    setCurrentText(node.text || "");
    setChoices(node.choices || []);
    setCanContinue(node.choices && node.choices.length === 1 && node.choices[0].text === "Continue");
    setIsEnding(!!node.isEnding);
  }, [storyData, currentNode]);

  // Handler for navigating to a specific node
  const handleNavigateToNode = (nodeName: string) => {
    if (!storyData[nodeName]) {
      console.error(`Node "${nodeName}" not found in story data`);
      return;
    }
    
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
    if (pageNumber < 1 || pageNumber > totalPages) return;
    
    const nodeName = pageToStoryNodeMap[pageNumber];
    if (!nodeName || !storyData[nodeName]) {
      console.error(`No node found for page ${pageNumber}`);
      return;
    }
    
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <option key={page} value={page}>
                Page {page}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Story Content */}
      <div className="bg-[#E8DCC4] p-6 rounded-lg min-h-[300px] prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        <div className="text-[#3A2618] font-serif leading-relaxed text-lg mb-8">
          {formatText(currentText)}
        </div>
        
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
      </div>
    </div>
  );
};

export default ReaderView;
