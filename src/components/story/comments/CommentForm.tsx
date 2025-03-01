
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import CommentTypeSelector from "@/components/comments/CommentTypeSelector";
import { CommentType } from "@/lib/commentTypes";
import { Comment, CommentFormProps } from "@/components/comments/types";

const CommentForm: React.FC<CommentFormProps> = ({
  storyId,
  currentNode,
  currentPage,
  onCommentAdded,
}) => {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCommentType, setSelectedCommentType] = useState<CommentType>("edit");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !storyId) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("comments").insert({
        text: newComment.trim(),
        user_id: user.id,
        story_id: storyId,
        story_position: currentPage,
        story_node: currentNode,
        comment_type: selectedCommentType,
      }).select(`
        *,
        profile:profiles(username)
      `);

      if (error) throw error;

      if (data && data[0]) {
        onCommentAdded(data[0] as Comment);
        setNewComment("");
        
        toast({
          title: "Success",
          description: "Your comment has been added!",
        });
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <CommentTypeSelector
        selectedCommentType={selectedCommentType}
        setSelectedCommentType={setSelectedCommentType}
      />
      
      <Textarea
        placeholder="Add your comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="min-h-[100px]"
      />
      
      <Button
        onClick={handleSubmitComment}
        disabled={!newComment.trim() || submitting}
        className="w-full"
      >
        {submitting ? "Submitting..." : "Add Comment"}
      </Button>
    </div>
  );
};

export default CommentForm;
