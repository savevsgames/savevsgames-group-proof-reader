
import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ImageData } from './imageUtils';

interface ImageErrorProps {
  imageData: ImageData;
  prompt: string;
  onRetry: () => void;
  loading: boolean;
}

export const ImageError: React.FC<ImageErrorProps> = memo(({ 
  imageData, 
  prompt, 
  onRetry, 
  loading 
}) => {
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

  const getErrorMessage = () => {
    // Provide user-friendly error messages for known error types
    if (!imageData.error_message) {
      return "Unknown error occurred";
    }
    
    if (imageData.error_message.includes('attempt_count')) {
      return "There was a database configuration issue. Please try again.";
    }
    
    if (imageData.error_message.includes('Edge Function')) {
      return "The image service is temporarily unavailable. Please try again in a few minutes.";
    }
    
    if (imageData.error_message.includes('timed out')) {
      return "Image generation took too long. Please try again with a simpler prompt.";
    }
    
    // Show the specific error message if available
    return imageData.error_message;
  };

  return (
    <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
      <AlertCircle className="h-12 w-12 text-red-400" />
      <div className="max-w-md">
        <p className="text-sm text-red-500 flex items-center justify-center mb-2">
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Error: {getErrorMessage()}
        </p>
        {getAttemptsInfo()}
        <p className="text-sm text-gray-500 mb-4 break-words">Prompt: "{prompt}"</p>
        <Button
          onClick={onRetry}
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#E86305] flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Trying again...' : 'Try Again'}
        </Button>
        
        <p className="text-xs text-gray-400 mt-4">
          If the issue persists, try a different, simpler image description.
        </p>
      </div>
    </div>
  );
});

// Add display name for better debugging
ImageError.displayName = 'ImageError';
