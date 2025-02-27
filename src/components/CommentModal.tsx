
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export interface Comment {
  id: string;
  storyId: string;
  storyPosition: string; // Story state to track location
  text: string;
  timestamp: Date;
  userId?: string; // For authenticated comments
}

interface CommentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyPosition: string;
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onOpenChange,
  storyId,
  storyPosition,
  comments,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!commentText.trim()) {
      toast({
        title: "Comment cannot be empty",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    onAddComment({
      storyId,
      storyPosition,
      text: commentText,
      userId: undefined, // Will be filled in when authentication is added
    });

    setCommentText('');
    
    toast({
      title: "Comment Added",
      description: "Your comment has been saved successfully.",
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#E8DCC4] text-[#3A2618] border-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#3A2618] font-serif text-xl flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Comments
          </DialogTitle>
          <DialogDescription className="text-[#3A2618]/70 font-serif">
            Leave feedback or notes for the author about this part of the story.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto mb-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-[#3A2618]/60 italic">
              No comments yet. Be the first to leave feedback!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-[#E8DCC4]/50 p-4 rounded-md border border-[#3A2618]/20">
                  <p className="text-[#3A2618] mb-2">{comment.text}</p>
                  <div className="text-[#3A2618]/60 text-sm">
                    {formatDate(comment.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Textarea
            placeholder="Add your comment or feedback here..."
            className="bg-white border-[#3A2618]/20 text-[#3A2618] min-h-[100px]"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            className="bg-[#F97316] hover:bg-[#E86305] text-[#E8DCC4]"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
