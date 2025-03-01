
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StoryImageProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  text: string;
}

interface ImageData {
  id: string;
  image_url: string;
  status: 'pending' | 'generating' | 'uploading' | 'completed' | 'error';
  error_message?: string;
  request_id?: string;
  attempt_count?: number;
}

export const StoryImage: React.FC<StoryImageProps> = ({ 
  storyId, 
  currentNode, 
  currentPage,
  text 
}) => {
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const { toast } = useToast();

  const MAX_POLLING_ATTEMPTS = 30; // 30 attempts * 2 seconds = 60 seconds max
  const POLLING_INTERVAL = 2000; // 2 seconds

  // Extract image prompt from the text if it exists
  const extractImagePrompt = (text: string): string | null => {
    const imageMarker = "IMAGE:";
    if (text.includes(imageMarker)) {
      const startIndex = text.indexOf(imageMarker) + imageMarker.length;
      let endIndex = text.indexOf("\n", startIndex);
      if (endIndex === -1) endIndex = text.length;
      return text.substring(startIndex, endIndex).trim();
    }
    return null;
  };

  const imagePrompt = extractImagePrompt(text);
  
  // Fetch existing image
  const fetchExistingImage = async () => {
    try {
      const { data, error } = await supabase
        .from('story_images')
        .select('*')
        .eq('book_id', storyId)
        .eq('story_node', currentNode)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setImageData(data);
        
        // If status is generating or uploading, start polling
        if (data.status === 'generating' || data.status === 'uploading') {
          setPollingCount(0); // Reset polling count
        }
      } else {
        setImageData(null);
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };
  
  // Poll for image status updates
  useEffect(() => {
    // Only poll if we have an image that's in a non-final state
    if (imageData && (imageData.status === 'generating' || imageData.status === 'uploading')) {
      // If we've exceeded max polling attempts, mark as error
      if (pollingCount >= MAX_POLLING_ATTEMPTS) {
        setImageData(prev => prev ? { 
          ...prev, 
          status: 'error',
          error_message: 'Image generation timed out after 60 seconds' 
        } : null);
        
        toast({
          title: "Image generation timed out",
          description: "The image generation process took too long. Please try again.",
          variant: "destructive"
        });
        
        return;
      }
      
      // Set up polling interval
      const pollTimer = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('story_images')
            .select('*')
            .eq('book_id', storyId)
            .eq('story_node', currentNode)
            .single();
          
          if (error) {
            throw error;
          }
          
          if (data) {
            setImageData(data);
            
            // Show toast when image is completed
            if (data.status === 'completed' && imageData.status !== 'completed') {
              toast({
                title: "Image generated successfully",
                description: "Your story image has been created",
                variant: "default"
              });
            }
            
            // Show error toast when image generation fails
            if (data.status === 'error' && imageData.status !== 'error') {
              toast({
                title: "Image generation failed",
                description: data.error_message || "Something went wrong",
                variant: "destructive"
              });
            }
            
            // Continue polling if still in progress
            if (data.status === 'generating' || data.status === 'uploading') {
              setPollingCount(prev => prev + 1);
            }
          }
        } catch (error) {
          console.error('Error polling for image status:', error);
          // Continue polling despite errors
          setPollingCount(prev => prev + 1);
        }
      }, POLLING_INTERVAL);
      
      return () => clearTimeout(pollTimer);
    }
  }, [imageData, pollingCount, storyId, currentNode, toast]);
  
  // Initial data load when component mounts or parameters change
  useEffect(() => {
    if (!storyId || !currentNode) return;
    fetchExistingImage();
  }, [storyId, currentNode]);

  const generateImage = async () => {
    if (!imagePrompt) {
      toast({
        title: "No image prompt found",
        description: "Add an image prompt by adding 'IMAGE: your prompt here' in your story text.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setPollingCount(0); // Reset polling count
    
    try {
      // Call the edge function to start image generation
      const response = await supabase.functions.invoke('generate-story-image', {
        body: {
          storyId,
          nodeId: currentNode,
          pageNumber: currentPage,
          prompt: imagePrompt,
        },
      });
      
      // Improved error handling
      if (!response || !response.data) {
        throw new Error('No response received from image generation service');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate image');
      }
      
      // Set the image data from the response
      setImageData(response.data.image);
      
      // Show toast if not already generating
      if (response.data.image.status !== 'completed') {
        toast({
          title: "Image generation started",
          description: "Your image is being generated. This may take up to a minute.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Image generation failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
      
      // Update local state to reflect error
      setImageData(prev => prev ? {
        ...prev,
        status: 'error',
        error_message: error.message || "Unknown error"
      } : null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!imageData) return null;
    
    switch (imageData.status) {
      case 'generating':
        return (
          <p className="text-sm text-gray-500 animate-pulse flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-orange-400" />
            Generating your image with AI...
          </p>
        );
      case 'uploading':
        return (
          <p className="text-sm text-gray-500 animate-pulse flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
            Processing image and uploading...
          </p>
        );
      case 'error':
        return (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
            Error: {imageData.error_message || "Something went wrong"}
          </p>
        );
      default:
        return null;
    }
  };

  // Show attempts count if more than 1
  const getAttemptsInfo = () => {
    if (imageData?.attempt_count && imageData.attempt_count > 1) {
      return (
        <p className="text-xs text-gray-400">
          Attempt {imageData.attempt_count} of generating this image
        </p>
      );
    }
    return null;
  };

  // If there's no image prompt in the text, don't render anything
  if (!imagePrompt) return null;

  return (
    <div className="my-6 w-full flex flex-col items-center">
      {imageData && imageData.status === 'completed' && imageData.image_url ? (
        <div className="w-full max-w-lg">
          <img 
            src={imageData.image_url} 
            alt="Story illustration" 
            className="w-full h-auto rounded-lg shadow-lg mb-2"
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={generateImage}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          {(imageData && (imageData.status === 'generating' || imageData.status === 'uploading')) ? (
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="w-full h-64 rounded-lg" />
              {getStatusMessage()}
              {getAttemptsInfo()}
              <p className="text-xs text-gray-400">
                This may take up to a minute. Please wait...
              </p>
            </div>
          ) : imageData && imageData.status === 'error' ? (
            <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <div>
                {getStatusMessage()}
                {getAttemptsInfo()}
                <p className="text-sm text-gray-500 mb-4">Prompt: {imagePrompt}</p>
                <Button
                  onClick={generateImage}
                  disabled={loading}
                  className="bg-[#F97316] hover:bg-[#E86305]"
                >
                  {loading ? 'Trying again...' : 'Try Again'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
              <ImageIcon className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 mb-4">Prompt: {imagePrompt}</p>
                <Button
                  onClick={generateImage}
                  disabled={loading}
                  className="bg-[#F97316] hover:bg-[#E86305]"
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
