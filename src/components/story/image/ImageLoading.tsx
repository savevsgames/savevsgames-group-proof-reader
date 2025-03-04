
import React, { memo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { ImageData } from './imageUtils';

interface ImageLoadingProps {
  imageData: ImageData;
}

export const ImageLoading: React.FC<ImageLoadingProps> = memo(({ imageData }) => {
  const getStatusMessage = () => {
    switch (imageData.status) {
      case 'generating':
        return (
          <p className="text-sm text-gray-500 animate-pulse flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-orange-400" />
            Creating your pixel art fantasy image with AI...
          </p>
        );
      case 'uploading':
        return (
          <p className="text-sm text-gray-500 animate-pulse flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
            Processing image and uploading...
          </p>
        );
      default:
        return null;
    }
  };

  const getAttemptsInfo = () => {
    if (imageData.attempt_count && imageData.attempt_count > 1) {
      return (
        <p className="text-xs text-gray-400">
          Attempt {imageData.attempt_count} of generating this image
        </p>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Skeleton className="w-full h-64 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      {getStatusMessage()}
      {getAttemptsInfo()}
      <p className="text-xs text-gray-400">
        Creating pixel art fantasy imagery may take up to a minute...
      </p>
    </div>
  );
});

// Add display name for better debugging
ImageLoading.displayName = 'ImageLoading';
