
import React, { useState, useEffect } from "react";
import { CustomStory } from "@/lib/storyUtils";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { fetchComments } from "@/lib/storyUtils";
import { Loader2, Upload, FileText, AlertCircle, Trash2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LlmIntegrationProps {
  storyId: string;
  storyData: CustomStory;
  currentNode?: string;
  currentPage?: number;
  onStoryUpdate: (updatedStory: CustomStory) => void;
}

interface LlmSettings {
  id?: string;
  book_id: string;
  model_version: string;
  temperature: number;
  permanent_context: string;
}

interface ContextFile {
  id: string;
  book_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profile: {
    username: string;
  };
}

const DEFAULT_SETTINGS = {
  book_id: "",
  model_version: "gpt-4o",
  temperature: 0.7,
  permanent_context: ""
};

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" }
];

const LlmIntegration: React.FC<LlmIntegrationProps> = ({ 
  storyId, 
  storyData, 
  currentNode = "root",
  currentPage = 1,
  onStoryUpdate 
}) => {
  const [settings, setSettings] = useState<any>({ ...DEFAULT_SETTINGS, book_id: storyId });
  const [contextFiles, setContextFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettingsAndFiles = async () => {
      setLoading(true);
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("book_llm_settings")
          .select("*")
          .eq("book_id", storyId)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("Error fetching settings:", settingsError);
          throw settingsError;
        }

        if (settingsData) {
          setSettings(settingsData);
        } else {
          const { data: newSettings, error: createError } = await supabase
            .from("book_llm_settings")
            .insert({ ...DEFAULT_SETTINGS, book_id: storyId })
            .select()
            .single();

          if (createError) {
            console.error("Error creating settings:", createError);
            throw createError;
          }

          if (newSettings) {
            setSettings(newSettings);
          }
        }

        const { data: filesData, error: filesError } = await supabase
          .from("book_context_files")
          .select("*")
          .eq("book_id", storyId);

        if (filesError) {
          console.error("Error fetching context files:", filesError);
          throw filesError;
        }

        if (filesData) {
          setContextFiles(filesData);
        }
      } catch (error) {
        toast({
          title: "Error loading LLM settings",
          description: "Failed to load settings: " + (error as Error).message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchSettingsAndFiles();
    }
  }, [storyId, toast]);

  // Fetch comments for the current page
  useEffect(() => {
    const loadComments = async () => {
      if (!storyId || !currentPage) return;
      
      setLoadingComments(true);
      try {
        const commentsData = await fetchComments(storyId, currentPage);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error loading comments",
          description: "Failed to load comments for this page",
          variant: "destructive"
        });
      } finally {
        setLoadingComments(false);
      }
    };
    
    loadComments();
  }, [storyId, currentPage, toast]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("book_llm_settings")
        .upsert(settings)
        .eq("book_id", storyId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your LLM settings have been updated."
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save settings: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", storyId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-context-file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      const { data, error } = await supabase
        .from("book_context_files")
        .select("*")
        .eq("book_id", storyId);

      if (error) throw error;
      setContextFiles(data || []);

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteContextFile = async (fileId: string) => {
    try {
      const fileToDelete = contextFiles.find(f => f.id === fileId);
      if (!fileToDelete) throw new Error("File not found");

      const { error: storageError } = await supabase
        .storage
        .from("rag_context_files")
        .remove([fileToDelete.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("book_context_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      setContextFiles(contextFiles.filter(f => f.id !== fileId));

      toast({
        title: "File deleted",
        description: `${fileToDelete.file_name} has been deleted.`
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const generateContent = async () => {
    if (!currentNode || !generationPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a prompt for generating content.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    setGeneratedContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-story-content`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            bookId: storyId,
            prompt: generationPrompt,
            nodeId: currentNode
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result = await response.json();
      
      if (result.success && result.data.content) {
        // Store the generated content in the state first
        setGeneratedContent(result.data.content);
        
        toast({
          title: "Content generated",
          description: "Generated content is available in the output area below."
        });
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const applyGeneratedContent = () => {
    if (!generatedContent || !currentNode) {
      toast({
        title: "No content to apply",
        description: "Please generate content first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedStory = { ...storyData };
      if (updatedStory[currentNode]) {
        updatedStory[currentNode].text = generatedContent;
        onStoryUpdate(updatedStory);
        
        toast({
          title: "Content applied",
          description: `Content for node "${currentNode}" has been updated.`
        });
      }
    } catch (error) {
      toast({
        title: "Error applying content",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  return (
    <Tabs defaultValue="generate" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="generate">Generate Content</TabsTrigger>
        <TabsTrigger value="settings">Model Settings</TabsTrigger>
        <TabsTrigger value="context">Context Files</TabsTrigger>
        <TabsTrigger value="comments">Reader Comments</TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Generate Content for Node: {currentNode}</h3>
          
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
              <p className="text-sm text-blue-800">
                You are generating content for the story node: <strong>{currentNode}</strong> (Page {currentPage})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generation-prompt">Prompt</Label>
              <Textarea
                id="generation-prompt"
                placeholder="Describe what content you want to generate..."
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-gray-500">
                Provide specific instructions about the content you want to generate for this node.
              </p>
            </div>

            <Button 
              onClick={generateContent} 
              disabled={generating || !generationPrompt.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Content"
              )}
            </Button>

            {/* Generated Content Output Area */}
            {(generatedContent || generating) && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Generated Output</h4>
                  {generatedContent && (
                    <Button 
                      variant="outline" 
                      onClick={applyGeneratedContent}
                      className="text-sm"
                    >
                      Apply to Story
                    </Button>
                  )}
                </div>
                <div className="border rounded-md bg-gray-50 p-4 min-h-[200px]">
                  {generating ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : generatedContent ? (
                    <div className="prose prose-sm max-w-none">
                      {generatedContent.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-center">Output will appear here after generation</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">LLM Settings</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model Version</Label>
              <Select
                value={settings.model_version}
                onValueChange={(value) => setSettings({...settings, model_version: value})}
                disabled={loading}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="temperature">Temperature: {settings.temperature.toFixed(1)}</Label>
              </div>
              <Slider
                id="temperature"
                value={[settings.temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value) => setSettings({...settings, temperature: value[0]})}
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>More precise (0.0)</span>
                <span>More creative (1.0)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permanent-context">Permanent Context</Label>
              <Textarea
                id="permanent-context"
                placeholder="Enter permanent context for your LLM requests..."
                value={settings.permanent_context}
                onChange={(e) => setSettings({...settings, permanent_context: e.target.value})}
                className="min-h-[150px]"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                This context will be included in every LLM request for this story.
              </p>
            </div>

            <Button 
              onClick={saveSettings} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="context" className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Context Files</h3>
          
          <div className="space-y-4">
            <div className="border border-dashed rounded-md p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="mb-2 text-sm">Upload documentation or reference files for your story</p>
              <p className="text-xs text-gray-500 mb-4">Max file size: 10MB</p>
              <div className="relative">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".txt,.pdf,.doc,.docx,.md"
                />
                <Button variant="outline" disabled={uploading} className="w-full">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Select File"
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Uploaded Files</h4>
              
              {contextFiles.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No files uploaded yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-4 space-y-2">
                    {contextFiles.map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-md border bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{file.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteContextFile(file.id)}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="comments" className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">
            Reader Comments for Page {currentPage}
          </h3>
          
          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 border border-amber-100 p-3">
              <p className="text-sm text-amber-800 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments from readers can provide useful feedback for your story generation
              </p>
            </div>

            {loadingComments ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : comments.length > 0 ? (
              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-4">
                  {comments.map((comment) => (
                    <div 
                      key={comment.id}
                      className="p-3 rounded-md border bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">{comment.profile.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 border rounded-md bg-gray-50">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No comments available for this page</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs text-gray-500">
                You can suggest readers to add comments on this page for better feedback.
              </p>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default LlmIntegration;
