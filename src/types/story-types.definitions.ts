
/**
 * STORY APPLICATION TYPE DEFINITIONS
 * 
 * This file serves as the central repository for all type definitions used
 * throughout the application. When making changes to the codebase,
 * refer to this file to ensure type consistency.
 */

// ----- CORE STORY DATA STRUCTURES -----

/**
 * Represents a choice in a story node.
 */
export interface StoryChoice {
  text: string;
  nextNode: string;
}

/**
 * Represents a node in the story structure.
 */
export interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
  metadata?: Record<string, any>;
}

/**
 * The custom story format used throughout the application.
 */
export interface CustomStory {
  [key: string]: StoryNode | any;
  root?: StoryNode;
  start?: StoryNode;
  inkVersion?: number;
  listDefs?: any;
}

// ----- NAVIGATION & MAPPING STRUCTURES -----

/**
 * Maps between nodes and page numbers.
 */
export interface NodeMappings {
  nodeToPage: Record<string, number>;
  pageToNode: Record<number, string>;
}

/**
 * Core navigation state.
 */
export interface NavigationState {
  currentNode: string;
  currentPage: number;
  totalPages: number;
  canGoBack: boolean;
  storyHistory: string[];
  currentStoryPosition: number;
}

// ----- STORE STATE & ACTIONS -----

/**
 * Core state of the story store.
 */
export interface StoryState {
  // Basic story metadata
  storyId: string | null;
  story: any | null; // InkJS Story instance
  storyData: CustomStory | null;
  title: string;
  
  // Navigation and mapping
  nodeMappings: NodeMappings;
  totalPages: number;
  currentPage: number;
  currentNode: string;
  
  // Story content
  currentText: string;
  currentChoices: StoryChoice[];
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

/**
 * Combined store type.
 */
export type StoryStore = StoryState & StoryActions;

// ----- COMPONENT PROPS TYPES -----

/**
 * Props for the StoryEngine component.
 */
export interface StoryEngineProps {
  storyId: string;
}

/**
 * Props for the BookLayout component.
 */
export interface BookLayoutProps {
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  currentText: string;
  currentNode: string;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  canGoBack: boolean;
  commentCount: number;
  comments: any[]; // Using Comment type from comments module
  currentUser: any; // Using User type from auth module
  storyId: string;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onBack: () => void;
  onRestart: () => void;
  onOpenComments: () => void;
  onPageChange: (pageNumber: number) => void;
}

/**
 * Props for the StoryDisplay component.
 */
export interface StoryDisplayProps {
  text: string;
  storyId?: string;
  currentNode?: string;
  currentPage?: number;
  canContinue: boolean;
  choices: StoryChoice[];
  isEnding: boolean;
  onContinue: () => void;
  onChoice: (index: number) => void;
  onRestart?: () => void;
}

/**
 * Props for the StoryEditorContent component.
 */
export interface StoryEditorContentProps {
  storyId: string;
  storyData: CustomStory;
  currentNode: string;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onStoryDataChange: (data: CustomStory) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
  onSave: () => void;
  onNodeChange: (nodeName: string) => void;
  onNavigate: (target: string) => void;
}

// ----- SELECTOR TYPES -----

/**
 * Type for the UI state selector.
 */
export interface UISelector {
  loading: boolean;
  error: string | null;
}

/**
 * Type for the navigation state selector.
 */
export interface NavigationSelector {
  currentPage: number;
  currentNode: string;
  totalPages: number;
  canGoBack: boolean;
}

/**
 * Type for the content selector.
 */
export interface ContentSelector {
  currentText: string;
  currentChoices: StoryChoice[];
  canContinue: boolean;
}

/**
 * Define tab types for StoryTabs component
 */
export type TabType = "json" | "ink" | "reader" | "comments" | "llm";
