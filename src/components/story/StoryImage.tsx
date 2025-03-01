
import React from 'react';
import { extractImagePrompt } from './image/imageUtils';
import { useImageGeneration } from './image/useImageGeneration';
import { ImagePlaceholder } from './image/ImagePlaceholder';
import { ImageLoading } from './image/ImageLoading';
import { ImageError } from './image/ImageError';
import { ImageCompleted } from './image/ImageCompleted';

interface StoryImageProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  text: string;
}

export const StoryImage: React.FC<StoryImageProps> = ({ 
  storyId, 
  currentNode, 
  currentPage,
  text 
}) => {
  // Extract image prompt from text
  const imagePrompt = extractImagePrompt(text);
  
  // Use custom hook for image generation logic
  const { loading, imageData, generateImage } = useImageGeneration({
    storyId,
    currentNode,
    currentPage,
    imagePrompt
  });

  // If there's no image prompt in the text, don't render anything
  if (!imagePrompt) return null;

  return (
    <div className="my-6 w-full flex flex-col items-center">
      <div className="w-full max-w-lg">
        {/* Render appropriate component based on image state */}
        {imageData?.status === 'completed' && imageData.image_url ? (
          <ImageCompleted 
            imageUrl={imageData.image_url} 
            onRegenerate={generateImage}
            loading={loading}
          />
        ) : imageData?.status === 'generating' || imageData?.status === 'uploading' ? (
          <ImageLoading imageData={imageData} />
        ) : imageData?.status === 'error' ? (
          <ImageError 
            imageData={imageData}
            prompt={imagePrompt}
            onRetry={generateImage}
            loading={loading}
          />
        ) : (
          <ImagePlaceholder 
            prompt={imagePrompt}
            onGenerate={generateImage}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};
