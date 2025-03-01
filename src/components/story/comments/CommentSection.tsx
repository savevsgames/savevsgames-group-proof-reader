
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Comment } from '@/components/comments/types';
import CommentsList from '@/components/comments/CommentsList';
import { User } from '@/lib/supabase';

interface CommentSectionProps {
  user: User | null;
  comments: Comment[];
  onEditComment: (comment: Comment) => void;
  onDeleteComment: (commentId: string) => void;
  onAddToLlmContext?: (text: string) => void;
}

const CommentSection = ({
  user,
  comments,
  onEditComment,
  onDeleteComment,
  onAddToLlmContext
}: CommentSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="book-page-texture rounded-md p-4">
      <h3 className="font-medium text-[#3A2618] mb-4 font-serif">{comments.length} Comments</h3>
      {user ? (
        <CommentsList 
          comments={comments}
          isLoading={false}
          currentUser={user}
          isModerator={false}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onAddToLlmContext={onAddToLlmContext}
        />
      ) : (
        <div className="bg-[#FDF8EC] border border-[#3A2618]/20 p-4 rounded-md mb-6">
          <p className="text-[#3A2618] font-serif mb-2">Sign in to leave comments.</p>
          <Button 
            onClick={() => navigate("/auth")} 
            variant="outline"
            className="bg-[#3A2618] text-[#E8DCC4] hover:bg-[#3A2618]/80"
          >
            Sign in
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
