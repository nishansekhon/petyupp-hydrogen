import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (navigator.onLine) {
      syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueRequest = (endpoint, data, method = 'POST') => {
    const queue = getQueue();
    const newItem = {
      id: Date.now(),
      endpoint,
      data,
      method,
      timestamp: new Date().toISOString()
    };
    queue.push(newItem);
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
    
    // Try immediate sync if online
    if (navigator.onLine) {
      syncQueue();
    }
    
    return newItem.id;
  };

  const getQueue = () => {
    try {
      const stored = localStorage.getItem('offlineQueue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const syncQueue = async () => {
    const queue = getQueue();
    
    if (queue.length === 0) {
      return;
    }

    setSyncStatus('syncing');
    const backendUrl = API_BASE_URL;
    let syncedCount = 0;
    const failedItems = [];

    for (const item of queue) {
      try {
        const token = localStorage.getItem('agentToken');
        const response = await fetch(`${backendUrl}${item.endpoint}`, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          syncedCount++;
        } else {
          failedItems.push(item);
        }
      } catch (error) {
        console.error('Sync failed for item:', item, error);
        failedItems.push(item);
      }
    }

    // Update queue with failed items
    localStorage.setItem('offlineQueue', JSON.stringify(failedItems));

    if (failedItems.length === 0) {
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
      setSyncStatus('error');
    }

    return { synced: syncedCount, failed: failedItems.length };
  };

  const clearQueue = () => {
    localStorage.removeItem('offlineQueue');
    setSyncStatus('idle');
  };

  return {
    isOnline,
    syncStatus,
    queueRequest,
    syncQueue,
    clearQueue,
    queueSize: getQueue().length
  };
}
