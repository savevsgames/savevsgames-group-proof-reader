
import React, { useState, useEffect } from "react";
import { CustomStory } from "@/lib/storyUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonEditorProps {
  storyData: CustomStory;
  onChange: (data: CustomStory) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ storyData, onChange }) => {
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setError(null);
      onChange(parsed);
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

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">JSON Editor</h3>
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
