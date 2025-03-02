
import { Story } from 'inkjs';
import { 
  StoryChoice,
  StoryNode,
  CustomStory
} from '@/types';

// Re-export types from our centralized type system
export type {
  StoryChoice,
  StoryNode,
  CustomStory
};

/**
 * Enhanced interface for parsed Ink node content
 * 
 * Represents a processed node from an Ink story after parsing
 */
export interface InkNodeContent {
  /** The main text content of the node */
  text: string;
  
  /** Available choices at this node */
  choices: InkChoice[];
  
  /** Optional reference to the next node (for linear progression) */
  nextNode?: string;
  
  /** Flag indicating if this is an ending node */
  isEnding?: boolean;
  
  /** Additional metadata associated with this node */
  metadata?: Record<string, any>;
}

/**
 * Represents a choice in the Ink format
 */
export interface InkChoice {
  /** The text shown to the user for this choice */
  text: string;
  
  /** The node to navigate to when this choice is selected */
  nextNode: string;
  
  /** 
   * The type of choice:
   * - basic: Standard choice that can only be selected once
   * - sticky: Choice that remains available after selection
   * - gather: A point where narrative branches merge back
   */
  type?: 'basic' | 'sticky' | 'gather';
}

/**
 * Context object for tracking state during parsing
 */
export interface ParsingContext {
  /** The node currently being constructed */
  currentNode: InkNodeContent;
  
  /** Whether we're currently parsing inside a choice */
  inChoice: boolean;
  
  /** The current choice being constructed, if any */
  currentChoice: InkChoice | null;
  
  /** Stack for handling nested choices */
  choiceStack: any[];
  
  /** Index of the current choice being processed */
  choiceIndex?: number;
  
  /** Type of the current choice being processed */
  choiceType?: 'basic' | 'sticky' | 'gather';
  
  /** Buffer for accumulating text content */
  textBuffer: string;
}

// Ink format specific types

/**
 * Represents glue in Ink format (<>)
 * Used to join text fragments without whitespace
 */
export interface InkGlue {
  glue: boolean;
}

/**
 * Represents a content tag in Ink format (#tag)
 */
export interface InkTag {
  tag: string;
}

/**
 * Represents a variable in Ink format
 */
export interface InkVariable {
  name: string;
  value: any;
}

/**
 * Represents a divert in Ink format (->target)
 */
export interface InkDivert {
  /** The target node name */
  target: string;
  
  /** Whether this divert references content in another file */
  isExternal?: boolean;
  
  /** Whether this is a tunnel divert (->->target) */
  isTunnel?: boolean;
  
  /** Whether this divert calls a function */
  isFunction?: boolean;
}

/**
 * Represents a choice marker in Ink format (*, +, -)
 */
export interface InkChoiceMarker {
  /** The marker character used (* for basic, + for sticky, - for gather) */
  marker: '*' | '+' | '-';
  
  /** The nesting level of this choice */
  level: number;
}

/**
 * Represents a choice point in the Ink object model
 */
export interface InkChoicePoint {
  /** The choice metadata */
  choice: InkChoice;
  
  /** The content that appears when this choice is selected */
  content: any[];
}
