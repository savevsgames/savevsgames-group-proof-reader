
/**
 * STORY INK SYMBOLS
 * 
 * Constants defining the symbols and markers used in Ink script parsing
 * These are used throughout the parser to identify different elements
 */

// Definition of Ink symbols for parsing
export const InkSymbols = {
  /** Prefix for text content (^) */
  TEXT: '^',
  
  /** Symbol for navigation/divert (->target) */
  NAVIGATION: '->',
  
  /** Marker for starting evaluation section */
  EVAL_START: 'ev',
  
  /** Marker for ending evaluation section */
  EVAL_END: '/ev',
  
  /** Marker for starting string */
  STRING_START: 'str',
  
  /** Marker for ending string */
  STRING_END: '/str',
  
  /** Marker for story end */
  END: 'end',
  
  /** Marker for segment completion */
  DONE: 'done',
  
  /** New line character */
  NEW_LINE: '\n',
  
  /** Glue symbol for joining text without spaces (<>) */
  GLUE: '<>',
  
  /** Marker for basic choice that disappears after selection (*) */
  CHOICE_BASIC: '*',
  
  /** Marker for sticky choice that remains after selection (+) */
  CHOICE_STICKY: '+',
  
  /** Marker for gather points where narrative branches converge (-) */
  CHOICE_GATHER: '-'
};
