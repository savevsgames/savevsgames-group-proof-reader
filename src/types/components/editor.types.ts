
/**
 * EDITOR COMPONENT TYPES
 * 
 * This file contains types related to story editor components.
 */

import { CustomStory } from '../core/story.types';

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
