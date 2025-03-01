
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CustomStory } from "@/lib/storyUtils";
import { useAuth } from "@/context/AuthContext";
import CommentsView from "./CommentsView";
import LlmSettings from "./llm/LlmSettings";
import LlmOutput from "./llm/LlmOutput";
import { 
  loadSystemPrompt, 
  loadComments,
  loadModelSettings,
  preparePromptData,
  generateContent
} from "@/lib/llmUtils";

interface LlmIntegrationProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onStoryUpdate: (updatedStory: CustomStory) => void;
  currentPage: number;
}

interface CommentContextItem {
  type: string;
  text: string;
  username: string;
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
  const [llmType, setLlmType] = useState<"node" | "choices">("node");
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
          `Integrate all reader comments with the current page context to offer suggestions that can be integrated into the JSON file. Focus on improving ${
            llmType === "node" ? "the story text" : "the choices"
          } while maintaining the story's style.`
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
      
      if (data.content && data.contentType === "node") {
        const updatedStory = { ...storyData };
        updatedStory[currentNode] = {
          ...updatedStory[currentNode],
          text: data.content,
        };
        onStoryUpdate(updatedStory);
        
        toast({
          title: "Content generated",
          description: "The node text has been updated with the generated content.",
        });
      } else if (data.content && data.contentType === "choices") {
        try {
          const parsedChoices = JSON.parse(data.content);
          const updatedStory = { ...storyData };
          updatedStory[currentNode] = {
            ...updatedStory[currentNode],
            choices: parsedChoices,
          };
          onStoryUpdate(updatedStory);
          
          toast({
            title: "Choices generated",
            description: "The node choices have been updated with the generated content.",
          });
        } catch (parseError) {
          console.error("Error parsing choices:", parseError);
          toast({
            title: "Error parsing choices",
            description: "The generated choices couldn't be parsed as valid JSON.",
            variant: "destructive",
          });
        }
      }
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

  const handleAddToLlmContext = (commentType: string, commentText: string, username: string) => {
    // Add to comment context in the format "comment_type": "comment_text"
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
        
        <div className="space-y-4">
          <Card className="p-4 h-full flex flex-col">
            <LlmOutput output={llmOutput} />
          </Card>
          
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Reader Comments</h3>
            </div>
            
            <CommentsView 
              storyId={storyId}
              currentNode={currentNode}
              currentPage={currentPage}
              onCommentsUpdate={(count) => {
                // This function can stay the same
              }}
              onAddToLlmContext={handleAddToLlmContext}
            />
          </Card>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 border-t pt-3">
        <p>Current Node: <span className="font-mono">{currentNode}</span></p>
        <p>Page: <span className="font-mono">{currentPage}</span></p>
      </div>
    </div>
  );
};

export default LlmIntegration;
