
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
  const [highlightedText, setHighlightedText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Update available nodes
  useEffect(() => {
    if (storyData) {
      const nodes = Object.keys(storyData).filter(key => 
        // Filter out metadata nodes that aren't story content
        key !== 'inkVersion' && key !== 'listDefs'
      );
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
      highlightCurrentNode(currentNode);
    }
  }, [currentNode, jsonText]);

  // Focus and highlight the current node in the JSON
  const highlightCurrentNode = (nodeName: string) => {
    if (!textareaRef.current || !jsonText) return;
    
    const text = jsonText;
    // Use a more robust pattern that can handle various node formats
    const nodePattern = new RegExp(`(["\'])${nodeName}\\1\\s*:\\s*\\{`, 'g');
    const match = nodePattern.exec(text);
    
    if (match && match.index !== undefined) {
      // Find position in text
      const position = match.index;
      
      // Find the opening brace position
      const bracePos = text.indexOf('{', position);
      if (bracePos === -1) return;
      
      // Find the closing brace position by counting braces
      let braceCount = 1;
      let closingBracePos = bracePos + 1;
      
      while (braceCount > 0 && closingBracePos < text.length) {
        if (text[closingBracePos] === '{') braceCount++;
        if (text[closingBracePos] === '}') braceCount--;
        closingBracePos++;
      }
      
      // The node's content is between these positions
      const nodeContent = text.substring(position, closingBracePos);
      setHighlightedText(nodeContent);
      
      // Set selection to highlight the node
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(position, position + nodeContent.length);
      
      // Scroll to the node
      const lines = text.substring(0, position).split('\n');
      const lineNumber = lines.length;
      const lineHeight = 20; // Approximate line height in pixels
      textareaRef.current.scrollTop = lineHeight * (lineNumber - 5); // Scroll a few lines above
      
      console.log(`Highlighted node ${nodeName} at position ${position}, length ${nodeContent.length}`);
    } else {
      console.warn(`Node ${nodeName} not found in JSON text`);
    }
  };

  const handleNodeChange = (value: string) => {
    setSelectedNode(value);
    highlightCurrentNode(value);
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
      const nodes = Object.keys(parsed).filter(key => 
        key !== 'inkVersion' && key !== 'listDefs'
      );
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
      
      // Rehighlight current node after reformatting
      setTimeout(() => highlightCurrentNode(selectedNode), 100);
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
    highlightCurrentNode(selectedNode);
  };

  // Custom styles for highlighting the current node
  const textAreaStyle = {
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    tabSize: 2,
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
          style={textAreaStyle}
        />
      </ScrollArea>
    </div>
  );
};

export default JsonEditor;
