
import React from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';

interface StoryContinueButtonProps {
  onClick?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  isEnding?: boolean;
  onRestart?: () => void;
  label?: string;
}

export const StoryContinueButton: React.FC<StoryContinueButtonProps> = ({ 
  onClick, 
  onContinue,
  canContinue = true,
  isEnding = false,
  onRestart,
  label = "Continue Reading" 
}) => {
  // Use onContinue if provided, otherwise fallback to onClick
  const handleClick = () => {
    if (isEnding && onRestart) {
      onRestart();
    } else if (onContinue) {
      onContinue();
    } else if (onClick) {
      onClick();
    }
  };

  // Determine the label based on the state
  const buttonLabel = isEnding ? "Restart Story" : label;
  
  return (
    <div className="flex justify-center">
      <Button 
        onClick={handleClick}
        className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
        disabled={!isEnding && !canContinue}
      >
        {buttonLabel} <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
