
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoryEngine } from '@/components/StoryEngine';
import { ArrowLeft } from 'lucide-react';

const StoryPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#3A2618]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-[#E8DCC4] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Library
        </button>
      </div>
      
      <StoryEngine />
    </div>
  );
};

export default StoryPage;
