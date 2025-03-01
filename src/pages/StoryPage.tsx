
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoryEngine } from '@/components/StoryEngine';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const StoryPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#3A2618] overflow-x-hidden">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Button 
          onClick={() => navigate('/dashboard')}
          variant="ghost" 
          className="text-[#E8DCC4] hover:text-[#F97316] transition-colors mb-4"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Library
        </Button>
        
        <StoryEngine />
      </div>
    </div>
  );
};

export default StoryPage;
