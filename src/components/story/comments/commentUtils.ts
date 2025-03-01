
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { commentTypeLabels } from "@/lib/commentTypes";
import { useCallback } from "react";

export const useCommentOperations = (
  storyId: string,
  currentPage: number,
  onCommentsUpdate: (count: number) => void
) => {
  const { toast } = useToast();

  const deleteComment = useCallback(async (commentId: string, userId: string, currentComments: any[]) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Comment Deleted",
        description: "The comment has been successfully deleted.",
      });

      const updatedComments = currentComments.filter(comment => comment.id !== commentId);
      // Move this outside the function to avoid unnecessary updates
      return updatedComments;
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete the comment.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const refreshComments = useCallback(async () => {
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
        throw error;
      }

      // Moved this out from here to avoid extra rerenders
      return data;
    } catch (error) {
      console.error("Error refreshing comments:", error);
      toast({
        title: "Error",
        description: "Failed to refresh comments.",
        variant: "destructive",
      });
      return null;
    }
  }, [storyId, currentPage, toast]);

  return { deleteComment, refreshComments };
};

export const formatCommentForLlm = (comment: any) => {
  const commentType = comment.comment_type || 'general';
  const typeLabel = commentTypeLabels[commentType as keyof typeof commentTypeLabels] || 'Comment';
  const username = comment.profile?.username || 'Anonymous';
  
  return `[${typeLabel} from ${username}]: ${comment.content}`;
};
