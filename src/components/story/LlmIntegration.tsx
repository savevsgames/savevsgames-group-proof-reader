
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
  preparePromptData,
  generateContent
} from "@/lib/llmUtils";

interface LlmIntegrationProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onStoryUpdate: (updatedStory: CustomStory) => void;
  currentPage: number;
  llmContext?: string;
  setLlmContext?: (context: string) => void;
  onAddToLlmContext?: (text: string) => void;
}

const LlmIntegration: React.FC<LlmIntegrationProps> = ({
  storyId,
  storyData,
  currentNode,
  onStoryUpdate,
  currentPage,
  llmContext = "",
  setLlmContext,
  onAddToLlmContext,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [llmOutput, setLlmOutput] = useState<string>("");
  const [llmType, setLlmType] = useState<"node" | "choices">("node");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const initializeData = async () => {
      const loadedSystemPrompt = await loadSystemPrompt(storyId);
      setSystemPrompt(loadedSystemPrompt);
      
      const loadedComments = await loadComments(storyId, currentPage);
      setComments(loadedComments);
      
      if (!prompt || prompt === "") {
        setPrompt(
          `Integrate all reader comments with the current page context to offer suggestions that can be integrated into the JSON file. Focus on improving ${
            llmType === "node" ? "the story text" : "the choices"
          } while maintaining the story's style.`
        );
      }
    };
    
    initializeData();
  }, [storyId, currentNode, currentPage, llmType, prompt]);

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
      // Prepare full prompt with context
      const fullPrompt = preparePromptData(
        storyData,
        currentNode,
        currentPage,
        comments,
        prompt,
        llmType,
        llmContext
      );

      console.log("Sending prompt to OpenAI:", {
        systemPrompt,
        fullPrompt,
        llmType,
      });

      // Generate content
      const data = await generateContent(systemPrompt, fullPrompt, llmType);
      
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-4">
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
            llmContext={llmContext}
            setLlmContext={setLlmContext}
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
              onAddToLlmContext={onAddToLlmContext}
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
