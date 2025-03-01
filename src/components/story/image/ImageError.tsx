
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ImageData } from './imageUtils';

interface ImageErrorProps {
  imageData: ImageData;
  prompt: string;
  onRetry: () => void;
  loading: boolean;
}

export const ImageError: React.FC<ImageErrorProps> = ({ 
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
    // Provide a user-friendly error message
    if (imageData.error_message?.includes('attempt_count')) {
      return "There was a database configuration issue. Please try again.";
    }
    
    return imageData.error_message || "Something went wrong";
  };

  return (
    <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
      <AlertCircle className="h-12 w-12 text-red-400" />
      <div>
        <p className="text-sm text-red-500 flex items-center justify-center mb-2">
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Error: {getErrorMessage()}
        </p>
        {getAttemptsInfo()}
        <p className="text-sm text-gray-500 mb-4">Prompt: {prompt}</p>
        <Button
          onClick={onRetry}
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#E86305]"
        >
          {loading ? 'Trying again...' : 'Try Again'}
        </Button>
      </div>
    </div>
  );
};
