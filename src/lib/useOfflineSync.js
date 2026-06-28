/**
 * useOfflineSync — React hook that:
 * 1. Tracks online/offline status
 * 2. Syncs pending mutations when connection returns
 * 3. Provides an offline-aware mutation wrapper
 */
import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { queueMutation, getPendingMutations, deleteMutation } from './offlineStorage';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return isOnline;
}

// Sync all queued mutations when we come back online
export async function syncPendingMutations() {
  const pending = await getPendingMutations();
  if (pending.length === 0) return 0;

  let synced = 0;
  for (const mut of pending) {
    const entity = base44.entities[mut.entityName];
    if (!entity) continue;

    if (mut.operation === 'create') {
      await entity.create(mut.data);
    } else if (mut.operation === 'update') {
      await entity.update(mut.id, mut.data);
    } else if (mut.operation === 'delete') {
      await entity.delete(mut.id);
    }
    await deleteMutation(mut.id);
    synced++;
  }
  return synced;
}

// Offline-aware save: tries online first, queues if offline
export async function offlineSave(entityName, operation, id, data) {
  if (navigator.onLine) {
    const entity = base44.entities[entityName];
    if (operation === 'create') return entity.create(data);
    if (operation === 'update') return entity.update(id, data);
    if (operation === 'delete') return entity.delete(id);
  } else {
    await queueMutation(entityName, operation, id, data);
    return { id: id || `local_${Date.now()}`, ...data, _offline: true };
  }
}
