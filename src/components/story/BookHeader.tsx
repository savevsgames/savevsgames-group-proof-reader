
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookHeaderProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  canGoBack: boolean;
  commentCount: number;
  onBack: () => void;
  onRestart: () => void;
  onOpenComments: () => void;
}

export const BookHeader: React.FC<BookHeaderProps> = ({
  bookTitle,
  currentPage,
  totalPages,
  canGoBack,
  commentCount,
  onBack,
  onRestart,
  onOpenComments
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Controls - Moved to align with Comments header */}
      <div className="absolute top-0 md:top-4 right-4 z-30 flex gap-3">
        {canGoBack && (
          <button 
            onClick={onBack}
            className="bg-[#F97316] text-[#E8DCC4] w-12 h-12 flex items-center justify-center hover:bg-[#E86305] transition-colors shadow-md"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            title="Go back"
          >
            <span className="text-xl">↩</span>
          </button>
        )}
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-[#F97316] text-[#E8DCC4] w-12 h-12 flex items-center justify-center hover:bg-[#E86305] transition-colors shadow-md"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
          title="Back to Library"
        >
          <span className="text-xl">✕</span>
        </button>
        <div className="relative">
          <button 
            onClick={onOpenComments}
            className="bg-[#F97316] text-[#E8DCC4] w-12 h-12 flex items-center justify-center hover:bg-[#E86305] transition-colors shadow-md"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            title="Comments"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
          
          {/* Fixed comment count badge positioning */}
          <div className="absolute -top-3 -right-3 bg-white text-[#3A2618] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm border border-[#3A2618]/20 z-20">
            {commentCount}
          </div>
        </div>
      </div>
      
      {/* Book Title and Page Number */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 bg-[#F97316] text-[#E8DCC4] px-6 py-2 rounded-full z-10 whitespace-nowrap shadow-md">
        <span className="font-serif">{bookTitle} - Page {currentPage} of {totalPages}</span>
      </div>
    </>
  );
};
