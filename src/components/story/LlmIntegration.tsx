
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
import { Loader2, Upload, FileText, AlertCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LlmIntegrationProps {
  storyId: string;
  storyData: CustomStory;
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

const DEFAULT_SETTINGS: LlmSettings = {
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

const LlmIntegration: React.FC<LlmIntegrationProps> = ({ storyId, storyData, onStoryUpdate }) => {
  const [settings, setSettings] = useState<LlmSettings>({ ...DEFAULT_SETTINGS, book_id: storyId });
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Fetch existing settings and files
  useEffect(() => {
    const fetchSettingsAndFiles = async () => {
      setLoading(true);
      try {
        // Fetch LLM settings
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
          // Create default settings if none exist
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

        // Fetch context files
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

  // Save settings
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

  // Handle file upload
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
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", storyId);

      // Call the edge function
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

      // Refresh the file list
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
      // Reset file input
      e.target.value = "";
    }
  };

  // Delete context file
  const deleteContextFile = async (fileId: string) => {
    try {
      // Find the file to get its path
      const fileToDelete = contextFiles.find(f => f.id === fileId);
      if (!fileToDelete) throw new Error("File not found");

      // Delete from storage first
      const { error: storageError } = await supabase
        .storage
        .from("rag_context_files")
        .remove([fileToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete the database record
      const { error: dbError } = await supabase
        .from("book_context_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      // Update state
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

  // Generate content with LLM
  const generateContent = async () => {
    if (!selectedNode || !generationPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a node and provide a prompt.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      
      // Call the edge function
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
            nodeId: selectedNode
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result = await response.json();
      
      if (result.success && result.data.content) {
        // Update the story data
        const updatedStory = { ...storyData };
        if (updatedStory[selectedNode]) {
          updatedStory[selectedNode].text = result.data.content;
          onStoryUpdate(updatedStory);
          
          toast({
            title: "Content generated",
            description: `Content for node "${selectedNode}" has been updated.`
          });
        }
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

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="settings">Model Settings</TabsTrigger>
        <TabsTrigger value="context">Context Files</TabsTrigger>
        <TabsTrigger value="generate">Generate Content</TabsTrigger>
      </TabsList>

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

      <TabsContent value="generate" className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Generate Content</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="node-select">Select Story Node</Label>
              <Select
                value={selectedNode || ""}
                onValueChange={setSelectedNode}
              >
                <SelectTrigger id="node-select">
                  <SelectValue placeholder="Select a node to update" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(storyData).map((nodeId) => (
                    <SelectItem key={nodeId} value={nodeId}>
                      {nodeId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Provide specific instructions about the content you want to generate.
              </p>
            </div>

            {!selectedNode && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  Select a story node before generating content.
                </p>
              </div>
            )}

            <Button 
              onClick={generateContent} 
              disabled={generating || !selectedNode || !generationPrompt.trim()}
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
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default LlmIntegration;
