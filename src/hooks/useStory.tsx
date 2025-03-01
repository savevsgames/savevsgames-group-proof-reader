
import { useEffect, useState, useCallback } from 'react';
import { useStoryStore } from '@/stores/storyState';
import { supabase } from '@/lib/supabase';

export const useStory = (storyId: string) => {
  // Get data and actions from the store
  const {
    initializeStory,
    loading,
    setCommentCount,
    commentCount,
    handlePageChange, 
    handleNodeChange,
    handleContinue,
    handleChoice,
    goBack,
    handleRestart,
    currentNode,
    currentPage,
    totalPages,
    currentText,
    currentChoices,
    canContinue,
    storyHistory,
    canGoBack,
    error
  } = useStoryStore();
  
  // Local state for comments
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  
  // Initialize story on component mount
  useEffect(() => {
    if (storyId) {
      initializeStory(storyId);
    }
  }, [storyId, initializeStory]);
  
  // Fetch comments when current page changes
  const fetchComments = useCallback(async () => {
    if (!storyId || !currentPage) return;
    
    setCommentsLoading(true);
    setCommentsError(null);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .eq('story_id', storyId)
        .eq('story_position', currentPage)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Format comments to include username and avatar
      const formattedComments = data?.map(comment => ({
        ...comment,
        user_name: comment.profile?.username || 'Anonymous',
        user_avatar: comment.profile?.avatar_url,
        text: comment.text || comment.content || ''
      })) || [];
      
      setComments(formattedComments);
      setCommentCount(formattedComments.length);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      setCommentsError(error.message);
    } finally {
      setCommentsLoading(false);
    }
  }, [storyId, currentPage, setCommentCount]);
  
  // Refetch comments when the page changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments, currentPage]);
  
  // Navigation actions with validation
  const navigateToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
    }
  }, [handlePageChange, totalPages]);
  
  const navigateToNode = useCallback((node: string) => {
    handleNodeChange(node);
  }, [handleNodeChange]);
  
  return {
    // Story data
    storyId,
    currentNode,
    currentPage,
    totalPages,
    currentText,
    currentChoices,
    canContinue,
    loading,
    error,
    
    // Comments
    comments,
    commentCount,
    commentsLoading,
    commentsError,
    
    // Navigation state
    storyHistory,
    canGoBack,
    
    // Actions
    handleContinue,
    handleChoice,
    goBack,
    handleRestart,
    
    // Helper functions
    navigateToPage,
    navigateToNode,
    fetchComments
  };
};
