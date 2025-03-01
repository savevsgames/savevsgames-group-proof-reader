
import React from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';

interface StoryContinueButtonProps {
  onClick: () => void;
  label?: string;
}

export const StoryContinueButton: React.FC<StoryContinueButtonProps> = ({ 
  onClick, 
  label = "Continue Reading" 
}) => {
  return (
    <div className="flex justify-center">
      <Button 
        onClick={onClick}
        className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
      >
        {label} <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
