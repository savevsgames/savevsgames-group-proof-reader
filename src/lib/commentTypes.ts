
export type CommentType = 'edit' | 'suggestion' | 'praise' | 'question' | 'issue' | 'spelling';

export const commentTypeColors: Record<CommentType, string> = {
  'edit': '#8B5CF6', // Vivid Purple
  'suggestion': '#F2FCE2', // Soft Green
  'praise': '#FFDA9E', // Soft Yellow
  'question': '#BBD1FF', // Soft Blue
  'issue': '#ea384c', // Red
  'spelling': '#FEC6A1', // Soft Orange
};

export const commentTypeLabels: Record<CommentType, string> = {
  'edit': 'Edit',
  'suggestion': 'Suggestion',
  'praise': 'Praise',
  'question': 'Question',
  'issue': 'Issue',
  'spelling': 'Spelling',
};
