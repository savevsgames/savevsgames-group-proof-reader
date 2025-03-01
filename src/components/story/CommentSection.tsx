
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

interface CommentSectionProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (text: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#3A2618]">Comments</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
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
        
        <form onSubmit={handleSubmit} className="border-t p-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[100px] mb-2"
          />
          <Button type="submit" className="w-full bg-[#F97316] hover:bg-[#F97316]/90">
            Add Comment
          </Button>
        </form>
      </div>
    </div>
  );
};
