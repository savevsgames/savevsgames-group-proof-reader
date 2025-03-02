
// We need to ensure this matches the enum in the database
export type CommentType = 'edit' | 'suggestion' | 'praise' | 'question' | 'issue' | 'spelling' | 'general';

export const commentTypeColors: Record<CommentType, string> = {
  'edit': '#8B5CF6', // Vivid Purple
  'suggestion': '#A5FF76', // Soft Green
  'praise': '#fffa72', // Soft Yellow
  'question': '#72e9ff', // Soft Blue
  'issue': '#ea384c', // Red
  'spelling': '#fc71de', // Soft Pink
  'general': '#cccccc', // Gray for general comments
};

export const commentTypeLabels: Record<CommentType, string> = {
  'edit': 'Edit',
  'suggestion': 'Suggestion',
  'praise': 'Praise',
  'question': 'Question',
  'issue': 'Issue',
  'spelling': 'Spelling',
  'general': 'Comment',
};
