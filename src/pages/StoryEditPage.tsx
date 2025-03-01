
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const [bookTitle, setBookTitle] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [promptInput, setPromptInput] = useState("");

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
              setStoryContent(JSON.stringify(storyData, null, 2));
            }
          } catch (contentError) {
            console.error("Error fetching story content:", contentError);
            setStoryContent("// Add your story content here");
          }
        } else {
          setStoryContent("// Add your story content here");
        }
      } catch (error: any) {
        console.error("Error fetching book:", error);
        setError(error.message || "Failed to fetch book details");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user, navigate]);

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

      // In a real implementation, you would:
      // 1. Parse and validate the story content
      // 2. Upload it to storage or save it directly
      // 3. Update the book record with new metadata

      // For this demo, we'll just record the edit in the story_edits table
      const { error: editError } = await supabase
        .from("story_edits")
        .insert({
          book_id: id,
          editor_id: user.id,
          content: storyContent,
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();
      
      if (data.generatedContent) {
        // In a more sophisticated implementation, you would merge this content
        // into the appropriate part of the story structure
        setStoryContent(data.generatedContent);
        
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
