import React from 'react';
import { MainHeader } from '@/components/MainHeader';
import { useParams } from 'react-router-dom';
import { BookContent } from '@/components/story/BookContent';
import { BookHeader } from '@/components/story/BookHeader';
import { BookFooter } from '@/components/story/BookFooter';
import { CommentSection } from '@/components/story/CommentSection';
import { useStory } from '@/hooks/use-story';

const StoryPage = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const {
    story,
    currentPage,
    totalPages,
    comments,
    isLoading,
    error,
    canGoBack,
    onPageChange,
    onRestart,
    onOpenComments,
    onCloseComments,
    isCommentsOpen,
    onAddComment,
  } = useStory(storyId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
        <MainHeader />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-2xl font-semibold text-[#3A2618]">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
        <MainHeader />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-2xl font-semibold text-[#3A2618]">
            Error: {error || 'Story not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col">
      <MainHeader />
      
      <BookHeader
        bookTitle={story.title}
        currentPage={currentPage}
        totalPages={totalPages}
        canGoBack={canGoBack}
        commentCount={comments.length}
        onBack={onRestart}
        onRestart={onRestart}
        onOpenComments={onOpenComments}
        onPageChange={onPageChange}
      />

      <BookContent story={story} currentPage={currentPage} />

      <BookFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <CommentSection
        isOpen={isCommentsOpen}
        onClose={onCloseComments}
        comments={comments}
        onAddComment={onAddComment}
      />
    </div>
  );
};

export default StoryPage;
