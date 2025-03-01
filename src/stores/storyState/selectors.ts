
import { StoryState, StoryStore } from './types';

// Navigation selectors
export const selectCurrentNode = (state: StoryState) => state.currentNode;
export const selectCurrentPage = (state: StoryState) => state.currentPage;
export const selectTotalPages = (state: StoryState) => state.totalPages;
export const selectNodeMappings = (state: StoryState) => state.nodeMappings;

// Content selectors
export const selectCurrentText = (state: StoryState) => state.currentText;
export const selectCurrentChoices = (state: StoryState) => state.currentChoices;
export const selectCanContinue = (state: StoryState) => state.canContinue;

// Status selectors
export const selectLoading = (state: StoryState) => state.loading;
export const selectSaving = (state: StoryState) => state.saving;
export const selectError = (state: StoryState) => state.error;
export const selectHasUnsavedChanges = (state: StoryState) => state.hasUnsavedChanges;
export const selectCommentCount = (state: StoryState) => state.commentCount;

// History selectors
export const selectCanGoBack = (state: StoryState) => state.canGoBack;
export const selectStoryHistory = (state: StoryState) => state.storyHistory;

// Data selectors
export const selectStoryData = (state: StoryState) => state.storyData;
export const selectStoryId = (state: StoryState) => state.storyId;
export const selectTitle = (state: StoryState) => state.title;

// Compound selectors
export const selectStoryIsReady = (state: StoryState) => 
  !state.loading && state.storyData !== null && !state.error;
