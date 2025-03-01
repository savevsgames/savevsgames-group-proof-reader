
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, RefreshCw, Sparkles } from "lucide-react";
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
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export const StoryImage: React.FC<StoryImageProps> = ({ 
  storyId, 
  currentNode, 
  currentPage,
  text 
}) => {
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const { toast } = useToast();

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
  
  React.useEffect(() => {
    if (!storyId || !currentNode) return;
    
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
        } else {
          setImageData(null);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };
    
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
    
    try {
      const response = await supabase.functions.invoke('generate-story-image', {
        body: {
          storyId,
          nodeId: currentNode,
          pageNumber: currentPage,
          prompt: imagePrompt,
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate image');
      }
      
      setImageData(response.data.image);
      
      toast({
        title: "Image generated successfully",
        description: "Your story image has been created",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Image generation failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          {imageData && imageData.status === 'generating' ? (
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="w-full h-64 rounded-lg" />
              <p className="text-sm text-gray-500 animate-pulse flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-orange-400" />
                Generating your image...
              </p>
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
