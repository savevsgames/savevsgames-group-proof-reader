
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

interface NodeRange {
  start: number;
  end: number;
  startLine: number;
  endLine: number;
  content: string;
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
  const [activeNodeRange, setActiveNodeRange] = useState<NodeRange | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightOverlayRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (storyData) {
      const nodes = Object.keys(storyData).filter(key => 
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

  useEffect(() => {
    if (currentNode && currentNode !== selectedNode) {
      setSelectedNode(currentNode);
      highlightCurrentNode(currentNode);
    }
  }, [currentNode, jsonText]);

  // Calculate the range of a node in the JSON text
  const findNodeRange = (text: string, nodeName: string): NodeRange | null => {
    if (!text) return null;
    
    const nodePattern = new RegExp(`(["\'])${nodeName}\\1\\s*:\\s*\\{`, 'g');
    const match = nodePattern.exec(text);
    
    if (!match || match.index === undefined) {
      console.warn(`Node ${nodeName} not found in JSON text`);
      return null;
    }
    
    const position = match.index;
    const bracePos = text.indexOf('{', position);
    if (bracePos === -1) return null;
    
    // Find closing brace by tracking brace count
    let braceCount = 1;
    let closingBracePos = bracePos + 1;
    
    while (braceCount > 0 && closingBracePos < text.length) {
      if (text[closingBracePos] === '{') braceCount++;
      if (text[closingBracePos] === '}') braceCount--;
      closingBracePos++;
    }
    
    const nodeContent = text.substring(position, closingBracePos);
    
    // Calculate line numbers for highlighting
    const beforeNode = text.substring(0, position);
    const startLine = beforeNode.split('\n').length;
    const nodeLines = nodeContent.split('\n');
    const endLine = startLine + nodeLines.length - 1;
    
    return {
      start: position,
      end: closingBracePos,
      startLine,
      endLine,
      content: nodeContent
    };
  };

  const highlightCurrentNode = (nodeName: string) => {
    if (!textareaRef.current || !jsonText) return;
    
    const nodeRange = findNodeRange(jsonText, nodeName);
    if (!nodeRange) return;
    
    setActiveNodeRange(nodeRange);
    
    // Scroll to the node (aim for a few lines above it)
    const lineHeight = 20; // approximate line height
    textareaRef.current.scrollTop = (nodeRange.startLine - 3) * lineHeight;
    
    console.log(`Highlighted node ${nodeName} from line ${nodeRange.startLine} to ${nodeRange.endLine}`);
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

  // Renders a highlighted overlay for the currently selected node
  const renderHighlightOverlay = () => {
    if (!activeNodeRange || !jsonText) return null;
    
    // Split the JSON text into lines
    const lines = jsonText.split('\n');
    
    // Create an array of line highlights
    const lineHighlights = lines.map((line, index) => {
      const lineNumber = index + 1;
      const isHighlighted = lineNumber >= activeNodeRange.startLine && lineNumber <= activeNodeRange.endLine;
      
      return (
        <div 
          key={`line-${lineNumber}`}
          className={`json-line ${isHighlighted ? 'json-line-highlighted' : ''}`}
        >
          {line}
        </div>
      );
    });
    
    return lineHighlights;
  };

  const textAreaStyle = {
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    tabSize: 2,
    position: 'relative' as const,
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <style>
        {`
          .json-editor-container {
            position: relative;
          }
          
          .json-editor-textarea {
            font-family: monospace;
            font-size: 14px;
            line-height: 1.5;
            tab-size: 2;
            white-space: pre;
          }
          
          .json-line {
            height: 20px;
            padding: 0 8px;
            white-space: pre;
            line-height: 1.5;
          }
          
          .json-line-highlighted {
            background-color: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
            border-right: 3px solid #3b82f6;
          }
          
          .json-node-active {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            white-space: pre;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.5;
            tab-size: 2;
            overflow: auto;
            user-select: none;
          }
        `}
      </style>
      
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

      <ScrollArea className="h-[500px] border rounded-md bg-gray-50 json-editor-container">
        <div
          ref={highlightOverlayRef}
          className="json-node-active hidden"
        >
          {renderHighlightOverlay()}
        </div>
        <Textarea
          ref={textareaRef}
          value={jsonText}
          onChange={handleTextChange}
          className="json-editor-textarea min-h-[500px] border-none focus-visible:ring-0"
          placeholder="Enter your story JSON here..."
          style={textAreaStyle}
        />
      </ScrollArea>
    </div>
  );
};

export default JsonEditor;
