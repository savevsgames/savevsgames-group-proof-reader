
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { saveSystemPrompt } from "@/lib/llmUtils";

interface LlmSettingsProps {
  storyId: string;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  llmType: "node" | "choices";
  setLlmType: (type: "node" | "choices") => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerateContent: () => void;
  isLoading: boolean;
  llmContext?: string;
  setLlmContext?: (context: string) => void;
}

const LlmSettings: React.FC<LlmSettingsProps> = ({
  storyId,
  systemPrompt,
  setSystemPrompt,
  llmType,
  setLlmType,
  prompt,
  setPrompt,
  onGenerateContent,
  isLoading,
  llmContext,
  setLlmContext,
}) => {
  const { toast } = useToast();

  const handleSystemPromptSave = async () => {
    try {
      const success = await saveSystemPrompt(storyId, systemPrompt);
      
      if (success) {
        toast({
          title: "System prompt saved",
          description: "Your system prompt has been saved successfully.",
        });
      } else {
        throw new Error("Failed to save system prompt");
      }
    } catch (err) {
      console.error("Error saving system prompt:", err);
      toast({
        title: "Error saving system prompt",
        description: "There was an error saving your system prompt.",
        variant: "destructive",
      });
    }
  };

  const handleClearContext = () => {
    if (setLlmContext) {
      setLlmContext("");
      toast({
        title: "Context cleared",
        description: "LLM context has been cleared",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">LLM Settings</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">System Prompt</label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Enter system instructions for the AI..."
          className="min-h-[120px]"
        />
        <Button
          onClick={handleSystemPromptSave}
          size="sm"
          variant="outline"
          className="mt-2"
        >
          Save System Prompt
        </Button>
      </div>
      
      {llmContext !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Context (from comments)</label>
            {llmContext && setLlmContext && (
              <Button
                onClick={handleClearContext}
                size="sm"
                variant="outline"
                className="text-red-500"
              >
                Clear Context
              </Button>
            )}
          </div>
          <Textarea
            value={llmContext || ""}
            onChange={(e) => setLlmContext && setLlmContext(e.target.value)}
            placeholder="Context from comments will appear here..."
            className="min-h-[100px]"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Generation Type</label>
        <Tabs
          defaultValue="node"
          value={llmType}
          onValueChange={(value) => setLlmType(value as "node" | "choices")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="node">Node Text</TabsTrigger>
            <TabsTrigger value="choices">Choices</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">User Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            llmType === "node"
              ? "e.g., Generate a paragraph describing the dark forest..."
              : "e.g., Create 3 choices for the character to proceed..."
          }
          className="min-h-[100px]"
        />
      </div>
      
      <Button
        onClick={onGenerateContent}
        disabled={isLoading || !prompt.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-solid border-current border-r-transparent rounded-full"></span>
            Generating...
          </>
        ) : (
          <>
            <span className="mr-2 h-4 w-4">📤</span>
            Generate {llmType === "node" ? "Text" : "Choices"}
          </>
        )}
      </Button>
    </div>
  );
};

export default LlmSettings;
