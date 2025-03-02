import React from "react";
import {
  CommentType,
  commentTypeColors,
  commentTypeLabels,
} from "@/lib/commentTypes";

interface CommentTypeSelectorProps {
  selectedCommentType: CommentType;
  setSelectedCommentType: (type: CommentType) => void;
}

const CommentTypeSelector: React.FC<CommentTypeSelectorProps> = ({
  selectedCommentType,
  setSelectedCommentType,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3A2618] mb-1">
        Comment Type
      </label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(commentTypeLabels).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedCommentType(type as CommentType)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCommentType === type ? "ring-2 ring-[#3A2618]" : ""
            }`}
            style={{
              fontWeight: selectedCommentType === type ? "bold" : "normal",
              backgroundColor: commentTypeColors[type as CommentType],
              color: [
                "suggestion",
                "spelling",
                "praise",
                "general",
                "question",
              ].includes(type as CommentType)
                ? "#3A2618"
                : "white",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentTypeSelector;
