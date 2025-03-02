
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Save } from "lucide-react";
import { CustomStory, NodeMappings } from "@/types";

interface JsonEditorProps {
  storyData: CustomStory;
  onChange: (data: CustomStory) => void;
  currentNode?: string;
  currentPage?: number;
  nodeMappings?: NodeMappings;
  onNodeSelect?: (nodeName: string) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  storyData,
  onChange,
  currentNode,
  currentPage,
  nodeMappings,
  onNodeSelect,
}) => {
  const [jsonValue, setJsonValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(currentNode || null);
  
  // Refs for the editor and highlight overlay
  const editorRef = useRef<HTMLDivElement>(null);
  const highlightOverlayRef = useRef<HTMLDivElement>(null);
  
  // Track if editor has been initialized to prevent unnecessary re-renders
  const editorInitializedRef = useRef<boolean>(false);
  const lastSnapshotRef = useRef<Range | null>(null);

  // Initialize editor with formatted JSON
  useEffect(() => {
    if (!storyData || editorInitializedRef.current) return;
    
    try {
      const formatted = JSON.stringify(storyData, null, 2);
      setJsonValue(formatted);
      editorInitializedRef.current = true;
    } catch (err) {
      console.error("Error initializing JSON editor:", err);
      setError("Failed to initialize editor with story data");
    }
  }, [storyData]);

  // Update node highlighting when currentNode or currentPage changes
  useEffect(() => {
    // First check if we should use the page mapping
    if (currentPage && nodeMappings?.pageToNode) {
      const nodeFromPage = nodeMappings.pageToNode[currentPage];
      if (nodeFromPage) {
        setSelectedNode(nodeFromPage);
        highlightCurrentNode(nodeFromPage);
        return;
      }
    }
    
    // Fallback to direct node highlighting
    if (currentNode) {
      setSelectedNode(currentNode);
      highlightCurrentNode(currentNode);
    }
  }, [currentNode, currentPage, nodeMappings]);

  // Handle JSON changes
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonValue(newValue);
    
    try {
      const parsed = JSON.parse(newValue);
      setIsValid(true);
      setError(null);
      onChange(parsed);
    } catch (err: any) {
      setIsValid(false);
      setError(err.message || "Invalid JSON");
    }
  };

  // Helper to find the position of a node in the JSON text
  const findNodePosition = (text: string, nodeName: string): { start: number, end: number } | null => {
    try {
      // Look for the node pattern: "nodeName": {
      const nodePattern = new RegExp(`"${nodeName}"\\s*:\\s*\\{`, "g");
      const match = nodePattern.exec(text);
      
      if (!match) return null;
      
      const start = match.index;
      let openBraces = 1;
      let position = match.index + match[0].length;
      
      // Find the matching closing brace
      while (openBraces > 0 && position < text.length) {
        if (text[position] === '{') openBraces++;
        if (text[position] === '}') openBraces--;
        position++;
      }
      
      return { start, end: position };
    } catch (err) {
      console.error("Error finding node position:", err);
      return null;
    }
  };

  // Create a selection range for the node
  const createNodeSelectionRange = (nodeName: string): Range | null => {
    if (!editorRef.current) return null;
    
    const textArea = editorRef.current.querySelector("textarea");
    if (!textArea) return null;
    
    const text = textArea.value;
    const position = findNodePosition(text, nodeName);
    
    if (!position) return null;
    
    try {
      const range = document.createRange();
      const startPos = position.start;
      const endPos = position.end;
      
      // We need to convert text positions to DOM positions
      // This is a simplified approach and might need refinement
      const textToStartNode = text.substring(0, startPos);
      const startLine = (textToStartNode.match(/\n/g) || []).length + 1;
      
      const textToEndNode = text.substring(0, endPos);
      const endLine = (textToEndNode.match(/\n/g) || []).length + 1;
      
      // Store selection information for highlighting overlay
      lastSnapshotRef.current = range;
      
      return range;
    } catch (err) {
      console.error("Error creating selection range:", err);
      return null;
    }
  };

  // Highlight the current node in the editor
  const highlightCurrentNode = (nodeName: string) => {
    console.log("[JsonEditor] Highlighting node:", nodeName);
    
    if (!editorRef.current || !highlightOverlayRef.current) {
      console.log("[JsonEditor] Editor or overlay ref not available yet");
      return;
    }
    
    try {
      // Create a selection range for the node
      const range = createNodeSelectionRange(nodeName);
      
      if (!range) {
        console.log(`[JsonEditor] Couldn't find node ${nodeName} in the JSON`);
        return;
      }
      
      // Position the highlight overlay
      const textArea = editorRef.current.querySelector("textarea");
      if (!textArea) return;
      
      const text = textArea.value;
      const position = findNodePosition(text, nodeName);
      
      if (!position) return;
      
      // Count lines and characters to position the overlay
      const textToStartNode = text.substring(0, position.start);
      const startLine = (textToStartNode.match(/\n/g) || []).length;
      const startCharInLine = position.start - textToStartNode.lastIndexOf("\n") - 1;
      
      const nodeText = text.substring(position.start, position.end);
      const nodeLines = (nodeText.match(/\n/g) || []).length + 1;
      
      // Update overlay dimensions and position
      // This uses a combination of line height and character width approximation
      const lineHeight = 20; // Approximate line height in pixels
      const charWidth = 8;   // Approximate character width in pixels
      
      const overlay = highlightOverlayRef.current;
      
      // Safety check for overlay
      if (!overlay) return;
      
      overlay.style.top = `${startLine * lineHeight}px`;
      overlay.style.left = `${startCharInLine * charWidth}px`;
      overlay.style.height = `${nodeLines * lineHeight}px`;
      overlay.style.width = `calc(100% - ${startCharInLine * charWidth}px)`;
      
      // Make sure the overlay is visible
      overlay.classList.remove("hidden");
      
      // If a node was clicked, inform the parent
      if (onNodeSelect) {
        onNodeSelect(nodeName);
      }
    } catch (err) {
      console.error("Error highlighting node:", err);
    }
  };

  // Render the highlight overlay
  const renderHighlightOverlay = () => {
    // Get a snapshot of the selection if available
    const snapshot = lastSnapshotRef.current;
    if (!snapshot) return null;

    return null; // The overlay is positioned with CSS
  };

  // Handle node selection
  const handleNodeClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!editorRef.current) return;
    
    const textArea = e.currentTarget;
    const text = textArea.value;
    
    try {
      // Get cursor position
      const cursorPos = textArea.selectionStart;
      
      // Find which node contains this position
      const nodes = Object.keys(storyData || {}).filter(key => {
        // Skip non-object properties or special properties
        if (
          !storyData[key] || 
          typeof storyData[key] !== "object" ||
          key === "inkVersion" ||
          key === "listDefs"
        ) {
          return false;
        }
        return true;
      });
      
      // Find node containing cursor position
      for (const node of nodes) {
        const position = findNodePosition(text, node);
        if (position && cursorPos >= position.start && cursorPos <= position.end) {
          setSelectedNode(node);
          highlightCurrentNode(node);
          break;
        }
      }
    } catch (err) {
      console.error("Error handling node click:", err);
    }
  };

  return (
    <div className="relative">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isValid ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Valid JSON
            </span>
          ) : (
            <span className="text-red-500">{error}</span>
          )}
        </div>
        
        {selectedNode && (
          <div className="text-sm bg-muted px-2 py-1 rounded">
            Editing: <span className="font-mono">{selectedNode}</span>
          </div>
        )}
      </div>

      <div className="relative" ref={editorRef}>
        <textarea
          value={jsonValue}
          onChange={handleEditorChange}
          onClick={handleNodeClick}
          className="w-full h-[500px] font-mono text-sm p-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          spellCheck="false"
        />

        <div
          ref={highlightOverlayRef}
          className="json-node-highlight absolute pointer-events-none overflow-hidden"
        >
          {renderHighlightOverlay()}
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
