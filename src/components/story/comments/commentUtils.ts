
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { commentTypeLabels } from "@/lib/commentTypes";

export const formatCommentForLlm = (comment: any) => {
  const commentType = comment.comment_type || 'general';
  const typeLabel = commentTypeLabels[commentType as keyof typeof commentTypeLabels] || 'Comment';
  
  return `Comment Type: ${typeLabel}\nUsername: ${comment.profile?.username || 'Anonymous'}\nContent: ${comment.content}`;
};

export const useCommentOperations = (storyId: string, currentPage: number, onCommentsUpdate: (count: number) => void) => {
  const { toast } = useToast();
  
  const deleteComment = async (commentId: string, userId: string, comments: any[]) => {
    if (!userId || !commentId) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);

      if (error) throw error;

      // Remove the deleted comment from the list
      const updatedComments = comments.filter((c) => c.id !== commentId);
      
      // Update the comment count
      onCommentsUpdate(updatedComments.length);
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      
      return updatedComments;
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
      return null;
    }
  };
  
  const refreshComments = async () => {
    if (!storyId || currentPage === undefined) return null;
    
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

      if (error) throw error;

      onCommentsUpdate(data.length);
      
      toast({
        title: "Refreshed",
        description: "Comments have been refreshed",
      });
      
      return data || [];
    } catch (error: any) {
      console.error("Error refreshing comments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to refresh comments",
        variant: "destructive",
      });
      return null;
    }
  };
  
  return { deleteComment, refreshComments };
};
