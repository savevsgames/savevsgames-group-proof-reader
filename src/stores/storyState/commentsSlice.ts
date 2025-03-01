
import { StateCreator } from 'zustand';
import { StoryStore } from '@/types';
import { Comment } from '@/types/features/comments.types';
import { supabase } from '@/lib/supabase';

// Slice for comments-related state and actions
export const createCommentsSlice: StateCreator<
  StoryStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  Pick<StoryStore, 'comments' | 'commentsLoading' | 'commentsError' | 'commentCount' | 'fetchComments' | 'addComment' | 'updateComment' | 'deleteComment'>
> = (set, get) => ({
  // Comments state
  comments: [],
  commentsLoading: false,
  commentsError: null,
  commentCount: 0,
  
  // Comments actions
  fetchComments: async (storyId, storyPosition) => {
    if (!storyId || storyPosition <= 0) return;
    
    set({ commentsLoading: true, commentsError: null });
    
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
        console.error("Error fetching comments:", error);
        set({ commentsError: error.message });
      } else {
        // Transform data to include username and avatar for display
        const formattedComments = data?.map(comment => ({
          ...comment,
          user_name: comment.profile?.username || 'Anonymous',
          user_avatar: comment.profile?.avatar_url,
          text: comment.text || comment.content || '' // Handle legacy content field
        })) || [];
        
        set({ 
          comments: formattedComments,
          commentCount: formattedComments.length,
          commentsLoading: false
        });
      }
    } catch (error: any) {
      console.error("Unexpected error fetching comments:", error);
      set({ 
        commentsError: error.message || "Failed to fetch comments", 
        commentsLoading: false 
      });
    }
  },
  
  addComment: async (storyId, storyPosition, text, commentType, userId, currentNode) => {
    if (!userId || !storyId) {
      console.error("Missing required data for adding comment");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          story_id: storyId,
          story_position: storyPosition,
          story_position_old: String(storyPosition), // For backward compatibility
          story_node: currentNode,
          text: text,
          comment_type: commentType,
          user_id: userId
        }])
        .select('*')
        .single();

      if (error) {
        console.error("Error posting comment:", error);
      } else if (data) {
        // Refetch comments to get the updated list with profile data
        get().fetchComments(storyId, storyPosition);
      }
    } catch (error) {
      console.error("Unexpected error posting comment:", error);
    }
  },
  
  updateComment: async (commentId, storyId, storyPosition, text, commentType) => {
    if (!commentId) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          text: text, 
          comment_type: commentType,
          // Don't update story_node or story_position when editing
        })
        .eq('id', commentId)
        .select('*');
  
      if (error) {
        console.error("Error updating comment:", error);
      } else {
        // Refetch comments to get the updated list
        get().fetchComments(storyId, storyPosition);
      }
    } catch (error) {
      console.error("Unexpected error updating comment:", error);
    }
  },
  
  deleteComment: async (commentId, storyId, storyPosition) => {
    if (!commentId) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error("Error deleting comment:", error);
      } else {
        // Refetch comments to get the updated list
        get().fetchComments(storyId, storyPosition);
      }
    } catch (error) {
      console.error("Unexpected error deleting comment:", error);
    }
  },
});
