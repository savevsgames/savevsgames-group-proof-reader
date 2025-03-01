import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, X, ShieldCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CommentType, commentTypeColors, commentTypeLabels } from "@/lib/commentTypes";
import { User } from "@/lib/supabase";
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  story_position: number;
  text: string;
  comment_type: CommentType;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
}

interface CommentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyPosition: number;
  currentUser: User | null;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onOpenChange,
  storyId,
  storyPosition,
  currentUser,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCommentType, setSelectedCommentType] = useState<CommentType>('edit');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkModerator = async () => {
      if (!currentUser) {
        setIsModerator(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('comment_moderators')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking moderator status:', error);
          setIsModerator(false);
          return;
        }
        
        setIsModerator(data !== null);
      } catch (error) {
        console.error('Exception checking moderator status:', error);
        setIsModerator(false);
      }
    };
    
    checkModerator();
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && storyId && storyPosition) {
      fetchComments();
      
      const storedEditingComment = sessionStorage.getItem('editingComment');
      if (storedEditingComment) {
        const parsedComment = JSON.parse(storedEditingComment);
        setEditingComment(parsedComment);
        setCommentText(parsedComment.text);
        setSelectedCommentType(parsedComment.comment_type);
        
        sessionStorage.removeItem('editingComment');
      }
    }
  }, [isOpen, storyId, storyPosition]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .eq('story_id', storyId)
        .eq('story_position', storyPosition)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Failed to load comments",
        description: "There was an error loading the comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      toast({
        title: "Comment cannot be empty",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add comments.",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingComment) {
        let query = supabase
          .from('comments')
          .update({ 
            text: commentText,
            comment_type: selectedCommentType
          })
          .eq('id', editingComment.id);
          
        if (!isModerator) {
          query = query.eq('user_id', currentUser.id);
        }
        
        const { error } = await query;

        if (error) throw error;

        toast({
          title: "Comment Updated",
          description: "The comment has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('comments')
          .insert({
            user_id: currentUser.id,
            story_id: storyId,
            story_position: storyPosition,
            text: commentText,
            comment_type: selectedCommentType
          });

        if (error) throw error;

        toast({
          title: "Comment Added",
          description: "Your comment has been saved successfully.",
        });
      }

      setCommentText('');
      setSelectedCommentType('edit');
      setEditingComment(null);
      fetchComments();
      
      setTimeout(() => {
        onOpenChange(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save comment. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
    setSelectedCommentType('edit');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnComment = (comment: Comment) => {
    return currentUser && comment.user_id === currentUser.id;
  };

  const getDisplayName = (comment: Comment) => {
    if (isOwnComment(comment)) {
      return "You";
    }
    
    return comment.profile?.username || "Anonymous";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setEditingComment(null);
        setCommentText('');
        setSelectedCommentType('edit');
      }
    }}>
      <DialogContent className="bg-[#E8DCC4] text-[#3A2618] border-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#3A2618] font-serif text-xl flex items-center">
            <div className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              {editingComment ? "Edit Comment" : "Add Comment"}
              
              {isModerator && (
                <div className="flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full ml-2">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Moderator
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-[#3A2618]/70 font-serif">
            {editingComment 
              ? (isOwnComment(editingComment) 
                  ? "Edit your comment below" 
                  : "Edit this comment (moderator mode)")
              : "Leave feedback or notes for the author about this part of the story."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && !editingComment && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A2618] mx-auto"></div>
            <p className="mt-2 text-[#3A2618]/70">Loading comments...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {!editingComment && (
              <div className="max-h-[300px] overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-[#3A2618]/60 italic">
                    No comments yet. Be the first to leave feedback!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className="p-4 rounded-md border border-[#3A2618]/20 relative"
                        style={{ backgroundColor: `${commentTypeColors[comment.comment_type]}20` }}
                      >
                        <div className="flex items-center mb-3">
                          <Avatar className="h-8 w-8 mr-2">
                            {comment.profile?.avatar_url ? (
                              <AvatarImage src={comment.profile.avatar_url} alt={getDisplayName(comment)} />
                            ) : (
                              <AvatarFallback className="bg-[#F97316]/10 text-[#F97316] text-xs">
                                {comment.profile?.username ? 
                                  comment.profile.username.substring(0, 2).toUpperCase() : 
                                  "AN"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm font-medium text-[#3A2618]">
                            {getDisplayName(comment)}
                          </span>
                        </div>
                        
                        <div 
                          className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                          style={{ 
                            backgroundColor: commentTypeColors[comment.comment_type],
                            color: ['suggestion', 'spelling'].includes(comment.comment_type) ? '#3A2618' : 'white'
                          }}
                        >
                          {commentTypeLabels[comment.comment_type]}
                        </div>
                        
                        <p className="text-[#3A2618] mb-2">{comment.text}</p>
                        
                        <div className="flex justify-end text-[#3A2618]/60 text-xs">
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {(!currentUser && !editingComment) ? (
              <div className="bg-[#3A2618]/10 p-4 rounded-md text-center">
                <p className="text-[#3A2618] mb-2">Please sign in to add comments</p>
                <Button 
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/auth');
                  }}
                  className="bg-[#F97316] hover:bg-[#E86305] text-[#E8DCC4]"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3A2618] mb-1">
                    Comment Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(commentTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedCommentType(type as CommentType)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCommentType === type ? 'ring-2 ring-[#3A2618]' : ''
                        }`}
                        style={{ 
                          backgroundColor: commentTypeColors[type as CommentType],
                          color: ['suggestion', 'spelling'].includes(type as CommentType) ? '#3A2618' : 'white'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#3A2618] mb-1">
                    {editingComment ? "Edit Comment" : "Your Comment"}
                  </label>
                  <Textarea
                    placeholder="Add your comment or feedback here..."
                    className="bg-white border-[#3A2618]/20 text-[#3A2618] min-h-[100px]"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>

                <DialogFooter className="flex sm:justify-between">
                  {editingComment && (
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      className="border-[#3A2618]/20 text-[#3A2618]"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-[#F97316] hover:bg-[#E86305] text-[#E8DCC4] ml-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {editingComment ? "Save Changes" : "Submit Comment"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
