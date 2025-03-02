
import React, { useRef, useEffect, memo, useMemo } from 'react';
import { StoryImage } from './StoryImage';

interface StoryTextProps {
  text: string;
  storyId?: string;
  currentNode?: string;
  currentPage?: number;
}

export const StoryText: React.FC<StoryTextProps> = memo(({ 
  text,
  storyId,
  currentNode,
  currentPage 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef<string>(text);
  
  // Use useEffect to force DOM updates when text changes significantly
  useEffect(() => {
    // Only do the DOM manipulation if the text has actually changed
    if (previousTextRef.current !== text) {
      previousTextRef.current = text;
      
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
    }
  }, [text]);

  // Process text to handle newlines - memoized to prevent recalculation
  const formattedText = useMemo(() => {
    // Check if there's an IMAGE: marker in the text
    const hasImageMarker = text.includes('IMAGE:');
    
    // Process the text based on whether it has an image marker
    const processedLines = hasImageMarker 
      ? text.split('\n').filter(line => !line.trim().startsWith('IMAGE:'))
      : text.split('\n');
    
    // Create paragraph elements
    return processedLines.map((paragraph, index) => (
      <p key={`p-${index}-${paragraph.substring(0, 10)}`} className="mb-4 break-words">
        {paragraph}
      </p>
    ));
  }, [text]);

  return (
    <div 
      ref={contentRef}
      className="story-text mb-8 md:mb-16 text-[#3A2618] font-serif leading-relaxed text-base md:text-lg max-w-full overflow-hidden"
    >
      {formattedText}
      
      {/* Only render StoryImage if all required props are provided */}
      {storyId && currentNode && currentPage !== undefined && (
        <StoryImage 
          storyId={storyId}
          currentNode={currentNode}
          currentPage={currentPage}
          text={text}
        />
      )}
    </div>
  );
});

// Add display name for better debugging
StoryText.displayName = 'StoryText';
