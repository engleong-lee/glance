import { create } from 'zustand';
import type { TableGroup } from '../lib/types';
import { loadGroupsFromStorage, saveGroupsToStorage, getDefaultGroupsConfig } from '../lib/groupsParser';

interface HistoryState {
    recentItems: string[];
    groups: TableGroup[];

    // Actions
    addRecentItem: (displayName: string) => void;
    clearHistory: () => void;
    setGroups: (groups: TableGroup[]) => void;
    loadFromStorage: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    recentItems: [],
    groups: [],

    addRecentItem: (displayName: string) => {
        const { recentItems } = get();

        // Remove if already exists, add to front, limit to 20
        const filtered = recentItems.filter(item => item !== displayName);
        const updated = [displayName, ...filtered].slice(0, 20);

        set({ recentItems: updated });

        // Persist to localStorage
        try {
            localStorage.setItem('glance_recent', JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recent items:', e);
        }
    },

    clearHistory: () => {
        set({ recentItems: [] });
        try {
            localStorage.removeItem('glance_recent');
        } catch (e) {
            console.error('Failed to clear recent items:', e);
        }
    },

    setGroups: (groups: TableGroup[]) => {
        set({ groups });
        saveGroupsToStorage({ version: '1.0', groups });
    },

    loadFromStorage: () => {
        // Load recent items
        try {
            const savedRecent = localStorage.getItem('glance_recent');
            if (savedRecent) {
                const recentItems = JSON.parse(savedRecent) as string[];
                set({ recentItems });
            }
        } catch (e) {
            console.error('Failed to load recent items:', e);
        }

        // Load groups
        try {
            const groupsConfig = loadGroupsFromStorage();
            if (groupsConfig) {
                set({ groups: groupsConfig.groups });
            } else {
                set({ groups: getDefaultGroupsConfig().groups });
            }
        } catch (e) {
            console.error('Failed to load groups:', e);
        }
    },
}));

// Initialize from storage on load
if (typeof window !== 'undefined') {
    useHistoryStore.getState().loadFromStorage();
}
