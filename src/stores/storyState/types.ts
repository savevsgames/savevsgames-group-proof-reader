
import { CustomStory } from "@/lib/storyUtils";
import { NodeMappings } from "@/lib/storyNodeMapping";
import { Story } from "inkjs";

// Core story state
export interface StoryState {
  // Basic story metadata
  storyId: string | null;
  story: Story | null;
  storyData: CustomStory | null;
  title: string;
  
  // Navigation and mapping
  nodeMappings: NodeMappings;
  totalPages: number;
  currentPage: number;
  currentNode: string;
  
  // Story content
  currentText: string;
  currentChoices: any[];
  canContinue: boolean;
  
  // Navigation history
  storyHistory: string[];
  canGoBack: boolean;
  
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  commentCount: number;
  currentStoryPosition: number;
  
  // Format
  usingCustomFormat: boolean;
}

// Actions for manipulating story data
export interface StoryActions {
  // Story data actions
  setStoryId: (id: string | null) => void;
  setStoryData: (data: CustomStory | null) => void;
  setInkStory: (story: Story | null) => void;
  setTitle: (title: string) => void;
  
  // Navigation actions
  setCurrentPage: (page: number) => void;
  setCurrentNode: (node: string) => void;
  navigateToNode: (nodeName: string) => void;
  
  // Content actions
  setCurrentText: (text: string) => void;
  setCurrentChoices: (choices: any[]) => void;
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

// Combined store type
export type StoryStore = StoryState & StoryActions;

// Define TabType for StoryTabs component
export type TabType = "json" | "ink" | "reader" | "comments" | "llm";
