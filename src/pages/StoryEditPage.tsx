
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertJSONToInk } from "@/lib/storyUtils";

interface StoryEditPageProps {}

const StoryEditPage: React.FC<StoryEditPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [storyContent, setStoryContent] = useState("");
  const [inkContent, setInkContent] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [activeTab, setActiveTab] = useState("json");
  
  // LLM settings
  const [modelVersion, setModelVersion] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [permanentContext, setPermanentContext] = useState("");
  const [contextFiles, setContextFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError("Story not found");
          return;
        }

        // Check if user is the creator of the book
        if (data.creator_id && data.creator_id !== user.id) {
          setError("You do not have permission to edit this story");
          return;
        }

        setBook(data);
        setBookTitle(data.title);

        // Fetch the story content if it exists
        if (data.story_url) {
          try {
            const response = await fetch(data.story_url);
            if (response.ok) {
              const storyData = await response.json();
              // For simple editing, we'll just use a plain text representation
              // In a more advanced implementation, you would parse the story structure
              const jsonContent = JSON.stringify(storyData, null, 2);
              setStoryContent(jsonContent);
              
              // Convert JSON to Ink format
              const inkFormatted = convertJSONToInk(storyData);
              setInkContent(inkFormatted);
            }
          } catch (contentError) {
            console.error("Error fetching story content:", contentError);
            setStoryContent("// Add your story content here");
            setInkContent("// Add your story content here");
          }
        } else {
          setStoryContent("// Add your story content here");
          setInkContent("// Add your story content here");
        }

        // Fetch LLM settings for this book
        fetchLLMSettings();
        // Fetch context files for this book
        fetchContextFiles();
      } catch (error: any) {
        console.error("Error fetching book:", error);
        setError(error.message || "Failed to fetch book details");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user, navigate]);

  const fetchLLMSettings = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("book_llm_settings")
        .select("*")
        .eq("book_id", id)
        .single();
        
      if (error && error.code !== "PGRST116") { // No rows returned is fine
        console.error("Error fetching LLM settings:", error);
        return;
      }
      
      if (data) {
        setModelVersion(data.model_version || "gpt-4o");
        setTemperature(data.temperature || 0.7);
        setPermanentContext(data.permanent_context || "");
      }
    } catch (error) {
      console.error("Error in fetchLLMSettings:", error);
    }
  };
  
  const fetchContextFiles = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("book_context_files")
        .select("*")
        .eq("book_id", id)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching context files:", error);
        return;
      }
      
      setContextFiles(data || []);
    } catch (error) {
      console.error("Error in fetchContextFiles:", error);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !book) return;

    try {
      setSaving(true);

      // Save the updated title
      const { error: titleError } = await supabase
        .from("books")
        .update({ title: bookTitle })
        .eq("id", id);

      if (titleError) {
        throw titleError;
      }

      // Save/update LLM settings
      const { error: llmSettingsError } = await supabase
        .from("book_llm_settings")
        .upsert({
          book_id: id,
          model_version: modelVersion,
          temperature: temperature,
          permanent_context: permanentContext,
          updated_at: new Date().toISOString()
        });
        
      if (llmSettingsError) {
        console.error("Error saving LLM settings:", llmSettingsError);
      }

      // For this demo, we'll just record the edit in the story_edits table
      const { error: editError } = await supabase
        .from("story_edits")
        .insert({
          book_id: id,
          editor_id: user.id,
          content: activeTab === "json" ? storyContent : inkContent,
          edit_type: "manual",
        });

      if (editError) {
        throw editError;
      }

      toast({
        title: "Changes saved",
        description: "Your story has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!promptInput.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate content",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(true);

    try {
      const response = await fetch(`${window.location.origin}/api/functions/v1/generate-story-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: promptInput,
          currentContent: storyContent,
          modelVersion: modelVersion,
          temperature: temperature,
          context: permanentContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();
      
      if (data.generatedContent) {
        setStoryContent(data.generatedContent);
        
        // Update Ink content based on new JSON
        try {
          const parsedJson = JSON.parse(data.generatedContent);
          const newInkContent = convertJSONToInk(parsedJson);
          setInkContent(newInkContent);
        } catch (e) {
          console.error("Error parsing generated content:", e);
        }
        
        toast({
          title: "Content generated",
          description: "AI-generated content has been added to your story.",
        });
      }
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id || !user) return;
    
    const file = files[0];
    setUploadingFile(true);
    
    try {
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bookId', id);
      
      // Upload to the Edge Function
      const response = await fetch(`${window.location.origin}/api/functions/v1/upload-context-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      
      // Refresh the file list
      fetchContextFiles();
      
      toast({
        title: "File uploaded",
        description: "Your context file has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      // Reset the file input
      e.target.value = '';
    }
  };
  
  const handleDeleteFile = async (fileId: string) => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from("book_context_files")
        .delete()
        .eq("id", fileId);
        
      if (error) {
        throw error;
      }
      
      // Refresh the file list
      fetchContextFiles();
      
      toast({
        title: "File deleted",
        description: "Your context file has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  // Handle tab changes and sync content if needed
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "ink" && storyContent) {
      try {
        // Update Ink content if JSON is valid
        const parsedJson = JSON.parse(storyContent);
        const newInkContent = convertJSONToInk(parsedJson);
        setInkContent(newInkContent);
      } catch (e) {
        console.error("Error parsing JSON for Ink conversion:", e);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F97316] border-r-transparent"></div>
            <p className="mt-2 text-[#3A2618]">Loading story editor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-serif font-bold text-[#3A2618] mb-4">
              Error
            </h2>
            <p className="text-[#3A2618]">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 bg-[#F97316] text-white px-4 py-2 rounded hover:bg-[#E86305] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-[#3A2618] mb-1">
              Story Title
            </label>
            <Input
              id="title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full border-gray-300"
            />
          </div>
          
          <h2 className="text-2xl font-serif font-bold text-[#3A2618] mb-4">
            Edit Story Content
          </h2>
          
          <Tabs defaultValue="json" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="json">JSON View</TabsTrigger>
              <TabsTrigger value="ink">Ink View</TabsTrigger>
              <TabsTrigger value="llm">LLM Integration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="json" className="mt-0">
              <div className="mb-6">
                <div className="border rounded-md mb-4">
                  <div className="bg-gray-100 p-3 border-b">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-[#3A2618]">Story Editor</span>
                      <div className="text-xs text-gray-500">
                        JSON format
                      </div>
                    </div>
                  </div>
                  <Textarea
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                    className="font-mono text-sm p-4 min-h-[400px] w-full border-0 focus-visible:ring-0"
                    placeholder="Your story content in JSON format"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ink" className="mt-0">
              <div className="mb-6">
                <div className="border rounded-md mb-4">
                  <div className="bg-gray-100 p-3 border-b">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-[#3A2618]">Story Editor</span>
                      <div className="text-xs text-gray-500">
                        Ink format
                      </div>
                    </div>
                  </div>
                  <Textarea
                    value={inkContent}
                    onChange={(e) => setInkContent(e.target.value)}
                    className="font-mono text-sm p-4 min-h-[400px] w-full border-0 focus-visible:ring-0"
                    placeholder="Your story content in Ink format"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="llm" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-[#3A2618] mb-3">Model Settings</h3>
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="model-select">Model Version</Label>
                        <Select 
                          value={modelVersion} 
                          onValueChange={setModelVersion}
                        >
                          <SelectTrigger id="model-select">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="temperature-slider">Temperature: {temperature.toFixed(1)}</Label>
                        </div>
                        <Slider
                          id="temperature-slider"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[temperature]}
                          onValueChange={(values) => setTemperature(values[0])}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Lower values produce more focused, deterministic outputs while higher values increase creativity and randomness.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-[#3A2618] mb-3">Context Management</h3>
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="permanent-context">Permanent Context</Label>
                        <Textarea
                          id="permanent-context"
                          value={permanentContext}
                          onChange={(e) => setPermanentContext(e.target.value)}
                          placeholder="Enter any permanent context or instructions for the LLM..."
                          className="min-h-[200px]"
                        />
                        <p className="text-xs text-gray-500">
                          This context will be included with every generation request to the LLM.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-[#3A2618] mb-3">RAG Files Management</h3>
                  <div className="space-y-4 p-4 border rounded-md min-h-[400px]">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="file-upload">Upload RAG Context Files</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".txt,.pdf,.md,.doc,.docx"
                      />
                      <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        variant="outline"
                        size="sm"
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload File
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">
                      Supported file types: TXT, PDF, MD, DOC, DOCX
                    </div>
                    
                    {contextFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No context files uploaded yet
                      </div>
                    ) : (
                      <div className="space-y-2 mt-4">
                        <h4 className="font-medium">Uploaded Files:</h4>
                        <ul className="space-y-2">
                          {contextFiles.map((file) => (
                            <li key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="truncate max-w-[70%]">{file.file_name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                Delete
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-md border">
            <h3 className="text-lg font-medium text-[#3A2618] mb-2">
              AI Story Assistant
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe what you want to add or modify in the story, and our AI will help generate content.
            </p>
            <div className="space-y-4">
              <Textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full min-h-[100px]"
                placeholder="E.g., 'Add a scene where the protagonist discovers a hidden cave' or 'Make the villain's dialogue more menacing'"
              />
              <Button 
                onClick={handleGenerateContent}
                className="bg-[#3A2618] hover:bg-[#2A1608] text-white"
                disabled={generatingContent}
              >
                {generatingContent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Content"
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              onClick={() => navigate(`/story/${id}`)}
              variant="outline"
              className="text-[#3A2618]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="bg-[#F97316] hover:bg-[#E86305] text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEditPage;
