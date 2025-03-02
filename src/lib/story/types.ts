
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

// Enhanced interface for parsed Ink node content
export interface InkNodeContent {
  text: string;
  choices: InkChoice[];
  nextNode?: string;
  isEnding?: boolean;
  metadata?: Record<string, any>;
}

export interface InkChoice {
  text: string;
  nextNode: string;
  type?: 'basic' | 'sticky' | 'gather';
}

// Context object to track state during parsing
export interface ParsingContext {
  currentNode: InkNodeContent;
  inChoice: boolean;
  currentChoice: InkChoice | null;
  choiceStack: any[];
  choiceIndex?: number;
  choiceType?: 'basic' | 'sticky' | 'gather';
  textBuffer: string;
}

// New types for enhanced Ink format support
export interface InkGlue {
  glue: boolean;
}

export interface InkTag {
  tag: string;
}

export interface InkVariable {
  name: string;
  value: any;
}

export interface InkDivert {
  target: string;
  isExternal?: boolean;
  isTunnel?: boolean;
  isFunction?: boolean;
}

// Choice-specific Ink types
export interface InkChoiceMarker {
  marker: '*' | '+' | '-';
  level: number;
}

export interface InkChoicePoint {
  choice: InkChoice;
  content: any[];
}
