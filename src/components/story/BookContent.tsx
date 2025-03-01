
import React from 'react';

interface BookContentProps {
  story: any;
  currentPage: number;
}

export const BookContent: React.FC<BookContentProps> = ({ story, currentPage }) => {
  return (
    <div className="flex-grow bg-[#F9F5EB] max-w-3xl mx-auto w-full p-6 sm:p-8 my-4 shadow-md rounded-lg">
      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-[#3A2618] leading-relaxed">
          {/* Display story content for the current page */}
          {story.content && story.content[currentPage - 1]
            ? story.content[currentPage - 1]
            : "This page appears to be blank..."}
        </p>
      </div>
    </div>
  );
};
