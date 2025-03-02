
/**
 * TABS FEATURE TYPES
 * 
 * This file contains types related to tabs in the story editor.
 */

/**
 * Define tab types for StoryTabs component
 */
export type TabType = "json" | "ink" | "reader" | "comments" | "llm" | "text-editor";

/**
 * Tab configuration for StoryTabs
 */
export interface TabConfig {
  id: TabType;
  label: string;
  icon?: string;
  disabled?: boolean;
}
