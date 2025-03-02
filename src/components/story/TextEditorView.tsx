
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertCircle, ShieldCheck, LayoutDashboard } from "lucide-react";
import { CustomStory } from "@/types";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface TextEditorViewProps {
  storyData: CustomStory;
  currentNode: string;
  onStoryDataChange: (data: CustomStory) => void;
  isPublicEditable?: boolean;
}

const TextEditorView: React.FC<TextEditorViewProps> = ({
  storyData,
  currentNode,
  onStoryDataChange,
  isPublicEditable = false
}) => {
  // Local state for the edited text
  const [nodeText, setNodeText] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the current node text when the component mounts or when currentNode changes
  useEffect(() => {
    if (!storyData || !currentNode) {
      console.log("[TextEditorView] No storyData or currentNode");
      setError("No story data available.");
      return;
    }
    
    setError(null);
    
    const node = storyData[currentNode];
    if (!node) {
      console.error(`[TextEditorView] Node "${currentNode}" not found in story data`);
      setError(`Node "${currentNode}" not found in story data.`);
      return;
    }
    
    console.log(`[TextEditorView] Loading text for node "${currentNode}"`);
    
    // Reset the text and changes flag when we load a new node
    setNodeText(node.text || "");
    setHasChanges(false);
  }, [storyData, currentNode]);

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodeText(e.target.value);
    setHasChanges(true);
  };

  // Save changes to the story data
  const handleSave = () => {
    if (!storyData || !currentNode) {
      setError("Cannot save: No story data or node selected.");
      return;
    }

    try {
      // Create a deep copy of the story data
      const updatedStoryData = JSON.parse(JSON.stringify(storyData));
      
      // Update the text of the current node
      if (updatedStoryData[currentNode]) {
        updatedStoryData[currentNode].text = nodeText;
        
        // Pass the updated data back up
        onStoryDataChange(updatedStoryData);
        
        // Reset the changes flag
        setHasChanges(false);
        
        // Show success toast
        toast.success("Text saved successfully");
      } else {
        setError(`Cannot save: Node "${currentNode}" not found.`);
        toast.error(`Cannot save: Node "${currentNode}" not found.`);
      }
    } catch (err: any) {
      console.error("[TextEditorView] Error saving text:", err);
      setError(`Error saving text: ${err.message}`);
      toast.error(`Error saving text: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {isPublicEditable && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-start">
          <ShieldCheck className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Community Editable Book</p>
            <p className="text-sm">This is a public book that anyone can edit. Your changes will be visible to all users.</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          Editing Text for Node: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{currentNode}</span>
        </h3>
        
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-[#3A2618] hover:bg-[#5A3A28] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Text
          </Button>
        </div>
      </div>
      
      <div className="bg-[#E8DCC4] rounded-lg p-6">
        <Textarea
          value={nodeText}
          onChange={handleTextChange}
          className="min-h-[400px] font-serif text-lg bg-[#F5F1E8] border-[#D8CCA4] focus-visible:ring-[#F97316] resize-y"
          placeholder="Enter your story text here..."
        />
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Format your text with new lines for paragraphs. Use 'IMAGE:' on a separate line to indicate a place for image (handled automatically).</p>
      </div>
    </div>
  );
};

export default TextEditorView;
