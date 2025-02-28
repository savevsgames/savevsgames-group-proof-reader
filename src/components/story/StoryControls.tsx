
import React from 'react';
import { Button } from '../ui/button';
import { Comment } from '../CommentModal';
import { User } from '@/lib/supabase';
import { commentTypeColors } from '@/lib/commentTypes';

interface StoryControlsProps {
  isEnding: boolean;
  comments: Comment[];
  currentUser: User | null;
  storyId: string;
  onOpenCommentModal: () => void;
  onRestart: () => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  isEnding,
  comments,
  currentUser,
  storyId,
  onOpenCommentModal,
  onRestart
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if a comment is owned by current user
  const isOwnComment = (comment: Comment) => {
    return currentUser && comment.user_id === currentUser.id;
  };

  // Display either username or "Anonymous" based on ownership and available data
  const getDisplayName = (comment: Comment) => {
    if (isOwnComment(comment)) {
      return "You";
    }
    
    // Return the username from the profile if available, otherwise show "Anonymous"
    return comment.profile?.username || "Anonymous";
  };

  return (
    <div className="w-full md:w-1/2 bg-[#E8DCC4] p-4 md:p-6 lg:p-10 min-h-[300px] md:min-h-[600px] flex flex-col book-page border-t md:border-t-0 border-[#3A2618]/20">
      {/* Comments Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-[#3A2618] font-serif text-xl mb-4">Comments</h3>
        
        <div className="flex-1 overflow-y-auto pr-2 mb-4 max-h-[250px] md:max-h-none">
          {comments.length === 0 ? (
            <div className="text-center py-4 md:py-8 text-[#3A2618]/60 italic">
              No comments yet for this page.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="p-3 md:p-4 rounded-md border border-[#3A2618]/20 relative"
                  style={{ backgroundColor: `${commentTypeColors[comment.comment_type]}20` }}
                >
                  <div 
                    className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                    style={{ 
                      backgroundColor: commentTypeColors[comment.comment_type],
                      color: ['suggestion', 'spelling'].includes(comment.comment_type) ? '#3A2618' : 'white'
                    }}
                  >
                    {comment.comment_type.charAt(0).toUpperCase() + comment.comment_type.slice(1)}
                  </div>
                  
                  <p className="text-[#3A2618] mb-2 text-sm md:text-base">{comment.text}</p>
                  
                  <div className="flex justify-between items-center text-[#3A2618]/60 text-xs">
                    <span>{getDisplayName(comment)}</span>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <Button 
            onClick={onOpenCommentModal}
            className="w-full bg-[#F97316] text-[#E8DCC4] hover:bg-[#E86305] transition-colors"
          >
            Add Comment
          </Button>
        </div>
      </div>
      
      {/* Story Ending */}
      {isEnding && (
        <div className="text-center mt-6 md:mt-8">
          <p className="text-[#3A2618] font-serif mb-4 md:mb-6">The story has ended.</p>
          <button
            onClick={onRestart}
            className="px-4 md:px-6 py-2 md:py-3 bg-[#F97316] text-[#E8DCC4] font-serif rounded hover:bg-[#E86305] transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};
