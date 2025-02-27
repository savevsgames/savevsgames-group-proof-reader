
export type CommentType = 'edit' | 'suggestion' | 'spelling' | 'error' | 'other';

export const commentTypeColors: Record<CommentType, string> = {
  'edit': '#8B5CF6', // Vivid Purple
  'suggestion': '#F2FCE2', // Soft Green
  'spelling': '#FEC6A1', // Soft Orange
  'error': '#ea384c', // Red
  'other': '#7E69AB', // Secondary Purple
};

export const commentTypeLabels: Record<CommentType, string> = {
  'edit': 'Edit',
  'suggestion': 'Suggestion',
  'spelling': 'Spelling',
  'error': 'Error',
  'other': 'Other',
};
