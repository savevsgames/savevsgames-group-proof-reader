
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

// Interface for parsed Ink node content
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
}

// Context object to track state during parsing
export interface ParsingContext {
  currentNode: InkNodeContent;
  inChoice: boolean;
  currentChoice: InkChoice | null;
  choiceStack: any[];
}
