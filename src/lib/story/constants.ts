
/**
 * STORY INK SYMBOLS
 * 
 * Constants defining the symbols and markers used in Ink script parsing.
 * These are used throughout the parser to identify different elements of the story structure.
 */

// Definition of Ink symbols for parsing
export const InkSymbols = {
  /** Prefix for text content (^) - In Ink's JSON format, text content is prefixed with ^ */
  TEXT: '^',
  
  /** Symbol for navigation/divert (->target) - Used to direct story flow to another node */
  NAVIGATION: '->',
  
  /** Marker for starting evaluation section - Indicates the beginning of a code block */
  EVAL_START: 'ev',
  
  /** Marker for ending evaluation section - Indicates the end of a code block */
  EVAL_END: '/ev',
  
  /** Marker for starting string - Denotes the beginning of a string literal */
  STRING_START: 'str',
  
  /** Marker for ending string - Denotes the end of a string literal */
  STRING_END: '/str',
  
  /** Marker for story end - Indicates a terminal node in the story */
  END: 'end',
  
  /** Marker for segment completion - Signals the end of a processing block */
  DONE: 'done',
  
  /** New line character - Used for text formatting */
  NEW_LINE: '\n',
  
  /** 
   * Glue symbol for joining text without spaces (<>) 
   * In Ink, glue allows text fragments to be joined without inserting whitespace
   */
  GLUE: '<>',
  
  /** 
   * Marker for basic choice that disappears after selection (*) 
   * In Ink source format, * indicates a standard choice that can only be selected once
   */
  CHOICE_BASIC: '*',
  
  /** 
   * Marker for sticky choice that remains after selection (+) 
   * In Ink source format, + indicates a choice that remains available after selection
   */
  CHOICE_STICKY: '+',
  
  /** 
   * Marker for gather points where narrative branches converge (-) 
   * In Ink source format, - indicates a point where different story paths merge
   */
  CHOICE_GATHER: '-'
};
