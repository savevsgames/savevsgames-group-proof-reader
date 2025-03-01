
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
      
      <div className="flex-grow flex flex-col md:flex-row max-w-6xl mx-auto w-full">
        {/* Left side - Story content */}
        <div className="w-full md:w-3/5 flex flex-col">
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
        </div>
        
        {/* Right side - Comments section (always visible on desktop) */}
        <div className="w-full md:w-2/5 hidden md:block border-l border-[#E8DCC4]">
          <div className="h-full bg-white p-4 flex flex-col">
            <h2 className="text-xl font-semibold text-[#3A2618] p-4 border-b">
              Comments ({comments.length})
            </h2>
            
            <div className="flex-grow overflow-auto p-4">
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-[#F9F5EB] p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-[#3A2618]">{comment.author}</span>
                        <span className="text-xs text-[#3A2618]/60">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-[#3A2618]/80">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#3A2618]/60">
                  No comments yet. Be the first to share your thoughts!
                </div>
              )}
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const textarea = e.currentTarget.querySelector('textarea');
              if (textarea && textarea.value.trim()) {
                onAddComment(textarea.value);
                textarea.value = '';
              }
            }} className="border-t p-4">
              <textarea
                placeholder="Write a comment..."
                className="w-full min-h-[100px] p-2 border rounded-md mb-2"
              />
              <button type="submit" className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white py-2 rounded-md">
                Add Comment
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile comments drawer */}
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
