
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
    return throttledAction('pageChange', () => {
      console.log("[StoryNavigationHandler] Page change request:", page);
      return storeHandlePageChange(page);
    }, {
      errorMessage: 'Failed to change page',
      loadingMessage: `Navigating to page ${page}...`,
      successMessage: `Navigated to page ${page}`
    })();
  }, [storeHandlePageChange, throttledAction]);
  
  const handleNodeChange = useCallback((nodeName: string) => {
    return throttledAction('nodeChange', () => {
      console.log("[StoryNavigationHandler] Node change request:", nodeName);
      return storeHandleNodeChange(nodeName);
    }, {
      errorMessage: 'Failed to change node',
      loadingMessage: `Loading node ${nodeName}...`,
      successMessage: `Node ${nodeName} loaded`
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
      errorMessage: 'Navigation failed',
      loadingMessage: `Navigating ${target}...`,
      successMessage: `Navigation complete`
    })();
  }, [goBack, handleRestart, throttledAction]);
  
  return <>{children({ handlePageChange, handleNodeChange, handleNavigate })}</>;
};

export default StoryNavigationHandler;
