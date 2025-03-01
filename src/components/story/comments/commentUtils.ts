
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useCommentOperations = (
  storyId: string,
  currentPage: number,
  onCommentsUpdate: (count: number) => void
) => {
  const { toast } = useToast();

  // Delete a comment
  const deleteComment = async (commentId: string, userId: string, currentComments: any[]) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });

      // Update local state
      const updatedComments = currentComments.filter(
        (comment) => comment.id !== commentId
      );
      onCommentsUpdate(updatedComments.length);
      return updatedComments;
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
      return null;
    }
  };

  // Refresh comments
  const refreshComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profile:profiles(username)
        `)
        .eq("story_id", storyId)
        .eq("story_position", currentPage)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      onCommentsUpdate(data.length);
      return data;
    } catch (error) {
      console.error("Error refreshing comments:", error);
      toast({
        title: "Error",
        description: "Failed to refresh comments",
        variant: "destructive",
      });
      return null;
    }
  };

  return { deleteComment, refreshComments };
};

// Format a comment to be added to the LLM context
export const formatCommentForLlm = (comment: any) => {
  const commentType = comment.comment_type || 'general';
  const username = comment.profile?.username || 'Anonymous';
  
  return `COMMENT [${commentType.toUpperCase()}] from ${username}: ${comment.content}`;
};
