
import React from 'react';

interface StoryDisplayProps {
  text: string;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ text }) => {
  return (
    <div className="w-1/2 bg-[#E8DCC4] p-6 md:p-10 min-h-[600px] relative book-page">
      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:font-serif">
        <div className="story-text mb-16 text-[#3A2618] font-serif leading-relaxed text-lg">
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
};
