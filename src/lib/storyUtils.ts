
// This file re-exports all functionality from the modular structure
// for backward compatibility

// Import types from our new centralized type system
import { 
  StoryChoice,
  StoryNode,
  CustomStory,
  NodeMappings,
  Comment,
  CommentType
} from '@/types';

// Re-export types for backward compatibility
export type {
  StoryChoice,
  StoryNode,
  CustomStory,
  NodeMappings,
  Comment,
  CommentType
};

// Re-export all utility functions
export { InkSymbols } from './story/constants';

export {
  parseInkNode,
  processArrayElements,
  tokenParsers
} from './story/inkParser';

export {
  parseFullInkStory,
  extractAllNodesFromInkJSON,
  extractNodesRecursively
} from './story/nodeExtraction';

export {
  generateNodeMappings,
  storyNodeToPageMap,
  pageToStoryNodeMap
} from './story/mappings';

export {
  extractCustomStoryFromInkJSON,
  convertJSONToInk,
  parseInkContent
} from './story/conversion';

export {
  fetchCommentCount,
  fetchComments,
  fetchBookDetails,
  fetchStoryContent
} from './story/dataFetching';
