
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
          {story.content && story.content[currentPage - 1]
            ? story.content[currentPage - 1]
            : "This page appears to be blank..."}
        </p>
        
        {/* Display choices if available */}
        {story.choices && story.choices[currentPage - 1] && story.choices[currentPage - 1].length > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-[#3A2618] font-semibold">What will you do?</p>
            {story.choices[currentPage - 1].map((choice: any, index: number) => (
              <button
                key={index}
                className="block w-full text-left p-3 bg-[#E8DCC4] hover:bg-[#D8CCA4] text-[#3A2618] rounded transition-colors"
                onClick={() => {
                  if (story.onChoice) {
                    story.onChoice(index);
                  }
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
