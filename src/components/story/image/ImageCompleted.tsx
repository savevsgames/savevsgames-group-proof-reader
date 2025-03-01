
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ImageCompletedProps {
  imageUrl: string;
  onRegenerate: () => void;
  loading: boolean;
}

export const ImageCompleted: React.FC<ImageCompletedProps> = ({ 
  imageUrl, 
  onRegenerate, 
  loading 
}) => {
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
          onClick={onRegenerate}
          disabled={loading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </div>
    </div>
  );
};
