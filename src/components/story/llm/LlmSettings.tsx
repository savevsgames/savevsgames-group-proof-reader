
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Upload, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveSystemPrompt, saveModelSettings } from "@/lib/llmUtils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase";

interface CommentContextItem {
  type: string;
  text: string;
  username: string;
}

interface DocumentItem {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  error?: string;
}

interface StoryContextProps {
  currentNodeName: string;
  currentPageNumber: number;
  nodeText: string;
}

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
  commentContext: CommentContextItem[];
  onClearCommentContext: () => void;
  storyContext: StoryContextProps;
  modelSettings: {
    model: string;
    temperature: number;
  };
  setModelSettings: (settings: {model: string; temperature: number}) => void;
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
  commentContext,
  onClearCommentContext,
  storyContext,
  modelSettings,
  setModelSettings
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const handleModelSettingsSave = async () => {
    try {
      const success = await saveModelSettings(storyId, modelSettings);
      
      if (success) {
        toast({
          title: "Model settings saved",
          description: "Your model settings have been saved successfully.",
        });
      } else {
        throw new Error("Failed to save model settings");
      }
    } catch (err) {
      console.error("Error saving model settings:", err);
      toast({
        title: "Error saving model settings",
        description: "There was an error saving your model settings.",
        variant: "destructive",
      });
    }
  };

  // Format comment context for display
  const formattedCommentContext = commentContext.map((item, index) => 
    `[${index + 1}] "${item.type}": "${item.text}" (by ${item.username})`
  ).join('\n');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Add file to documents list with uploading status
    const docId = crypto.randomUUID();
    const newDoc: DocumentItem = {
      id: docId,
      name: file.name,
      size: file.size,
      status: "uploading"
    };
    
    setDocuments(prev => [...prev, newDoc]);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storyId', storyId);
      
      // Upload file endpoint would be implemented separately
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      const result = await response.json();
      
      // Update document status to processing
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: "processing" } : doc
      ));
      
      // In real implementation, you would poll for processing status
      // For demo, we'll simulate processing completion
      setTimeout(() => {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, status: "ready" } : doc
        ));
      }, 2000);
      
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is being processed.",
      });
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: "error", error: err.message } : doc
      ));
      
      toast({
        title: "Error uploading document",
        description: err.message || "There was an error uploading your document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const removeCommentContext = (index: number) => {
    const newCommentContext = [...commentContext];
    newCommentContext.splice(index, 1);
    onClearCommentContext();
    newCommentContext.forEach(item => {
      // Re-add remaining comments to context
      // This is a workaround since we don't have a direct setter for specific items
    });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold mb-2">LLM Settings</h3>
      
      {/* Model Settings Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Model Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <Select
              value={modelSettings.model}
              onValueChange={(value) => setModelSettings({...modelSettings, model: value})}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature-slider">Temperature: {modelSettings.temperature.toFixed(1)}</Label>
            </div>
            <Slider
              id="temperature-slider"
              min={0}
              max={1}
              step={0.1}
              value={[modelSettings.temperature]}
              onValueChange={(value) => setModelSettings({...modelSettings, temperature: value[0]})}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          
          <Button
            onClick={handleModelSettingsSave}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Save Model Settings
          </Button>
        </CardContent>
      </Card>
      
      {/* System Prompt Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">System Prompt</CardTitle>
          <CardDescription>Instructions for the AI's behavior and role</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      
      {/* Story Context Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Story Context</CardTitle>
          <CardDescription>
            Page {storyContext.currentPageNumber} | Node: {storyContext.currentNodeName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[100px] w-full border rounded-md bg-gray-50 p-2">
            <div className="text-sm whitespace-pre-wrap">
              {storyContext.nodeText || "No story text available for this node."}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Comment Context Section */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Comment Context</CardTitle>
            <CardDescription>Comments added to the prompt context</CardDescription>
          </div>
          {commentContext.length > 0 && (
            <Button 
              onClick={onClearCommentContext}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {commentContext.length > 0 ? (
            <ScrollArea className="h-[100px] w-full border rounded-md bg-gray-50 p-2">
              <div className="space-y-2">
                {commentContext.map((item, index) => (
                  <div key={index} className="flex justify-between items-start text-xs font-mono">
                    <div>
                      <span className="font-semibold">{item.type}:</span> "{item.text.substring(0, 50)}
                      {item.text.length > 50 ? '...' : ''}" <span className="italic">by {item.username}</span>
                    </div>
                    <Button 
                      onClick={() => removeCommentContext(index)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              No comments added. Click the send icon on comments to add them here.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* RAG Documents Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">RAG Documents</CardTitle>
          <CardDescription>Upload documents for context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="document-upload" className="cursor-pointer">
              <div className="border border-dashed rounded-md p-4 text-center hover:bg-muted/50 transition-colors">
                <Upload className="h-4 w-4 mx-auto mb-2" />
                <p className="text-sm">Upload document</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT (Max 10MB)</p>
              </div>
              <input 
                id="document-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </Label>
          </div>
          
          {documents.length > 0 && (
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {documents.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2 bg-muted rounded-md text-sm">
                  <div className="truncate max-w-[70%]">
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(doc.size)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === 'ready' ? 'bg-green-100 text-green-800' : 
                      doc.status === 'error' ? 'bg-red-100 text-red-800' :
                      doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {doc.status}
                    </span>
                    <Button 
                      onClick={() => removeDocument(doc.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Generation Type and User Prompt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Generation Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Generation Type</Label>
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
            <Label className="text-sm font-medium">User Prompt</Label>
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
        </CardContent>
      </Card>
      
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
