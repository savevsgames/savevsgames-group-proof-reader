
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Wand2,
  Send,
  Save,
  FileText,
  MessageSquare,
  Settings,
  AlertCircle
} from "lucide-react";
import { CustomStory } from "@/lib/storyUtils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { fetchComments } from "@/lib/storyUtils";

interface LlmIntegrationProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  onStoryUpdate: (updatedStory: CustomStory) => void;
  currentPage: number;
}

interface LlmSettings {
  id?: string;
  bookId?: string;
  modelVersion: string;
  temperature: number;
  permanentContext: string;
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  profile: {
    username: string;
  };
}

const LlmIntegration: React.FC<LlmIntegrationProps> = ({
  storyId,
  storyData,
  currentNode,
  onStoryUpdate,
  currentPage
}) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [settings, setSettings] = useState<LlmSettings>({
    modelVersion: "gpt-4o",
    temperature: 0.7,
    permanentContext: ""
  });
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [llmOutput, setLlmOutput] = useState<string>("");
  const { toast } = useToast();

  // Load LLM settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("book_llm_settings")
          .select("*")
          .eq("book_id", storyId)
          .single();

        if (error) {
          console.error("Error loading LLM settings:", error);
          return;
        }

        if (data) {
          setSettings({
            id: data.id,
            bookId: data.book_id,
            modelVersion: data.model_version || "gpt-4o",
            temperature: data.temperature || 0.7,
            permanentContext: data.permanent_context || ""
          });
        }
      } catch (error) {
        console.error("Failed to load LLM settings:", error);
      }
    };

    loadSettings();
  }, [storyId]);

  // Load comments for the current page
  useEffect(() => {
    const loadComments = async () => {
      if (!storyId || !currentPage) return;
      
      setIsLoadingComments(true);
      try {
        const commentsData = await fetchComments(storyId, currentPage);
        setComments(commentsData);
      } catch (error) {
        console.error("Error loading comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments for this page.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingComments(false);
      }
    };

    loadComments();
  }, [storyId, currentPage, toast]);

  // Save LLM settings
  const handleSaveSettings = async () => {
    try {
      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from("book_llm_settings")
          .update({
            model_version: settings.modelVersion,
            temperature: settings.temperature,
            permanent_context: settings.permanentContext,
            updated_at: new Date()
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from("book_llm_settings")
          .insert({
            book_id: storyId,
            model_version: settings.modelVersion,
            temperature: settings.temperature,
            permanent_context: settings.permanentContext
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "LLM settings saved successfully!",
        duration: 3000
      });
    } catch (error: any) {
      console.error("Error saving LLM settings:", error);
      toast({
        title: "Error",
        description: "Failed to save LLM settings: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Generate content with LLM
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setLlmOutput("");

    try {
      // Prepare the current node text and any context
      const nodeText = storyData[currentNode]?.text || "No text available for this node.";
      
      // Combine comments for context
      const commentsContext = comments.length > 0 
        ? "Reader Comments:\n" + comments.map(c => `${c.profile.username}: ${c.text}`).join("\n")
        : "No reader comments for this section.";
      
      // Construct the full prompt with context
      const fullPrompt = `
Current Node: ${currentNode} (Page ${currentPage})

Story Text:
${nodeText}

${commentsContext}

Permanent Context:
${settings.permanentContext}

Your Task:
${prompt}`;

      // Sample response for now - in a real app, this would call an API
      // This is just to simulate the LLM response
      setTimeout(() => {
        // Simulate LLM generating a response
        const sampleResponse = `Based on the current node "${currentNode}" and the reader comments, here's a suggestion for improving this section:

The vault's description could be enhanced with more sensory details to immerse readers in the atmosphere. Consider adding details about:
- The temperature (cold? unnaturally warm?)
- Any sounds (distant humming? complete silence?)
- Smells (metallic? ancient dust?)

This would help readers feel more present in the scene and build tension before the introduction of the Dark Eye entity.

I'd recommend expanding this paragraph to create a stronger sense of foreboding before revealing the central artifact.`;
        
        setLlmOutput(sampleResponse);
        setIsGenerating(false);
        
        toast({
          title: "Generation Complete",
          description: "LLM has generated content suggestions.",
          duration: 3000
        });
      }, 2000);
      
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation Failed",
        description: "An error occurred while generating content: " + error.message,
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };

  // Apply LLM changes to the story (placeholder for now)
  const handleApplyChanges = () => {
    // In a real implementation, this would parse the LLM output and
    // apply specific changes to the story data
    toast({
      title: "Action Required",
      description: "Please review the suggestions and update the story text manually.",
      duration: 5000
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="context">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card className="p-4 bg-slate-50">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-[#F97316]" />
              Current Node: {currentNode} (Page {currentPage})
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a prompt to generate content or suggestions for this story node.
            </p>
            
            <Textarea
              placeholder="Enter your prompt... (e.g., 'Suggest improvements for this scene', 'Make this description more vivid', 'Add more conflict to this dialogue')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] mb-4"
            />
            
            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`${isGenerating ? 'bg-gray-400' : 'bg-[#F97316] hover:bg-[#E86305]'} text-white`}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </Card>
          
          {/* LLM Output Section */}
          <Card className="p-4 bg-white border-t-4 border-[#F97316]">
            <h3 className="text-lg font-semibold mb-2">LLM Output</h3>
            
            {llmOutput ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap min-h-[200px]">
                  {llmOutput}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLlmOutput("")}
                  >
                    Clear
                  </Button>
                  <Button 
                    onClick={handleApplyChanges}
                    className="bg-[#F97316] hover:bg-[#E86305] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Apply Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-md flex flex-col items-center justify-center min-h-[200px] text-gray-500">
                <AlertCircle className="h-12 w-12 mb-4 text-gray-400" />
                <p>Generate content to see LLM output here.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Comments Context Tab */}
        <TabsContent value="context" className="space-y-4">
          <Card className="p-4 bg-slate-50">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-[#F97316]" />
              Reader Comments for Page {currentPage}
            </h3>
            
            {isLoadingComments ? (
              <div className="flex justify-center items-center p-8">
                <span className="animate-spin mr-2">⟳</span>
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-[#F97316]">{comment.profile.username}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No comments have been added for this page yet.</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab("generate");
                  const commentSummary = comments.length > 0 
                    ? `Based on reader comments for page ${currentPage}, suggest improvements to this node.` 
                    : `Generate improvement suggestions for this node.`;
                  setPrompt(commentSummary);
                }}
                className="text-[#F97316]"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Use Comments in Prompt
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-4 bg-slate-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-[#F97316]" />
              LLM Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model Version
                </label>
                <select
                  value={settings.modelVersion}
                  onChange={(e) => setSettings({ ...settings, modelVersion: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  <option value="gpt-4o">GPT-4o (Recommended)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperature: {settings.temperature.toFixed(1)}
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">0.0</span>
                  <Slider
                    value={[settings.temperature]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => setSettings({ ...settings, temperature: value[0] })}
                    className="flex-1"
                  />
                  <span className="text-xs">1.0</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lower values create more focused, deterministic outputs. Higher values create more creative, varied outputs.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Permanent Context
                </label>
                <Textarea
                  placeholder="Enter permanent context to guide the LLM (e.g., 'Maintain a dark fantasy tone', 'Keep characters consistent', 'Follow the hero's journey structure')"
                  value={settings.permanentContext}
                  onChange={(e) => setSettings({ ...settings, permanentContext: e.target.value })}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This context will be included with every generation request to guide the LLM's responses.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#F97316] hover:bg-[#E86305] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LlmIntegration;
