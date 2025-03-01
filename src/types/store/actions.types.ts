
/**
 * STORE ACTIONS TYPES
 * 
 * This file contains types for all the actions that can be performed on the store.
 */

import { CustomStory, StoryChoice } from '../core/story.types';

/**
 * Actions for manipulating story data.
 */
export interface StoryActions {
  // Story data actions
  setStoryId: (id: string | null) => void;
  setStoryData: (data: CustomStory | null) => void;
  setInkStory: (story: any | null) => void;
  setTitle: (title: string) => void;
  
  // Navigation actions
  setCurrentPage: (page: number) => void;
  setCurrentNode: (node: string) => void;
  navigateToNode: (nodeName: string) => void;
  
  // Content actions
  setCurrentText: (text: string) => void;
  setCurrentChoices: (choices: StoryChoice[]) => void;
  setCanContinue: (canContinue: boolean) => void;
  
  // History actions
  addToHistory: (node: string) => void;
  clearHistory: () => void;
  goBack: () => void;
  
  // Status actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setCommentCount: (count: number) => void;
  setCurrentStoryPosition: (position: number) => void;
  
  // Node mapping actions
  updateNodeMappings: () => void;
  
  // Compound actions
  initializeStory: (storyId: string) => Promise<void>;
  handleStoryDataChange: (data: CustomStory) => void;
  handlePageChange: (newPage: number) => Promise<void>;
  handleNodeChange: (nodeName: string) => Promise<void>;
  handleSave: () => Promise<void>;
  handleContinue: () => Promise<void>;
  handleChoice: (index: number) => Promise<void>;
  handleRestart: () => Promise<void>;
}
