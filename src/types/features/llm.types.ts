
/**
 * LLM INTEGRATION TYPES
 * 
 * This file contains types used for LLM (Large Language Model) integration
 * within the story editing platform.
 */

/**
 * Represents an item in the LLM context derived from a comment.
 */
export interface CommentContextItem {
  /** The category/type of the comment (edit, suggestion, praise, etc.) */
  type: string;
  
  /** The actual text content of the comment */
  text: string;
  
  /** The username of the person who made the comment */
  username: string;
}

/**
 * Settings for the AI model used in content generation.
 */
export interface ModelSettings {
  /** The specific model identifier (e.g., 'gpt-4o', 'gpt-4o-mini') */
  model: string;
  
  /** 
   * Controls randomness in the model's output.
   * Higher values (e.g., 0.8) produce more random outputs
   * Lower values (e.g., 0.2) make output more focused and deterministic
   */
  temperature: number;
}

/**
 * Types of content generation supported by the LLM integration.
 */
export type LlmContentType = "edit_json" | "story_suggestions";

/**
 * Response from the content generation process.
 */
export interface ContentGenerationResponse {
  /** The generated content from the model */
  content: string;
  
  /** The type of content that was generated */
  contentType: LlmContentType;
}

/**
 * Context about the current story position passed to the LLM.
 */
export interface StoryContextProps {
  /** The identifier of the current node in the story */
  currentNodeName: string;
  
  /** The current page number in the story */
  currentPageNumber: number;
  
  /** The text content of the current node */
  nodeText: string;
}
