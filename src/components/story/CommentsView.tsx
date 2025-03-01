
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { User } from '@/lib/supabase';
import { Comment } from '../comments/types';
import CommentsList from '../comments/CommentsList';
import CommentTypeSelector from "../comments/CommentTypeSelector";
import { CommentType, commentTypeLabels } from '@/lib/commentTypes';
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentsViewProps {
  storyId: string;
  currentNode: string;
  currentPage: number;
  onCommentsUpdate: (count: number) => void;
  onAddToLlmContext?: (text: string) => void;
}

const CommentsView = ({ storyId, currentNode, currentPage, onCommentsUpdate, onAddToLlmContext }: CommentsViewProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { bookId } = useParams();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Fixed the query - using story_position instead of node
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profile:profiles(username)
          `)
          .eq('story_id', storyId)
          .eq('story_position', currentPage)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching comments:", error);
        } else {
          setComments(data || []);
          onCommentsUpdate(data ? data.length : 0);
        }
      } catch (error) {
        console.error("Unexpected error fetching comments:", error);
      }
    };

    if (storyId && currentPage) {
      fetchComments();
    }
  }, [storyId, currentPage, onCommentsUpdate]);

  const postComment = async (text: string, type: CommentType) => {
    if (!user) {
      console.error("User not logged in.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          story_id: storyId,
          story_position: currentPage,
          story_node: currentNode, // Added story_node as reference
          text: text,
          comment_type: type,
          user_id: user.id,
          user_name: user.username || 'Anonymous',
          user_avatar: user.avatar_url
        }])
        .select('*')
        .single();

      if (error) {
        console.error("Error posting comment:", error);
      } else if (data) {
        setComments(prevComments => [data, ...prevComments]);
        setCommentText('');
        onCommentsUpdate(comments.length + 1);
      }
    } catch (error) {
      console.error("Unexpected error posting comment:", error);
    }
  };

  const updateComment = async (commentId: string, text: string, type: CommentType) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ text: text, comment_type: type })
        .eq('id', commentId)
        .select('*')
        .single();
  
      if (error) {
        console.error("Error updating comment:", error);
      } else if (data) {
        setComments(prevComments =>
          prevComments.map(comment => (comment.id === commentId ? data : comment))
        );
        setCommentText('');
        setIsEditing(false);
        setEditingCommentId(null);
      }
    } catch (error) {
      console.error("Unexpected error updating comment:", error);
    }
  };
  

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error("Error deleting comment:", error);
      } else {
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        onCommentsUpdate(comments.length - 1);
      }
    } catch (error) {
      console.error("Unexpected error deleting comment:", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isEditing && editingCommentId) {
      await updateComment(editingCommentId, commentText, commentType);
    } else {
      await postComment(commentText, commentType);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setIsEditing(true);
    setEditingCommentId(comment.id);
    setCommentText(comment.text);
    setCommentType(comment.comment_type as CommentType || 'general');
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const handleAddToLlmContext = (text: string) => {
    if (onAddToLlmContext) {
      onAddToLlmContext(text);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-serif mb-6 text-[#3A2618]">Reader Comments</h2>
      
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="book-page-texture rounded-md p-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts, feedback, or questions about this page..."
              className="min-h-[100px] bg-[#FDF8EC] border-[#3A2618]/30 text-[#3A2618] font-serif"
            />
            <div className="mt-4">
              <CommentTypeSelector
                selectedCommentType={commentType}
                setSelectedCommentType={(type) => setCommentType(type as CommentType)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2">
            {isEditing && (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditingCommentId(null);
                  setCommentText("");
                  setCommentType("general");
                }}
                variant="outline"
                className="bg-[#FDF8EC] text-[#3A2618] border-[#3A2618]/30"
              >
                Cancel
              </Button>
            )}
            
            <Button 
              type="submit" 
              className="bg-[#3A2618] text-[#E8DCC4] hover:bg-[#3A2618]/80"
            >
              <Send className="mr-2 h-4 w-4" />
              {isEditing ? "Update Comment" : "Post Comment"}
            </Button>
          </div>
        </form>
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
      
      <ScrollArea className="flex-1 book-page-texture rounded-md p-4">
        <h3 className="font-medium text-[#3A2618] mb-4 font-serif">{comments.length} Comments</h3>
        <CommentsList 
          comments={comments}
          isLoading={false}
          currentUser={user}
          isModerator={false}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onAddToLlmContext={onAddToLlmContext}
        />
      </ScrollArea>
    </div>
  );
};

export default CommentsView;
