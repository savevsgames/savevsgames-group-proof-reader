
import React from 'react';
import { commentTypeColors, commentTypeLabels } from '@/lib/commentTypes';

type CommentType = 'edit' | 'suggestion' | 'praise' | 'question' | 'issue' | 'spelling' | 'general';

interface CommentTypeSelectorProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

export const CommentTypeSelector: React.FC<CommentTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  const commentTypes = Object.keys(commentTypeLabels) as CommentType[];
  
  return (
    <div>
      <label className="block text-sm font-medium text-[#3A2618] mb-1">
        Comment Type
      </label>
      <div className="flex flex-wrap gap-2">
        {commentTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedType === type ? 'ring-2 ring-[#3A2618]' : ''
            }`}
            style={{
              backgroundColor: commentTypeColors[type as keyof typeof commentTypeColors] || '#gray-200',
              color: ['suggestion', 'spelling'].includes(type) ? '#3A2618' : 'white',
            }}
            onClick={() => onSelect(type)}
          >
            {commentTypeLabels[type as keyof typeof commentTypeLabels]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentTypeSelector;
