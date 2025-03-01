
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookFooterProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const BookFooter: React.FC<BookFooterProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  return (
    <div className="flex justify-between items-center max-w-3xl mx-auto w-full p-4 mb-4">
      <Button
        variant="outline"
        size="sm"
        className="text-[#3A2618] border-[#3A2618]/30"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      
      <span className="text-sm text-[#3A2618]/70">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        className="text-[#3A2618] border-[#3A2618]/30"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};
