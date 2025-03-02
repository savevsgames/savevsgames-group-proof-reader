
import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ImageData } from './imageUtils';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
    
    if (imageData.error_message.includes('OpenAI API error')) {
      if (imageData.error_message.includes('quota') || imageData.error_message.includes('billing')) {
        return "OpenAI API quota exceeded or billing issue. Please check your OpenAI account.";
      }
      if (imageData.error_message.includes('content policy') || imageData.error_message.includes('safety system')) {
        return "The image prompt violates OpenAI's content policy. Please try a different, more appropriate prompt.";
      }
      if (imageData.error_message.includes('rate limit')) {
        return "Rate limit exceeded. Please wait a minute and try again.";
      }
      if (imageData.error_message.includes('API key')) {
        return "The OpenAI API key is missing or invalid. Please check your API configuration.";
      }
      return imageData.error_message.replace('OpenAI API error: ', '');
    }
    
    if (imageData.error_message.includes('status 4')) {
      return "The OpenAI API couldn't process this request. Please try a different prompt.";
    }
    
    if (imageData.error_message.includes('status 5')) {
      return "The OpenAI service is currently experiencing issues. Please try again later.";
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

  const getTechnicalDetails = () => {
    if (imageData.error_message) {
      return (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">
            Technical details
          </summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap">
            {imageData.error_message}
          </pre>
        </details>
      );
    }
    return null;
  };

  // Show enhanced prompt if available
  const displayPrompt = imageData.enhanced_prompt || prompt;
  const errorMessage = getErrorMessage();

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Image Generation Failed</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>

      <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-6 text-center flex flex-col items-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div className="max-w-md">
          {getAttemptsInfo()}
          <p className="text-sm text-gray-500 mb-4 break-words">
            <span className="font-semibold">Original prompt:</span> "{prompt}"
          </p>
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
          
          {getTechnicalDetails()}
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
ImageError.displayName = 'ImageError';
