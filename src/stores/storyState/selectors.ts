
import { StorySelector } from '@/types/store/selectors.types';
import { StoryStore } from '@/types';

// Navigation selectors
export const selectCurrentNode: StorySelector<string> = (state) => state.currentNode;
export const selectCurrentPage: StorySelector<number> = (state) => state.currentPage;
export const selectTotalPages: StorySelector<number> = (state) => state.totalPages;
export const selectNodeMappings: StorySelector<any> = (state) => state.nodeMappings;
export const selectCanGoBack: StorySelector<boolean> = (state) => state.canGoBack;
export const selectStoryHistory: StorySelector<string[]> = (state) => state.storyHistory;

// Content selectors
export const selectCurrentText: StorySelector<string> = (state) => state.currentText;
export const selectCurrentChoices: StorySelector<any[]> = (state) => state.currentChoices;
export const selectCanContinue: StorySelector<boolean> = (state) => state.canContinue;
export const selectCurrentStoryPosition: StorySelector<number> = (state) => state.currentStoryPosition;

// Status selectors
export const selectLoading: StorySelector<boolean> = (state) => state.loading;
export const selectSaving: StorySelector<boolean> = (state) => state.saving;
export const selectError: StorySelector<string | null> = (state) => state.error;
export const selectHasUnsavedChanges: StorySelector<boolean> = (state) => state.hasUnsavedChanges;
export const selectCommentCount: StorySelector<number> = (state) => state.commentCount;

// Data selectors
export const selectStoryData: StorySelector<any> = (state) => state.storyData;
export const selectStoryId: StorySelector<string | null> = (state) => state.storyId;
export const selectTitle: StorySelector<string> = (state) => state.title;

// Comment selectors
export const selectComments: StorySelector<any[]> = (state) => state.comments;
export const selectCommentsLoading: StorySelector<boolean> = (state) => state.commentsLoading;
export const selectCommentsError: StorySelector<string | null> = (state) => state.commentsError;

// Compound selectors
export const selectStoryIsReady: StorySelector<boolean> = (state) => 
  !state.loading && state.storyData !== null && !state.error;

// Selector for all story navigation state
export const selectNavigationState: StorySelector<{
  currentPage: number;
  totalPages: number;
  currentNode: string;
  canGoBack: boolean;
}> = (state) => ({
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
}> = (state) => ({
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
}> = (state) => ({
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
}> = (state) => ({
  comments: state.comments,
  commentCount: state.commentCount,
  isLoading: state.commentsLoading,
  error: state.commentsError
});
