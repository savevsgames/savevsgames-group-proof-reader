
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Comment } from '@/components/comments/types';
import { User } from '@/lib/supabase';

export const useComments = (
  storyId: string,
  currentPage: number,
  onCommentsUpdate: (count: number) => void
) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<string>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      if (!storyId || !currentPage) return;
      
      try {
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

    fetchComments();
  }, [storyId, currentPage, onCommentsUpdate]);

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

  const handleEditComment = (comment: Comment) => {
    setIsEditing(true);
    setEditingCommentId(comment.id);
    setCommentText(comment.text);
    setCommentType(comment.comment_type || 'general');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCommentId(null);
    setCommentText("");
    setCommentType("general");
  };

  return {
    comments,
    commentText,
    commentType,
    isEditing,
    editingCommentId,
    user,
    setCommentText,
    setCommentType,
    handleEditComment,
    handleCancelEdit,
    deleteComment,
    setComments
  };
};
