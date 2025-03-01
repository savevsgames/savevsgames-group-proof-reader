import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CustomStory } from "@/lib/storyUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StoryTabs from "@/components/story/StoryTabs";
import { BookHeader } from "@/components/story/BookHeader";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertTriangle } from "lucide-react";

const StoryEditPage = () => {
  const { id } = useParams();
  const storyId = id as string;
  const [story, setStory] = useState<any | null>(null);
  const [storyData, setStoryData] = useState<CustomStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentNode, setCurrentNode] = useState<string>("root");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Warn the user if they try to close the tab with unsaved changes
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          return "You have unsaved changes. Are you sure you want to leave?";
        }
      },
      [hasUnsavedChanges]
    )
  );

  // Calculate total pages based on story data
  useEffect(() => {
    if (storyData) {
      const numberOfNodes = Object.keys(storyData).length;
      setTotalPages(Math.max(numberOfNodes, 1));
    }
  }, [storyData]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    // Calculate node name from page number
    const nodeName = Object.keys(storyData || {})[newPage - 1] || "root";
      
    setCurrentNode(nodeName);
    setCurrentPage(newPage);
  };

  // Handle node change
  const handleNodeChange = (nodeName: string) => {
    setCurrentNode(nodeName);
    // Calculate page number from node index
    const nodeIndex = Object.keys(storyData || {}).indexOf(nodeName);
    setCurrentPage(nodeIndex >= 0 ? nodeIndex + 1 : 1);
  };

  // Confirmation when navigating away with unsaved changes
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setNavigationPath(path);
      setIsLeaveDialogOpen(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    setIsLeaveDialogOpen(false);
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        console.log("Fetching story with ID:", storyId);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", storyId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Fetched story data:", data);
          setStory(data);
          
          // Try to get story content from various possible sources
          let storyContent = null;
          
          // First, check if story_content exists (it might have been added in previous edits)
          if (data.story_content) {
            try {
              storyContent = JSON.parse(data.story_content);
              console.log("Found story_content, using that");
            } catch (parseError) {
              console.error("Error parsing story_content:", parseError);
            }
          }
          
          // If no valid story_content, try to fetch from story_url
          if (!storyContent && data.story_url) {
            try {
              console.log("Attempting to fetch story from URL:", data.story_url);
              const response = await fetch(data.story_url);
              if (response.ok) {
                storyContent = await response.json();
                console.log("Successfully loaded story from URL");
              } else {
                console.error("Failed to fetch story from URL:", response.statusText);
              }
            } catch (fetchError) {
              console.error("Error fetching story from URL:", fetchError);
            }
          }
          
          // If we have valid story content, use it
          if (storyContent) {
            setStoryData(storyContent);
            setError(null);
            
            // Calculate total pages
            const numberOfNodes = Object.keys(storyContent).length;
            setTotalPages(Math.max(numberOfNodes, 1));
          } else {
            // Create a default empty story structure as fallback
            console.log("No valid story content found, creating default structure");
            const defaultStory = {
              root: {
                text: "Start writing your story here...",
                choices: [],
              },
            };
            setStoryData(defaultStory);
            setTotalPages(1);
          }
          
          // Reset unsaved changes flag
          setHasUnsavedChanges(false);
        } else {
          setError("Story not found.");
        }
      } catch (error: any) {
        console.error("Error fetching story:", error);
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

      setHasUnsavedChanges(false);
      
      toast({
        title: "Success",
        description: "Story saved successfully!",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Error saving story:", error);
      toast({
        title: "Error",
        description: `Failed to save story: ${error.message}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F5F1E8] min-h-screen">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        {/* Use BookHeader for page navigation */}
        {story && !loading && (
          <BookHeader
            bookTitle={story.title || "Untitled Story"}
            currentPage={currentPage}
            totalPages={totalPages}
            canGoBack={false}
            commentCount={0}
            onBack={() => {}}
            onRestart={() => {}}
            onOpenComments={() => {}}
            onPageChange={handlePageChange}
          />
        )}
        
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-[#3A2618]">Edit Story</h1>
          {story?.title && (
            <h2 className="text-xl text-[#5A3A28] mt-2">{story.title}</h2>
          )}
          
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="mt-2 flex items-center text-amber-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
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
                  onUnsavedChanges={setHasUnsavedChanges}
                  currentNode={currentNode}
                  onNodeChange={handleNodeChange}
                />
                
                <div className="mt-6 flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                  
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className={`${hasUnsavedChanges ? 'bg-[#F97316] hover:bg-[#E86305]' : 'bg-gray-400'} text-white`}
                  >
                    {saving ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
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
        
        {/* Navigation confirmation dialog */}
        <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes that will be lost if you leave this page.
                Do you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsLeaveDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmNavigation}>
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default StoryEditPage;
