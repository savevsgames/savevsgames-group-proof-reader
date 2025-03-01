
import { StoryState, StoryStore } from '@/types/story-types.definitions';

// Navigation selectors
export const selectCurrentNode = (state: StoryStore) => state.currentNode;
export const selectCurrentPage = (state: StoryStore) => state.currentPage;
export const selectTotalPages = (state: StoryStore) => state.totalPages;
export const selectNodeMappings = (state: StoryStore) => state.nodeMappings;

// Content selectors
export const selectCurrentText = (state: StoryStore) => state.currentText;
export const selectCurrentChoices = (state: StoryStore) => state.currentChoices;
export const selectCanContinue = (state: StoryStore) => state.canContinue;

// Status selectors
export const selectLoading = (state: StoryStore) => state.loading;
export const selectSaving = (state: StoryStore) => state.saving;
export const selectError = (state: StoryStore) => state.error;
export const selectHasUnsavedChanges = (state: StoryStore) => state.hasUnsavedChanges;
export const selectCommentCount = (state: StoryStore) => state.commentCount;

// History selectors
export const selectCanGoBack = (state: StoryStore) => state.canGoBack;
export const selectStoryHistory = (state: StoryStore) => state.storyHistory;

// Data selectors
export const selectStoryData = (state: StoryStore) => state.storyData;
export const selectStoryId = (state: StoryStore) => state.storyId;
export const selectTitle = (state: StoryStore) => state.title;

// Compound selectors
export const selectStoryIsReady = (state: StoryStore) => 
  !state.loading && state.storyData !== null && !state.error;

// Selector for all story navigation state
export const selectStoryNavigation = (state: StoryStore) => ({
  currentPage: state.currentPage,
  totalPages: state.totalPages,
  currentNode: state.currentNode
});

// Selector for core content
export const selectStoryContent = (state: StoryStore) => ({
  currentText: state.currentText,
  currentChoices: state.currentChoices,
  canContinue: state.canContinue,
  canGoBack: state.canGoBack
});

// Selector for UI state
export const selectUiState = (state: StoryStore) => ({
  loading: state.loading,
  error: state.error,
  commentCount: state.commentCount
});
