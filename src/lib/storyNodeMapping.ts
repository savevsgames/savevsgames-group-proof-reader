
/**
 * Re-export all functionality from the new modular structure
 */

// Export from the main interface
export {
  analyzeStoryStructure,
  validateNodeMappings,
  extractAllNodesFromInkJSON,
  extractCustomStoryFromInkJSON,
  type NodeMappings
} from './storyMapping/index';

// Export from node extraction module
export {
  extractNodes,
  buildNodeGraph,
  findStartNode,
  traverseStory,
  extractNestedNodes,
  extractArrayNodes
} from './storyMapping/nodeExtraction';

// Export from page mapping module
export {
  generatePageMappings
} from './storyMapping/pageMapping';

// Export from ink format handling
export {
  extractCustomStoryFromInkJSON as convertInkJSONToCustomStory
} from './storyMapping/inkFormatHandling';

// Export from utils
export {
  normalizeNodeId,
  getNestedProperty,
  extractTextFromInkNode,
  extractChoicesFromInkNode
} from './storyMapping/utils';

// Import necessary type
import { CustomStory } from "./storyUtils";
import { StoryNode, StoryChoice, StoryNodeContent, InkNodeContent } from "./types/storyTypes";

// Re-export types
export type { StoryNode, StoryChoice, StoryNodeContent, InkNodeContent };
