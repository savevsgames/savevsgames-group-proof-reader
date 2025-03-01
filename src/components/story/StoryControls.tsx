
import React, { useState } from 'react';
import { StoryContinueButton } from './StoryContinueButton';
import { StoryChoices } from './StoryChoices';
import { StoryChoice } from '@/lib/storyUtils';
import { Comment } from '../CommentModal';
import { User } from '@/lib/supabase';
import CommentsView from './CommentsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StoryControlsProps {
  canContinue?: boolean;
  choices?: StoryChoice[];
  isEnding: boolean;
  text?: string;
  comments?: Comment[];
  currentUser: User | null;
  storyId: string;
  currentNode?: string;
  currentPage?: number;
  canGoBack: boolean;
  onContinue?: () => void;
  onChoice?: (index: number) => void;
  onOpenCommentModal: () => void;
  onRestart: () => void;
  onBack: () => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  canContinue,
  choices = [],
  isEnding,
  text = '',
  comments = [],
  currentUser,
  storyId,
  currentNode = 'root',
  currentPage = 1,
  canGoBack,
  onContinue,
  onChoice,
  onOpenCommentModal,
  onRestart,
  onBack
}) => {
  const [commentCount, setCommentCount] = useState(comments.length);
  
  const handleCommentsUpdate = (count: number) => {
    setCommentCount(count);
  };

  if (isEnding || !text) {
    return (
      <div className="w-full bg-white p-4 md:p-6 lg:p-8 min-h-[400px] md:min-h-[600px] rounded-lg md:rounded-none">
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col space-y-4">
            <StoryContinueButton onClick={onRestart} label="Restart Story" />
            <button 
              onClick={onOpenCommentModal}
              className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
            >
              View Comments
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-white p-4 md:p-6 lg:p-8 min-h-[400px] md:min-h-[600px] rounded-lg md:rounded-none">
      <Tabs defaultValue="navigation" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="comments">Comments ({commentCount})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="navigation" className="space-y-4 pt-4">
          <div className="prose prose-lg max-w-none">
            <h3 className="text-xl font-serif">What would you like to do?</h3>

            {canContinue && onContinue ? (
              <StoryContinueButton onClick={onContinue} />
            ) : choices.length > 0 && onChoice ? (
              <StoryChoices choices={choices} onChoice={onChoice} />
            ) : null}
            
            <div className="flex flex-col space-y-2 mt-6">
              {canGoBack && (
                <button 
                  onClick={onBack}
                  className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
                >
                  Go Back
                </button>
              )}
              <button 
                onClick={onRestart}
                className="text-[#3A2618] hover:text-[#F97316] transition-colors text-sm"
              >
                Restart Story
              </button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="comments" className="pt-4">
          <CommentsView 
            storyId={storyId}
            currentNode={currentNode}
            currentPage={currentPage}
            onCommentsUpdate={handleCommentsUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
