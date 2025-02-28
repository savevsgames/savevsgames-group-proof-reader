
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStory } from '@/hooks/useStory';
import { useAuth } from '@/context/AuthContext';
import { CommentModal } from './CommentModal';
import { BookLayout } from './story/BookLayout';

// Import font styles
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

export const StoryEngine = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  
  const {
    isLoading,
    error,
    bookTitle,
    currentPage,
    totalPages,
    currentText,
    currentChoices,
    canContinue,
    canGoBack,
    commentCount,
    currentStoryPosition,
    handleContinue,
    handleChoice,
    handleBack,
    handleRestart,
    updateCommentCount
  } = useStory(storyId);

  // Handle the comment modal open state change
  const handleCommentModalOpenChange = (open: boolean) => {
    setIsCommentModalOpen(open);
    
    // Refresh comment count when modal closes (in case comments were added/deleted)
    if (!open) {
      updateCommentCount();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3A2618]">
        <div className="animate-fade-in text-[#E8DCC4] font-serif">Loading story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3A2618]">
        <div className="text-[#E8DCC4] font-serif">
          <p className="text-xl mb-4">Error: {error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-[#F97316] text-[#E8DCC4] font-serif rounded hover:bg-[#E86305] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isEnding = currentChoices.length === 0 && !canContinue;

  return (
    <div className="min-h-screen bg-[#3A2618] py-8 px-4 flex items-center justify-center">
      <BookLayout 
        bookTitle={bookTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        currentText={currentText}
        canContinue={canContinue}
        choices={currentChoices}
        isEnding={isEnding}
        canGoBack={canGoBack}
        commentCount={commentCount}
        onContinue={handleContinue}
        onChoice={handleChoice}
        onBack={handleBack}
        onRestart={handleRestart}
        onOpenComments={() => setIsCommentModalOpen(true)}
      />
      
      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onOpenChange={handleCommentModalOpenChange}
        storyId={storyId || ''}
        storyPosition={currentStoryPosition}
        currentUser={user}
      />
    </div>
  );
};
