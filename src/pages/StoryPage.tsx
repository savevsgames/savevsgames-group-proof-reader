
import React from 'react';
import { useParams } from 'react-router-dom';
import { StoryEngine } from '@/components/StoryEngine';
import Header from '@/components/Header';

const StoryPage = () => {
  const { storyId } = useParams();

  return (
    <div className="min-h-screen bg-[#3A2618] overflow-x-hidden">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <StoryEngine />
      </div>
    </div>
  );
};

export default StoryPage;
