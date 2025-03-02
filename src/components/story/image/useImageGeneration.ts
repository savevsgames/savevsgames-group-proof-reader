
import { useState, useEffect, useRef } from 'react';
import { ImageData, fetchImageData, generateNewImage } from './imageUtils';
import { useToast } from "@/hooks/use-toast";

interface UseImageGenerationProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  imagePrompt: string | null;
}

export const useImageGeneration = ({ 
  storyId, 
  currentNode, 
  currentPage, 
  imagePrompt 
}: UseImageGenerationProps) => {
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [shouldFetchImage, setShouldFetchImage] = useState(true); // Changed to true to fetch on load
  const requestInProgress = useRef(false);
  const { toast } = useToast();

  const MAX_POLLING_ATTEMPTS = 30; // 30 attempts * 2 seconds = 60 seconds max
  const POLLING_INTERVAL = 2000; // 2 seconds

  // Poll for image status updates with improved debounce and error handling
  useEffect(() => {
    // Only poll if we have an image that's in a non-final state
    if (!imageData || !(['generating', 'uploading'].includes(imageData.status))) {
      return;
    }
    
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
    
    // Set up polling with a ref check to prevent overlapping requests
    const pollTimer = setTimeout(async () => {
      if (requestInProgress.current) return;
      
      try {
        requestInProgress.current = true;
        const data = await fetchImageData(storyId, currentNode);
        requestInProgress.current = false;
        
        if (data) {
          // Only update state if the status has changed to prevent unnecessary renders
          if (JSON.stringify(data) !== JSON.stringify(imageData)) {
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
          }
          
          // Continue polling if still in progress
          if (data.status === 'generating' || data.status === 'uploading') {
            setPollingCount(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error polling for image status:', error);
        requestInProgress.current = false;
        // Continue polling despite errors
        setPollingCount(prev => prev + 1);
      }
    }, POLLING_INTERVAL);
    
    return () => clearTimeout(pollTimer);
  }, [imageData, pollingCount, storyId, currentNode, toast]);
  
  // Reset state when node or page changes with improved dependency tracking
  useEffect(() => {
    if (!storyId || !currentNode) return;
    
    // Reset all data when the node/page changes
    setShouldFetchImage(true);
    setImageData(null);
    setPollingCount(0);
    requestInProgress.current = false;
  }, [storyId, currentNode]);

  // Fetch existing image if shouldFetchImage is true with improved request tracking
  useEffect(() => {
    if (!shouldFetchImage || requestInProgress.current || !storyId || !currentNode) return;
    
    const checkExistingImage = async () => {
      try {
        requestInProgress.current = true;
        const data = await fetchImageData(storyId, currentNode);
        requestInProgress.current = false;
        
        if (data) {
          // console.log('Found existing image data:', data);
          setImageData(data);
          
          // If status is generating or uploading, start polling
          if (data.status === 'generating' || data.status === 'uploading') {
            setPollingCount(0); // Reset polling count
          }
        } else {
          // No image found, auto-generate if we have a prompt
          if (imagePrompt) {
            // Wait briefly to ensure we're not causing race conditions
            setTimeout(() => {
              generateImage(false);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error checking existing image:', error);
        requestInProgress.current = false;
      } finally {
        setShouldFetchImage(false);
      }
    };
    
    checkExistingImage();
  }, [shouldFetchImage, storyId, currentNode, imagePrompt]);

  // Improved image generation function with better error handling and debounce
  const generateImage = async (forceRegenerate = false) => {
    if (!imagePrompt) {
      toast({
        title: "No image prompt found",
        description: "Add an image prompt by adding 'IMAGE: your prompt here' in your story text.",
        variant: "destructive"
      });
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading || requestInProgress.current) {
      // console.log('Image generation already in progress, skipping request');
      return;
    }

    setLoading(true);
    setPollingCount(0);
    setShouldFetchImage(true);
    requestInProgress.current = true;
    
    try {
      // console.log('Attempting to generate image with params:', { 
      //   storyId, 
      //   nodeId: currentNode, 
      //   pageNumber: currentPage, 
      //   prompt: imagePrompt,
      //   forceRegenerate 
      // });
      
      const newImageData = await generateNewImage(
        storyId, 
        currentNode, 
        currentPage, 
        imagePrompt,
        forceRegenerate
      );
      
      if (newImageData) {
        // console.log('Image generation successful, received data:', newImageData);
        setImageData(newImageData);
        
        // Show toast if not already generating
        if (newImageData.status !== 'completed') {
          toast({
            title: "Image generation started",
            description: "Your image is being generated. This may take up to a minute.",
            variant: "default"
          });
        }
      } else {
        throw new Error("Failed to generate image data - received null response");
      }
    } catch (error: any) {
      console.error('Error in generateImage:', error);
      const errorDetails = error.message || "Unknown error";
      
      // Extract more details from the error if possible
      let errorMessage = "Image generation failed";
      if (error.message.includes('Edge Function')) {
        errorMessage = "The image generation service is currently unavailable. Please try again later.";
      } else if (typeof error === 'object' && error.details) {
        errorMessage = error.details;
      }
      
      toast({
        title: "Image generation failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Update local state to reflect error with detailed message
      setImageData(prev => prev ? {
        ...prev,
        status: 'error',
        error_message: errorDetails
      } : {
        id: 'temp-error-id',
        image_url: '',
        status: 'error',
        error_message: errorDetails
      });
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  return {
    loading,
    imageData,
    generateImage
  };
};
