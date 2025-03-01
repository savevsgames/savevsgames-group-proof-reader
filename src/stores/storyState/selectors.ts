
import { StoryStore } from '@/types';

// Define strongly-typed selectors for state slices
export const selectCurrentNode = (state: StoryStore) => state.currentNode;
export const selectCurrentPage = (state: StoryStore) => state.currentPage;
export const selectTotalPages = (state: StoryStore) => state.totalPages;
export const selectNodeMappings = (state: StoryStore) => state.nodeMappings;
export const selectCanGoBack = (state: StoryStore) => state.canGoBack;
export const selectStoryHistory = (state: StoryStore) => state.storyHistory;

export const selectCurrentText = (state: StoryStore) => state.currentText;
export const selectCurrentChoices = (state: StoryStore) => state.currentChoices;
export const selectCanContinue = (state: StoryStore) => state.canContinue;
export const selectCurrentStoryPosition = (state: StoryStore) => state.currentStoryPosition;

export const selectLoading = (state: StoryStore) => state.loading;
export const selectSaving = (state: StoryStore) => state.saving;
export const selectError = (state: StoryStore) => state.error;
export const selectHasUnsavedChanges = (state: StoryStore) => state.hasUnsavedChanges;
export const selectCommentCount = (state: StoryStore) => state.commentCount;

export const selectStoryData = (state: StoryStore) => state.storyData;
export const selectStoryId = (state: StoryStore) => state.storyId;
export const selectTitle = (state: StoryStore) => state.title;

export const selectComments = (state: StoryStore) => state.comments;
export const selectCommentsLoading = (state: StoryStore) => state.commentsLoading;
export const selectCommentsError = (state: StoryStore) => state.commentsError;

export const selectStoryIsReady = (state: StoryStore) => 
  !state.loading && state.storyData !== null && !state.error;

// Group selectors for common use cases
export const selectNavigationState = (state: StoryStore) => ({
  currentPage: state.currentPage,
  totalPages: state.totalPages,
  currentNode: state.currentNode,
  canGoBack: state.canGoBack
});

export const selectContentState = (state: StoryStore) => ({
  currentText: state.currentText,
  currentChoices: state.currentChoices,
  canContinue: state.canContinue,
  currentStoryPosition: state.currentStoryPosition
});

export const selectUIState = (state: StoryStore) => ({
  loading: state.loading,
  error: state.error,
  commentCount: state.commentCount
});

export const selectCommentsState = (state: StoryStore) => ({
  comments: state.comments,
  commentCount: state.commentCount,
  isLoading: state.commentsLoading,
  error: state.commentsError
});
