
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
      {/* Book Title and Page Number */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 bg-[#F97316] text-[#E8DCC4] px-4 py-1 rounded-full z-10 whitespace-nowrap">
        <span className="font-serif">{bookTitle} - Page {currentPage} of {totalPages}</span>
      </div>
      
      {/* Controls */}
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        {canGoBack && (
          <button 
            onClick={onBack}
            className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            title="Go back"
          >
            ↩
          </button>
        )}
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
          title="Back to Library"
        >
          ✕
        </button>
        <button 
          onClick={onOpenComments}
          className="bg-[#F97316] text-[#E8DCC4] w-10 h-10 flex items-center justify-center hover:bg-[#E86305] transition-colors relative"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
          title="Comments"
        >
          <MessageSquare className="h-5 w-5" />
          
          <div className="absolute -top-2 -right-2 bg-white text-[#3A2618] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {commentCount}
          </div>
        </button>
      </div>
    </>
  );
};
