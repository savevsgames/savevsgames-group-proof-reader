
import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';
import { StoryChoice } from '@/lib/storyUtils';

interface StoryDisplayProps {
  text: string;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  text,
  canContinue,
  choices,
  isEnding,
  onContinue,
  onChoice
}) => {
  // Create a ref to the container element 
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use useEffect to force DOM updates when text changes
  useEffect(() => {
    if (contentRef.current) {
      // Force a redraw of the content
      const currentHeight = contentRef.current.style.height;
      contentRef.current.style.height = '0px';
      
      // Use requestAnimationFrame to ensure the DOM updates
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.height = currentHeight;
        }
      });
    }
    
    // Scroll to top when text changes
    window.scrollTo(0, 0);
  }, [text]);

  // Process text to handle newlines, which is common in Ink.js text output
  const formattedText = text
    .split('\n')
    .map((paragraph, index) => (
      <p key={`p-${index}-${paragraph.substring(0, 10)}`} className="mb-4">{paragraph}</p>
    ));

  return (
    <div className="w-full bg-[#E8DCC4] p-4 md:p-6 lg:p-10 min-h-[400px] md:min-h-[600px] relative book-page rounded-lg md:rounded-none shadow-md md:shadow-none">
      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        <div 
          ref={contentRef}
          className="story-text mb-8 md:mb-16 text-[#3A2618] font-serif leading-relaxed text-base md:text-lg"
          key={`story-content-${text.substring(0, 20)}`} // Key helps React identify when content changes
        >
          {text ? (
            formattedText
          ) : (
            <div className="text-center italic">
              <p>No content available for this node.</p>
              <div className="mt-4">
                <Button 
                  onClick={onContinue}
                  className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Story Controls - now on the left page */}
        <div className="mt-4 md:mt-8">
          {!isEnding && text ? (
            <div className="space-y-4 md:space-y-6">
              {canContinue ? (
                <div className="flex justify-center">
                  <Button 
                    onClick={onContinue}
                    className="bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors flex items-center gap-2"
                  >
                    Continue Reading <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : choices.length > 0 ? (
                <>
                  <p className="text-[#3A2618] font-serif text-center italic">What would you like to do?</p>
                  <div className="flex flex-col space-y-4 md:space-y-6">
                    {choices.map((choice, index) => (
                      <div key={`choice-${index}`} className="text-center">
                        <button
                          onClick={() => onChoice(index)}
                          className="font-serif text-[#3A2618] hover:text-[#F97316] transition-colors border-b border-[#3A2618] hover:border-[#F97316] px-4 py-1 italic"
                        >
                          {choice.text}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
