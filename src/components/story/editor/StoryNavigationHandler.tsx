
import React, { useCallback } from 'react';
import { useStoryStore } from '@/stores/storyState';
import { useThrottledActions } from '@/hooks/useThrottledActions';

interface StoryNavigationHandlerProps {
  children: (handlers: {
    handlePageChange: (page: number) => void;
    handleNodeChange: (nodeName: string) => void;
    handleNavigate: (target: string) => void;
  }) => React.ReactNode;
}

const StoryNavigationHandler: React.FC<StoryNavigationHandlerProps> = ({ children }) => {
  const { throttledAction } = useThrottledActions();
  
  const {
    handlePageChange: storeHandlePageChange,
    handleNodeChange: storeHandleNodeChange,
    goBack,
    handleRestart
  } = useStoryStore();
  
  const handlePageChange = useCallback((page: number) => {
    return throttledAction('pageChange', () => storeHandlePageChange(page), {
      errorMessage: 'Failed to change page'
    })();
  }, [storeHandlePageChange, throttledAction]);
  
  const handleNodeChange = useCallback((nodeName: string) => {
    return throttledAction('nodeChange', () => storeHandleNodeChange(nodeName), {
      errorMessage: 'Failed to change node'
    })();
  }, [storeHandleNodeChange, throttledAction]);
  
  const handleNavigate = useCallback((target: string) => {
    return throttledAction('navigate', () => {
      console.log("[StoryNavigationHandler] Navigation request:", target);
      
      if (target === 'back' && useStoryStore.getState().canGoBack) {
        return goBack();
      } else if (target === 'restart') {
        return handleRestart();
      }
      return Promise.resolve();
    }, {
      errorMessage: 'Navigation failed'
    })();
  }, [goBack, handleRestart, throttledAction]);
  
  return <>{children({ handlePageChange, handleNodeChange, handleNavigate })}</>;
};

export default StoryNavigationHandler;
