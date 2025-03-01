
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, X } from 'lucide-react';
import CommentTypeSelector from './CommentTypeSelector';
import { CommentType } from '@/lib/commentTypes';
import { Comment } from './types';
import { DialogFooter } from "@/components/ui/dialog";

interface CommentFormProps {
  commentText: string;
  setCommentText: (text: string) => void;
  selectedCommentType: CommentType;
  setSelectedCommentType: (type: CommentType) => void;
  handleSubmit: () => void;
  isLoading: boolean;
  editingComment: Comment | null;
  cancelEdit: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  commentText,
  setCommentText,
  selectedCommentType,
  setSelectedCommentType,
  handleSubmit,
  isLoading,
  editingComment,
  cancelEdit,
}) => {
  return (
    <div className="space-y-4">
      <CommentTypeSelector 
        selectedCommentType={selectedCommentType}
        setSelectedCommentType={setSelectedCommentType}
      />
      
      <div>
        <label className="block text-sm font-medium text-[#3A2618] mb-1">
          {editingComment ? "Edit Comment" : "Your Comment"}
        </label>
        <Textarea
          placeholder="Add your comment or feedback here..."
          className="bg-white border-[#3A2618]/20 text-[#3A2618] min-h-[100px]"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
      </div>

      <DialogFooter className="flex sm:justify-between">
        {editingComment && (
          <Button
            variant="outline"
            onClick={cancelEdit}
            className="border-[#3A2618]/20 text-[#3A2618]"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-[#F97316] hover:bg-[#E86305] text-[#E8DCC4] ml-auto"
        >
          <Send className="mr-2 h-4 w-4" />
          {editingComment ? "Save Changes" : "Submit Comment"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default CommentForm;
