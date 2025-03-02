
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface ThrottledActionOptions {
  delay?: number;
  errorMessage?: string;
  loadingToastId?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorToastId?: string;
}

export const useThrottledActions = () => {
  const lastActionTimestamp = useRef<Record<string, number>>({});
  
  const throttledAction = useCallback(<T extends (...args: any[]) => any>(
    actionKey: string,
    action: T,
    options: ThrottledActionOptions = {}
  ) => {
    const {
      delay = 300,
      errorMessage = 'Action failed',
      loadingToastId,
      loadingMessage,
      successMessage,
      errorToastId = loadingToastId
    } = options;
    
    return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      const now = Date.now();
      
      // Check if we need to throttle
      if (
        lastActionTimestamp.current[actionKey] && 
        now - lastActionTimestamp.current[actionKey] < delay
      ) {
        console.log(`[Throttle] Throttling action "${actionKey}"`);
        return undefined;
      }
      
      // Update timestamp
      lastActionTimestamp.current[actionKey] = now;
      
      try {
        // Show loading toast if provided
        if (loadingToastId && loadingMessage) {
          toast.loading(loadingMessage, { id: loadingToastId });
        }
        
        // Perform the action
        const result = await action(...args);
        
        // Show success toast if provided
        if (successMessage) {
          if (loadingToastId) {
            toast.success(successMessage, { id: loadingToastId });
          } else {
            toast.success(successMessage);
          }
        }
        
        return result as ReturnType<T>;
      } catch (err: any) {
        console.error(`[Throttle] Error in action "${actionKey}":`, err);
        
        // Show error toast
        if (errorToastId) {
          toast.error(errorMessage, { id: errorToastId });
        } else {
          toast.error(errorMessage);
        }
        
        return undefined;
      }
    };
  }, []);
  
  return { throttledAction };
};
