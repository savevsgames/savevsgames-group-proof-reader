
import React, { useRef, useEffect } from 'react';

interface StoryTextProps {
  text: string;
}

export const StoryText: React.FC<StoryTextProps> = ({ text }) => {
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
    <div 
      ref={contentRef}
      className="story-text mb-8 md:mb-16 text-[#3A2618] font-serif leading-relaxed text-base md:text-lg"
      key={`story-content-${text.substring(0, 20)}`} // Key helps React identify when content changes
    >
      {formattedText}
    </div>
  );
};
