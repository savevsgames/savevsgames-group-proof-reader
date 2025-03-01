
import React, { useRef, useEffect } from 'react';
import { StoryImage } from './StoryImage';

interface StoryTextProps {
  text: string;
  storyId?: string;
  currentNode?: string;
  currentPage?: number;
}

export const StoryText: React.FC<StoryTextProps> = ({ 
  text,
  storyId,
  currentNode,
  currentPage 
}) => {
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
  // And remove any IMAGE: markers for display purposes
  const processText = (text: string) => {
    // First, check if there's an IMAGE: marker in the text
    const hasImageMarker = text.includes('IMAGE:');
    
    // If there's an image marker, split the text and filter out the line with the image marker
    if (hasImageMarker) {
      const lines = text.split('\n');
      const cleanedLines = lines.filter(line => !line.trim().startsWith('IMAGE:'));
      return cleanedLines;
    }
    
    // If no image marker, just split by newlines
    return text.split('\n');
  };

  const formattedText = processText(text)
    .map((paragraph, index) => (
      <p key={`p-${index}-${paragraph.substring(0, 10)}`} className="mb-4 break-words">{paragraph}</p>
    ));

  return (
    <div 
      ref={contentRef}
      className="story-text mb-8 md:mb-16 text-[#3A2618] font-serif leading-relaxed text-base md:text-lg max-w-full overflow-hidden"
      key={`story-content-${text.substring(0, 20)}`} // Key helps React identify when content changes
    >
      {formattedText}
      
      {/* Pass the full text to StoryImage so it can extract the image prompt */}
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
};
