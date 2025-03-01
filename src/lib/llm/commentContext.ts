
import { fetchComments } from "@/lib/storyUtils";
import { CommentType, commentTypeLabels } from "@/lib/commentTypes";

// Interface for comment context with proper typing
export interface CommentContextItem {
  type: CommentType;
  text: string;
  username: string;
}

// Load comments for the current page
export const loadComments = async (storyId: string, currentPage: number) => {
  try {
    if (!storyId || !currentPage) return [];
    
    const commentsData = await fetchComments(storyId, currentPage);
    return commentsData;
  } catch (err) {
    console.error("Error loading comments:", err);
    return [];
  }
};

// Format a single comment context item for display
export const formatCommentContextItem = (item: CommentContextItem): string => {
  // Get the proper label from our commentTypeLabels mapping
  const typeLabel = commentTypeLabels[item.type] || item.type;
  return `- ${typeLabel}: "${item.text}" (by ${item.username})`;
};

// Format all comment context items for the prompt
export const formatCommentContext = (commentContext: CommentContextItem[]): string => {
  return commentContext.length > 0
    ? "\nSelected comments for context:\n" + commentContext.map(formatCommentContextItem).join("\n")
    : "";
};

// Format all comments for the page
export const formatPageComments = (comments: any[]): string => {
  return comments.length > 0
    ? "\nReader comments for this page:\n" + comments.map(c => 
        `- ${c.profile?.username || 'Anonymous'} (${c.comment_type || 'general'}): "${c.content || c.text}"`
      ).join("\n")
    : "\nNo reader comments for this page.";
};
