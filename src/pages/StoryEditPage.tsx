import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CustomStory } from "@/lib/storyUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import StoryTabs from "@/components/story/StoryTabs";

const StoryEditPage = () => {
  const { id } = useParams();
  const storyId = id as string;
  const [story, setStory] = useState<any | null>(null);
  const [storyData, setStoryData] = useState<CustomStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", storyId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setStory(data);
          try {
            const parsedStory = JSON.parse(data.story_content);
            setStoryData(parsedStory);
          } catch (parseError) {
            console.error("Error parsing story content:", parseError);
            setError("Failed to parse existing story content.");
            setStoryData({
              root: {
                text: "Failed to parse story format.",
                choices: [],
              },
            });
          }
        } else {
          setError("Story not found.");
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  const handleStoryDataChange = (data: CustomStory) => {
    setStoryData(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!storyData) {
        throw new Error("No story data to save.");
      }

      const { error } = await supabase
        .from("books")
        .update({ story_content: JSON.stringify(storyData) })
        .eq("id", storyId);

      if (error) {
        throw error;
      }

      alert("Story saved successfully!");
    } catch (error: any) {
      console.error("Error saving story:", error);
      alert(`Failed to save story: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

return (
  <div className="bg-[#F5F1E8] min-h-screen">
    <Header />
    
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-[#3A2618]">Edit Story</h1>
        {story?.title && (
          <h2 className="text-xl text-[#5A3A28] mt-2">{story.title}</h2>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F97316] border-r-transparent"></div>
          <p className="mt-4 text-[#3A2618]">Loading story data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 my-8">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="link" 
            className="text-red-700 p-0 mt-2"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      ) : (
        <>
          {storyData ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <StoryTabs 
                storyId={storyId} 
                storyData={storyData} 
                onStoryDataChange={handleStoryDataChange} 
              />
              
              <div className="mt-6 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#F97316] hover:bg-[#E86305] text-white"
                >
                  {saving ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white shadow-md rounded-lg">
              <p className="text-[#3A2618]">No story data found. Please select another story.</p>
              <Button 
                variant="link" 
                className="mt-4"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  </div>
);
};

export default StoryEditPage;
