
import { StorySelector, StoryStore } from '@/types';

// Navigation selectors
export const selectCurrentNode: StorySelector<string> = (state: StoryStore) => state.currentNode;
export const selectCurrentPage: StorySelector<number> = (state: StoryStore) => state.currentPage;
export const selectTotalPages: StorySelector<number> = (state: StoryStore) => state.totalPages;
export const selectNodeMappings: StorySelector<any> = (state: StoryStore) => state.nodeMappings;
export const selectCanGoBack: StorySelector<boolean> = (state: StoryStore) => state.canGoBack;
export const selectStoryHistory: StorySelector<string[]> = (state: StoryStore) => state.storyHistory;

// Content selectors
export const selectCurrentText: StorySelector<string> = (state: StoryStore) => state.currentText;
export const selectCurrentChoices: StorySelector<any[]> = (state: StoryStore) => state.currentChoices;
export const selectCanContinue: StorySelector<boolean> = (state: StoryStore) => state.canContinue;
export const selectCurrentStoryPosition: StorySelector<number> = (state: StoryStore) => state.currentStoryPosition;

// Status selectors
export const selectLoading: StorySelector<boolean> = (state: StoryStore) => state.loading;
export const selectSaving: StorySelector<boolean> = (state: StoryStore) => state.saving;
export const selectError: StorySelector<string | null> = (state: StoryStore) => state.error;
export const selectHasUnsavedChanges: StorySelector<boolean> = (state: StoryStore) => state.hasUnsavedChanges;
export const selectCommentCount: StorySelector<number> = (state: StoryStore) => state.commentCount;

// Data selectors
export const selectStoryData: StorySelector<any> = (state: StoryStore) => state.storyData;
export const selectStoryId: StorySelector<string | null> = (state: StoryStore) => state.storyId;
export const selectTitle: StorySelector<string> = (state: StoryStore) => state.title;

// Comment selectors
export const selectComments: StorySelector<any[]> = (state: StoryStore) => state.comments;
export const selectCommentsLoading: StorySelector<boolean> = (state: StoryStore) => state.commentsLoading;
export const selectCommentsError: StorySelector<string | null> = (state: StoryStore) => state.commentsError;

// Compound selectors
export const selectStoryIsReady: StorySelector<boolean> = (state: StoryStore) => 
  !state.loading && state.storyData !== null && !state.error;

// Selector for all story navigation state
export const selectNavigationState: StorySelector<{
  currentPage: number;
  totalPages: number;
  currentNode: string;
  canGoBack: boolean;
}> = (state: StoryStore) => ({
  currentPage: state.currentPage,
  totalPages: state.totalPages,
  currentNode: state.currentNode,
  canGoBack: state.canGoBack
});

// Selector for core content
export const selectContentState: StorySelector<{
  currentText: string;
  currentChoices: any[];
  canContinue: boolean;
  currentStoryPosition: number;
}> = (state: StoryStore) => ({
  currentText: state.currentText,
  currentChoices: state.currentChoices,
  canContinue: state.canContinue,
  currentStoryPosition: state.currentStoryPosition
});

// Selector for UI state
export const selectUIState: StorySelector<{
  loading: boolean;
  error: string | null;
  commentCount: number;
}> = (state: StoryStore) => ({
  loading: state.loading,
  error: state.error,
  commentCount: state.commentCount
});

// Selector for comments state
export const selectCommentsState: StorySelector<{
  comments: any[];
  commentCount: number;
  isLoading: boolean;
  error: string | null;
}> = (state: StoryStore) => ({
  comments: state.comments,
  commentCount: state.commentCount,
  isLoading: state.commentsLoading,
  error: state.commentsError
});
