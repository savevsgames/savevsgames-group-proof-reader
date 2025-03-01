
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoryEngine } from '@/components/StoryEngine';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

const StoryPage = () => {
  // Changed from storyId to id to match route parameter
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!id) {
      toast({
        title: "Error",
        description: "No story ID provided. Redirecting to dashboard.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [id, navigate, toast]);

  return (
    <div className="min-h-screen bg-[#3A2618] w-full overflow-x-hidden">
      <Header />
      
      <div className="mx-auto px-4 w-full">
        <StoryEngine />
      </div>
    </div>
  );
};

export default StoryPage;
