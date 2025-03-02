
import React, { useCallback } from 'react';
import { useStoryStore } from '@/stores/storyState';
import { useThrottledActions } from '@/hooks/useThrottledActions';
import { CustomStory } from '@/types';

interface StorySaveHandlerProps {
  children: (handlers: {
    handleSave: () => void;
    handleStoryDataChange: (data: CustomStory) => void;
  }) => React.ReactNode;
}

const StorySaveHandler: React.FC<StorySaveHandlerProps> = ({ children }) => {
  const { throttledAction } = useThrottledActions();
  
  const {
    handleSave: storeHandleSave,
    handleStoryDataChange: storeHandleStoryDataChange,
  } = useStoryStore();
  
  const handleSave = useCallback(() => {
    return throttledAction('save', storeHandleSave, {
      delay: 500,
      loadingToastId: 'story-save',
      loadingMessage: 'Saving changes...',
      successMessage: 'Story saved successfully',
      errorMessage: 'Failed to save story'
    })();
  }, [storeHandleSave, throttledAction]);
  
  const handleStoryDataChange = useCallback((data: CustomStory) => {
    return throttledAction('storyDataChange', () => storeHandleStoryDataChange(data), {
      delay: 300,
      errorMessage: 'Failed to update story data'
    })();
  }, [storeHandleStoryDataChange, throttledAction]);
  
  return <>{children({ handleSave, handleStoryDataChange })}</>;
};

export default StorySaveHandler;
