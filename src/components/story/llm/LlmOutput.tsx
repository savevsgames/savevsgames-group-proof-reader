
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LlmOutputProps {
  output: string;
  error?: string;
}

const LlmOutput: React.FC<LlmOutputProps> = ({ output, error }) => {
  // Check if output is JSON and format it if it is
  const formatOutput = (text: string) => {
    if (!text) return text;
    
    try {
      // First check if the text itself is JSON
      if ((text.trim().startsWith('{') && text.trim().endsWith('}')) ||
          (text.trim().startsWith('[') && text.trim().endsWith(']'))) {
        const parsedJSON = JSON.parse(text);
        return JSON.stringify(parsedJSON, null, 2);
      }
      
      // If not direct JSON, try to find JSON content within the text
      // Common pattern from AI responses: look for JSON blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) ||
                        text.match(/({[\s\S]*})/);
                        
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsedJSON = JSON.parse(jsonMatch[1]);
          return JSON.stringify(parsedJSON, null, 2);
        } catch (e) {
          // If parsing the potential JSON block fails, return original
          return text;
        }
      }
      
      // Return original if no JSON patterns found
      return text;
    } catch (e) {
      // If parsing fails, return the original text
      return text;
    }
  };
  
  // Determine if the output appears to be JSON
  const isJsonOutput = output && (
    (output.trim().startsWith('{') && output.trim().endsWith('}')) ||
    (output.trim().startsWith('[') && output.trim().endsWith(']'))
  );

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-2">LLM Output</h3>
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">LLM Output</h3>
      <ScrollArea className="flex-grow bg-gray-50 p-3 rounded border max-h-[550px]">
        {output ? (
          <div className={`whitespace-pre-wrap ${isJsonOutput ? 'font-mono text-sm' : 'text-sm'}`}>
            {formatOutput(output)}
          </div>
        ) : (
          <div className="text-gray-400 italic text-center mt-8">
            Generated content will appear here
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LlmOutput;
