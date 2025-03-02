
import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

interface ImagePlaceholderProps {
  prompt: string;
  onGenerate: () => void;
  loading: boolean;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = memo(({ 
  prompt, 
  onGenerate, 
  loading 
}) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
      <ImageIcon className="h-12 w-12 text-gray-400" />
      <div>
        <p className="text-sm text-gray-500 mb-4">Prompt: {prompt}</p>
        <Button
          onClick={onGenerate}
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#E86305]"
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
      </div>
    </div>
  );
});

// Add display name for better debugging
ImagePlaceholder.displayName = 'ImagePlaceholder';
