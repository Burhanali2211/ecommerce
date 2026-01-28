import { useState, useEffect, useCallback } from 'react';
import { globalOfflineQueue } from '../utils/networkResilience';

interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  queueLength: number;
  sync: () => Promise<void>;
}

/**
 * Hook to manage offline status and provide sync capabilities
 */
export const useOfflineStatus = (): OfflineStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queueLength, setQueueLength] = useState<number>(0);

  // Update queue length
  const updateQueueLength = useCallback(() => {
    const status = globalOfflineQueue.getQueueStatus();
    setQueueLength(status.queueLength);
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial queue length
    updateQueueLength();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateQueueLength]);

  // Update queue length periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateQueueLength();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateQueueLength]);

  // Manual sync function
  const sync = useCallback(async () => {
    try {
      await globalOfflineQueue.sync();
      updateQueueLength();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [updateQueueLength]);

  return {
    isOnline,
    isOffline: !isOnline,
    queueLength,
    sync
  };
};