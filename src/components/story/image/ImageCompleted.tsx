
import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ImageCompletedProps {
  imageUrl: string;
  onRegenerate: () => void;
  loading: boolean;
}

export const ImageCompleted: React.FC<ImageCompletedProps> = memo(({ 
  imageUrl, 
  onRegenerate, 
  loading 
}) => {
  // Call regenerate with force=true parameter
  const handleRegenerate = () => {
    onRegenerate();
  };

  return (
    <div className="w-full max-w-lg">
      <img 
        src={imageUrl} 
        alt="Story illustration" 
        className="w-full h-auto rounded-lg shadow-lg mb-2"
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={loading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </div>
    </div>
  );
});

// Add display name for better debugging
ImageCompleted.displayName = 'ImageCompleted';
