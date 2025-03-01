
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, RefreshCw, MessageSquare } from "lucide-react";
import { CustomStory } from "@/lib/storyUtils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { fetchComments } from "@/lib/storyUtils";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [llmType, setLlmType] = useState<"node" | "choices">("node");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSystemPrompt();
    loadComments();
  }, [storyId, currentNode, currentPage]);

  const loadSystemPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from("book_llm_settings")
        .select("system_prompt")
        .eq("book_id", storyId)
        .single();

      if (error) {
        console.error("Error loading system prompt:", error);
        return;
      }

      if (data && data.system_prompt) {
        setSystemPrompt(data.system_prompt);
      } else {
        setSystemPrompt(
          "You are a creative writing assistant helping the author craft an interactive story. Please follow the author's instructions carefully."
        );
      }
    } catch (err) {
      console.error("Error in loadSystemPrompt:", err);
    }
  };

  const loadComments = async () => {
    try {
      if (!storyId || !currentPage) return;
      
      const commentsData = await fetchComments(storyId, currentPage);
      setComments(commentsData);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const handleSystemPromptSave = async () => {
    try {
      const { error } = await supabase
        .from("book_llm_settings")
        .upsert({
          book_id: storyId,
          system_prompt: systemPrompt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "System prompt saved",
        description: "Your system prompt has been saved successfully.",
      });
    } catch (err) {
      console.error("Error saving system prompt:", err);
      toast({
        title: "Error saving system prompt",
        description: "There was an error saving your system prompt.",
        variant: "destructive",
      });
    }
  };

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
      // Prepare the current node data to send to the API
      const nodeData = storyData[currentNode] || {
        text: "",
        choices: [],
      };

      // Format comments as a string for context
      const commentsText = comments.length > 0
        ? "\nReader comments for this page:\n" + comments.map(c => 
            `- ${c.profile?.username || 'Anonymous'}: "${c.content}"`
          ).join("\n")
        : "\nNo reader comments for this page.";

      // Create the full prompt with context
      const fullPrompt = `
Current story node: "${currentNode}"
Current text: "${nodeData.text}"
Current choices: ${JSON.stringify(nodeData.choices, null, 2)}
Page number: ${currentPage}
${commentsText}

User instruction: ${prompt}
`;

      console.log("Sending prompt to OpenAI:", {
        systemPrompt,
        fullPrompt,
        llmType,
      });

      // Make the API call to your backend
      const response = await fetch("/api/generate-story-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          prompt: fullPrompt,
          contentType: llmType, // 'node' or 'choices'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate content"
        );
      }

      const data = await response.json();
      
      // Set the LLM output for display
      setLlmOutput(data.content);
      
      // Update storyData with the new content if appropriate
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
            onClick={handleGenerateContent}
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Generate {llmType === "node" ? "Text" : "Choices"}
              </>
            )}
          </Button>
        </Card>
        
        <div className="space-y-4">
          <Card className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2">LLM Output</h3>
            <ScrollArea className="flex-grow bg-gray-50 p-3 rounded border max-h-[350px]">
              {llmOutput ? (
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {llmOutput}
                </div>
              ) : (
                <div className="text-gray-400 italic text-center mt-8">
                  Generated content will appear here
                </div>
              )}
            </ScrollArea>
          </Card>
          
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Reader Comments</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={loadComments}
                title="Refresh comments"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[160px]">
              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment, index) => (
                    <div key={index} className="p-2 border rounded">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span className="font-medium">
                          {comment.profile?.username || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 italic text-center mt-8">
                  No comments for this page
                </div>
              )}
            </ScrollArea>
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
