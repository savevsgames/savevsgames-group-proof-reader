
import { Story } from 'inkjs';

// Define interfaces for the custom story format
export interface StoryChoice {
  text: string;
  nextNode: string;
}

export interface StoryNode {
  text: string;
  choices: StoryChoice[];
  isEnding?: boolean;
}

export interface CustomStory {
  [key: string]: StoryNode | any;
  inkVersion?: number;
  listDefs?: any;
}

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
