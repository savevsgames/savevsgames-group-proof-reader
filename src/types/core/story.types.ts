
/**
 * CORE STORY DATA STRUCTURES
 * 
 * This file contains the fundamental data structures used to represent story content
 * throughout the application. These types define the shape of story nodes, choices,
 * and the overall story structure.
 */

/**
 * Represents a choice in a story node.
 * 
 * Each choice has text displayed to the reader and a reference to the next node
 * that should be displayed when this choice is selected.
 */
export interface StoryChoice {
  /** The text displayed to the reader for this choice */
  text: string;
  
  /** 
   * The identifier of the node to navigate to when this choice is selected.
   * Must correspond to a key in the CustomStory object.
   */
  nextNode: string;
}

/**
 * Represents a node in the story structure.
 * 
 * A node is a single point in the story containing text content and possible
 * choices for the reader to select. Nodes can be ending points (isEnding=true)
 * and can contain additional metadata.
 */
export interface StoryNode {
  /** The main text content of this node, displayed to the reader */
  text: string;
  
  /** Available choices at this node that allow navigation to other nodes */
  choices: StoryChoice[];
  
  /** 
   * Flag indicating if this is an ending node. 
   * When true, the story concludes at this point.
   */
  isEnding?: boolean;
  
  /** 
   * Additional metadata associated with this node.
   * Can include tags, variables, or custom properties for rendering.
   */
  metadata?: Record<string, any>;
}

/**
 * The custom story format used throughout the application.
 * 
 * A story is represented as a collection of named nodes, with special
 * nodes like 'root' and 'start' serving as entry points. When converted from
 * Ink format, may include additional properties like inkVersion.
 */
export interface CustomStory {
  /** 
   * Collection of nodes indexed by their unique identifiers.
   * Each key is a node identifier, and its value is a StoryNode or metadata.
   */
  [key: string]: StoryNode | any;
  
  /** 
   * The root node where the story begins.
   * Used as the default entry point if 'start' is not present.
   */
  root?: StoryNode;
  
  /** 
   * Alternative starting node.
   * When present, overrides 'root' as the entry point.
   */
  start?: StoryNode;
  
  /** 
   * Ink version identifier.
   * Present only in stories converted from Ink format.
   */
  inkVersion?: number;
  
  /** 
   * List definitions from Ink format.
   * Used for reference when working with Ink content.
   */
  listDefs?: any;
}

/**
 * Maps between node identifiers and page numbers.
 * 
 * Used to support pagination in the story reading interface by
 * providing bidirectional mapping between node IDs and page numbers.
 */
export interface NodeMappings {
  /** Maps from node identifiers to page numbers */
  nodeToPage: Record<string, number>;
  
  /** Maps from page numbers to node identifiers */
  pageToNode: Record<number, string>;
}
