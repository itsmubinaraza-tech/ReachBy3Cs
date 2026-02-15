import { MMKV } from 'react-native-mmkv';

// Create MMKV storage instance for offline data
export const storage = new MMKV({
  id: 'nm-platform-storage',
});

// Type-safe storage helpers
export const AppStorage = {
  // Queue cache for offline access
  getQueueCache: (): QueueCacheItem[] | null => {
    const data = storage.getString('queue-cache');
    return data ? JSON.parse(data) : null;
  },

  setQueueCache: (items: QueueCacheItem[]): void => {
    storage.set('queue-cache', JSON.stringify(items));
  },

  clearQueueCache: (): void => {
    storage.delete('queue-cache');
  },

  // Pending actions for offline sync
  getPendingActions: (): PendingAction[] => {
    const data = storage.getString('pending-actions');
    return data ? JSON.parse(data) : [];
  },

  addPendingAction: (action: PendingAction): void => {
    const actions = AppStorage.getPendingActions();
    actions.push(action);
    storage.set('pending-actions', JSON.stringify(actions));
  },

  removePendingAction: (actionId: string): void => {
    const actions = AppStorage.getPendingActions().filter(
      (a) => a.id !== actionId
    );
    storage.set('pending-actions', JSON.stringify(actions));
  },

  clearPendingActions: (): void => {
    storage.delete('pending-actions');
  },

  // Last sync timestamp
  getLastSyncTime: (): number | null => {
    const time = storage.getNumber('last-sync-time');
    return time ?? null;
  },

  setLastSyncTime: (timestamp: number): void => {
    storage.set('last-sync-time', timestamp);
  },

  // User preferences
  getNotificationsEnabled: (): boolean => {
    return storage.getBoolean('notifications-enabled') ?? true;
  },

  setNotificationsEnabled: (enabled: boolean): void => {
    storage.set('notifications-enabled', enabled);
  },

  getBiometricsEnabled: (): boolean => {
    return storage.getBoolean('biometrics-enabled') ?? false;
  },

  setBiometricsEnabled: (enabled: boolean): void => {
    storage.set('biometrics-enabled', enabled);
  },

  // Selected organization
  getSelectedOrgId: (): string | null => {
    return storage.getString('selected-org-id') ?? null;
  },

  setSelectedOrgId: (orgId: string): void => {
    storage.set('selected-org-id', orgId);
  },

  clearSelectedOrgId: (): void => {
    storage.delete('selected-org-id');
  },
};

// Types for storage
export interface QueueCacheItem {
  id: string;
  platform: string;
  originalText: string;
  responsePreview: string;
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
  ctaLevel: number;
  ctsScore: number;
  canAutoPost: boolean;
  createdAt: string;
  cachedAt: number;
}

export interface PendingAction {
  id: string;
  type: 'approve' | 'reject' | 'edit';
  responseId: string;
  timestamp: number;
  data?: {
    editedResponse?: string;
    notes?: string;
  };
}
