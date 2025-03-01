
import React, { useState, useEffect, useRef } from "react";
import { CustomStory } from "@/lib/storyUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, AlertTriangle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonEditorProps {
  storyData: CustomStory;
  onChange: (data: CustomStory) => void;
  currentNode?: string;
  onNodeSelect?: (nodeName: string) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ 
  storyData, 
  onChange,
  currentNode = "root",
  onNodeSelect
}) => {
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>(currentNode);
  const [nodeOptions, setNodeOptions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Update available nodes
  useEffect(() => {
    if (storyData) {
      const nodes = Object.keys(storyData);
      setNodeOptions(nodes);
      if (!nodes.includes(selectedNode) && nodes.length > 0) {
        setSelectedNode(nodes[0]);
        if (onNodeSelect) {
          onNodeSelect(nodes[0]);
        }
      }
    }
  }, [storyData]);

  // Update JSON text when storyData changes
  useEffect(() => {
    if (storyData) {
      try {
        const formatted = JSON.stringify(storyData, null, 2);
        setJsonText(formatted);
        setError(null);
      } catch (e) {
        setError("Invalid JSON structure");
      }
    }
  }, [storyData]);

  // Update selected node if currentNode prop changes
  useEffect(() => {
    if (currentNode && currentNode !== selectedNode) {
      setSelectedNode(currentNode);
      
      // Highlight the node in the JSON
      setTimeout(() => {
        if (textareaRef.current) {
          const text = textareaRef.current.value;
          const pattern = new RegExp(`"${currentNode}"\\s*:\\s*{`, 'g');
          const match = pattern.exec(text);
          
          if (match && match.index) {
            // Find position in text
            const position = match.index;
            // Set selection to highlight the node
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(position, position + currentNode.length + 2);
            
            // Scroll to the node
            const lines = text.substring(0, position).split('\n');
            const lineNumber = lines.length;
            const lineHeight = 20; // Approximate line height in pixels
            textareaRef.current.scrollTop = lineHeight * (lineNumber - 5); // Scroll a few lines above
          }
        }
      }, 100);
    }
  }, [currentNode, selectedNode]);

  const handleNodeChange = (value: string) => {
    setSelectedNode(value);
    if (onNodeSelect) {
      onNodeSelect(value);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setError(null);
      onChange(parsed);
      
      // Update node options if structure changed
      const nodes = Object.keys(parsed);
      if (JSON.stringify(nodes) !== JSON.stringify(nodeOptions)) {
        setNodeOptions(nodes);
      }
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message);
    }
  };

  const handleReformat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setError(null);
      onChange(parsed);
      toast({
        title: "JSON reformatted",
        description: "Your JSON has been successfully reformatted.",
        duration: 3000,
      });
    } catch (e) {
      setError("Cannot reformat: " + (e as Error).message);
      toast({
        title: "Reformat failed",
        description: (e as Error).message,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleFocusNode = () => {
    if (selectedNode && textareaRef.current) {
      const text = textareaRef.current.value;
      const pattern = new RegExp(`"${selectedNode}"\\s*:\\s*{`, 'g');
      const match = pattern.exec(text);
      
      if (match && match.index) {
        // Find position in text
        const position = match.index;
        // Set selection to highlight the node
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(position, position + selectedNode.length + 2);
        
        // Scroll to the node
        const lines = text.substring(0, position).split('\n');
        const lineNumber = lines.length;
        const lineHeight = 20; // Approximate line height in pixels
        textareaRef.current.scrollTop = lineHeight * (lineNumber - 5); // Scroll a few lines above
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium">JSON Editor</h3>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">Current Node:</span>
            <Select value={selectedNode} onValueChange={handleNodeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select node" />
              </SelectTrigger>
              <SelectContent>
                {nodeOptions.map((node) => (
                  <SelectItem key={node} value={node}>
                    {node}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleFocusNode}
              title="Find node in JSON"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReformat}
          title="Reformat JSON"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reformat
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <ScrollArea className="h-[500px] border rounded-md bg-gray-50">
        <Textarea
          ref={textareaRef}
          value={jsonText}
          onChange={handleTextChange}
          className="font-mono text-sm min-h-[500px] border-none focus-visible:ring-0"
          placeholder="Enter your story JSON here..."
        />
      </ScrollArea>
    </div>
  );
};

export default JsonEditor;
