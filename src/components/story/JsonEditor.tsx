
import React, { useState, useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { CustomStory, NodeMappings } from '@/types';

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
  onNodeSelect
}) => {
  const [editorValue, setEditorValue] = useState(JSON.stringify(storyData, null, 2));
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [currentDecorations, setCurrentDecorations] = useState<string[]>([]);
  
  useEffect(() => {
    if (storyData) {
      setEditorValue(JSON.stringify(storyData, null, 2));
    }
  }, [storyData]);

  // Handle editor mount
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Subscribe to cursor change events
    editor.onDidChangeCursorPosition((e) => {
      // Get the current position
      const position = e.position;
      
      // Get the current line content
      const lineContent = editor.getModel()?.getLineContent(position.lineNumber);
      
      if (lineContent) {
        // Extract the node name from the line
        const match = lineContent.match(/"(\w+)":\s*\{/);
        if (match && match[1]) {
          const nodeName = match[1];
          
          // Call the onNodeSelect function
          if (onNodeSelect) {
            onNodeSelect(nodeName);
          }
        }
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setEditorValue(value);
      try {
        const parsedData = JSON.parse(value);
        onChange(parsedData);
      } catch (e) {
        console.error("Error parsing JSON", e);
      }
    }
  };
  
  // Highlight the current node in the JSON editor
  const highlightCurrentNode = useCallback(() => {
    if (!editorRef.current || !currentNode) return;
    
    // Get the current editor value
    const jsonStr = editorRef.current.getValue();
    
    try {
      // For fragments, adjust the node name to account for zero-based indexing
      let nodeToHighlight = currentNode;
      if (currentNode.startsWith('fragment_') && currentPage) {
        // This makes sure we highlight fragment_0 when on page 1
        const fragmentNumber = parseInt(currentNode.replace('fragment_', ''));
        if (!isNaN(fragmentNumber)) {
          nodeToHighlight = `fragment_${fragmentNumber}`;
        }
      }
      
      // Add proper null check for nodeMappings before trying to access properties
      if (!nodeMappings || !nodeMappings.nodeToPage) {
        console.log(`[JsonEditor] Node mappings not available yet for node "${nodeToHighlight}"`);
        return;
      }
      
      // Find the position of the current node in the JSON
      const nodePos = findNodePositionInJson(jsonStr, nodeToHighlight);
      if (!nodePos) {
        console.log(`[JsonEditor] Node "${nodeToHighlight}" not found in editor content`);
        return;
      }
      
      // Create a decoration to highlight the line
      const decorations = editorRef.current.deltaDecorations([], [
        {
          range: new monaco.Range(
            nodePos.startLineNumber,
            nodePos.startColumn,
            nodePos.endLineNumber,
            nodePos.endColumn
          ),
          options: {
            className: 'current-node-highlight',
            isWholeLine: false,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        }
      ]);
      
      // Store decorations for later removal
      setCurrentDecorations(decorations);
      
      // Scroll to the highlighted position
      editorRef.current.revealLineInCenter(nodePos.startLineNumber);
      
      console.log(`[JsonEditor] Highlighted node "${nodeToHighlight}" at line ${nodePos.startLineNumber}`);
    } catch (error) {
      console.error("[JsonEditor] Error highlighting node:", error);
    }
  }, [currentNode, currentPage, nodeMappings]);

  useEffect(() => {
    // Remove previous decorations
    if (editorRef.current) {
      editorRef.current.deltaDecorations(currentDecorations, []);
    }
    
    // Highlight the current node
    highlightCurrentNode();
  }, [currentNode, highlightCurrentNode, currentDecorations]);

  // Monaco editor options
  const options: monaco.editor.IStandaloneEditorConstructionOptions = {
    selectOnLineNumbers: true,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
  };

  // Find node position in the JSON string
  const findNodePositionInJson = (jsonStr: string, nodeName: string): monaco.IRange | null => {
    try {
      // Create a valid nodeName pattern for fragments
      // This handles both normal node names and fragment-based nodes
      const isFragment = nodeName.startsWith('fragment_');
      
      // For fragments, we need to be precise with the pattern
      const searchPattern = isFragment 
        ? `"${nodeName}"`
        : `"${nodeName}"`;
      
      const lines = jsonStr.split("\n");
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes(searchPattern)) {
          // Find the start of the node
          const nodeStartIndex = line.indexOf(searchPattern);
          
          // Node definition continues to the end of the object
          // This is a simple approach; a more robust one would count braces
          let endLineNumber = i;
          let endColumn = line.length;
          
          // Look for object end (closing brace)
          let braceCount = line.split('{').length - line.split('}').length;
          let j = i;
          
          while (braceCount > 0 && j < lines.length) {
            j++;
            if (j >= lines.length) break;
            
            braceCount += lines[j].split('{').length;
            braceCount -= lines[j].split('}').length;
            
            if (braceCount <= 0) {
              endLineNumber = j;
              endColumn = lines[j].indexOf('}') + 1;
              break;
            }
          }
          
          return {
            startLineNumber: i + 1, // Monaco uses 1-based line numbers
            startColumn: nodeStartIndex + 1, // Monaco uses 1-based column numbers
            endLineNumber: endLineNumber + 1,
            endColumn: endColumn + 1
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("[JsonEditor] Error finding node position:", error);
      return null;
    }
  };

  return (
    <MonacoEditor
      height="600px"
      language="json"
      value={editorValue}
      options={options}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
    />
  );
};

export default JsonEditor;
