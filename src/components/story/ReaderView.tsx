
import React from "react";
import { CustomStory } from "@/lib/storyUtils";
import StoryDisplay from "./StoryDisplay";
import StoryChoices from "./StoryChoices";
import { Card } from "@/components/ui/card";

interface ReaderViewProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onNodeChange: (nodeName: string) => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({
  storyId,
  storyData,
  currentNode,
  onNodeChange,
}) => {
  const currentNodeData = storyData[currentNode];

  if (!currentNodeData) {
    return (
      <div className="p-4 text-center">
        <p>Node not found: {currentNode}</p>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-[#F8F5EF] border border-amber-100">
      <StoryDisplay text={currentNodeData.text} />
      
      {currentNodeData.choices && currentNodeData.choices.length > 0 ? (
        <StoryChoices
          choices={currentNodeData.choices}
          onChoiceSelected={(choiceIndex) => {
            const selectedChoice = currentNodeData.choices[choiceIndex];
            if (selectedChoice && selectedChoice.nextNode) {
              onNodeChange(selectedChoice.nextNode);
            }
          }}
        />
      ) : currentNodeData.isEnding ? (
        <div className="mt-6 text-center text-gray-600 italic">
          <p>The End</p>
        </div>
      ) : (
        <div className="mt-6 text-center text-gray-600 italic">
          <p>No choices available for this node.</p>
        </div>
      )}
    </Card>
  );
};

export default ReaderView;
