
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CustomStory } from "@/lib/storyUtils";
import { useAuth } from "@/context/AuthContext";
import LlmSettings from "./llm/LlmSettings";
import LlmOutput from "./llm/LlmOutput";
import { 
  loadSystemPrompt, 
  loadComments,
  loadModelSettings,
  preparePromptData,
  generateContent,
  CommentContextItem
} from "@/lib/llm";
import { CommentType } from "@/lib/commentTypes";

interface LlmIntegrationProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onStoryUpdate: (updatedStory: CustomStory) => void;
  currentPage: number;
}

const LlmIntegration: React.FC<LlmIntegrationProps> = ({
  storyId,
  storyData,
  currentNode,
  onStoryUpdate,
  currentPage,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [llmOutput, setLlmOutput] = useState<string>("");
  const [llmType, setLlmType] = useState<"edit_json" | "story_suggestions">("edit_json");
  const [commentContext, setCommentContext] = useState<CommentContextItem[]>([]);
  const [modelSettings, setModelSettings] = useState({
    model: "gpt-4o-mini",
    temperature: 0.7
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const initializeData = async () => {
      // Load system prompt
      const loadedSystemPrompt = await loadSystemPrompt(storyId);
      setSystemPrompt(loadedSystemPrompt);
      
      // Load model settings
      const loadedModelSettings = await loadModelSettings(storyId);
      if (loadedModelSettings) {
        setModelSettings(loadedModelSettings);
      }
      
      // Load comments
      const loadedComments = await loadComments(storyId, currentPage);
      setComments(loadedComments);
      
      // Set default prompt based on LLM type
      if (!prompt || prompt === "") {
        setPrompt(
          `${
            llmType === "edit_json" 
              ? "Please analyze the current JSON structure and suggest specific edits to improve the story node. Provide the exact JSON changes needed."
              : "Based on the story context and reader comments, provide creative writing suggestions and alternative plot directions that could enhance the narrative."
          }`
        );
      }
    };
    
    initializeData();
  }, [storyId, currentNode, currentPage, llmType]);

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLlmOutput("");

    try {
      // Prepare full prompt with context including story context
      const fullPrompt = preparePromptData(
        storyData,
        currentNode,
        currentPage,
        comments,
        prompt,
        llmType,
        commentContext
      );

      console.log("Sending prompt to OpenAI:", {
        systemPrompt,
        fullPrompt,
        llmType,
        modelSettings
      });

      // Generate content with model settings
      const data = await generateContent(
        systemPrompt, 
        fullPrompt, 
        llmType, 
        modelSettings.model, 
        modelSettings.temperature
      );
      
      setLlmOutput(data.content);
      
      // In the future, we'll implement direct JSON editing based on the response
      // For now, we'll just show the suggested JSON or writing suggestions
      
      toast({
        title: `${llmType === "edit_json" ? "JSON edits" : "Story suggestions"} generated`,
        description: `The ${llmType === "edit_json" ? "JSON edits" : "story suggestions"} have been generated successfully.`,
      });
    } catch (err: any) {
      console.error("Error generating content:", err);
      toast({
        title: "Error generating content",
        description: err.message || "There was an error generating content.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToLlmContext = (commentType: CommentType, commentText: string, username: string) => {
    // Add to comment context with proper typing
    setCommentContext(prev => [
      ...prev,
      {
        type: commentType,
        text: commentText,
        username: username
      }
    ]);
    
    toast({
      title: "Added to LLM context",
      description: `${commentType} comment has been added to your LLM context.`,
    });
  };

  const clearCommentContext = () => {
    setCommentContext([]);
    toast({
      title: "Context cleared",
      description: "Comment context has been cleared.",
    });
  };

  // Prepare the story context from current node and page
  const storyContext = {
    currentNodeName: currentNode,
    currentPageNumber: currentPage,
    nodeText: storyData[currentNode]?.text || "No text available for this node."
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <LlmSettings
            storyId={storyId}
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            llmType={llmType}
            setLlmType={setLlmType}
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerateContent={handleGenerateContent}
            isLoading={isLoading}
            commentContext={commentContext}
            onClearCommentContext={clearCommentContext}
            storyContext={storyContext}
            modelSettings={modelSettings}
            setModelSettings={setModelSettings}
          />
        </Card>
        
        <Card className="p-4 h-full">
          <LlmOutput output={llmOutput} />
        </Card>
      </div>
      
      <div className="text-sm text-gray-500 border-t pt-3">
        <p>Current Node: <span className="font-mono">{currentNode}</span></p>
        <p>Page: <span className="font-mono">{currentPage}</span></p>
        <p>To add comments to LLM context, use the "Comments" tab and click the send icon on any comment.</p>
      </div>
    </div>
  );
};

export default LlmIntegration;
