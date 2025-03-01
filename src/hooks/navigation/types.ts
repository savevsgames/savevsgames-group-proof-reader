import { Story } from "inkjs";
import { CustomStory } from "@/lib/storyUtils";
import { NodeMappings } from "@/lib/storyNodeMapping";

export interface NavigationState {
  currentNode: string;
  currentPage: number;
  currentText: string;
  currentChoices: any[];
  canContinue: boolean;
  canGoBack: boolean;
  commentCount: number;
  currentStoryPosition: number;
  storyHistory: string[];
}

export interface NavigationActions {
  handleContinue: () => Promise<void>;
  handleChoice: (index: number) => Promise<void>;
  handleBack: () => Promise<void>;
  handleRestart: () => Promise<void>;
  handlePageChange: (newPage: number) => Promise<void>;
  updateCommentCount: () => Promise<void>;
}

export interface UseStoryNavigationProps {
  storyData: CustomStory | null;
  story: Story | null;
  usingCustomFormat: boolean;
  storyId: string | undefined;
  nodeMappings: NodeMappings;
  totalPages: number;
}

export type NavigationReturn = [NavigationState, NavigationActions];
