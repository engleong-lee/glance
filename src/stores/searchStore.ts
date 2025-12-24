import { create } from 'zustand';
import type { SearchResult, Table, Column } from '../lib/types';
import { searchSchema } from '../lib/fuzzySearch';

// Debounce timer
let searchTimer: ReturnType<typeof setTimeout> | null = null;

interface SearchState {
    query: string;
    results: SearchResult[];
    selectedIndex: number;
    isSearching: boolean;

    // Data sources
    tables: Table[];
    columns: Column[];
    recentItems: string[];

    // Actions
    setQuery: (query: string) => void;
    search: (query: string) => void;
    selectNext: () => void;
    selectPrev: () => void;
    selectIndex: (index: number) => void;
    getSelectedResult: () => SearchResult | null;
    setTables: (tables: Table[]) => void;
    setColumns: (columns: Column[]) => void;
    addRecentItem: (displayName: string) => void;
    clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
    query: '',
    results: [],
    selectedIndex: 0,
    isSearching: false,
    tables: [],
    columns: [],
    recentItems: [],

    setQuery: (query) => {
        set({ query });

        // Debounce search - wait 50ms after last keystroke
        if (searchTimer) {
            clearTimeout(searchTimer);
        }

        if (!query || query.trim().length === 0) {
            set({ results: [], selectedIndex: 0, isSearching: false });
            return;
        }

        set({ isSearching: true });

        searchTimer = setTimeout(() => {
            get().search(query);
        }, 50);
    },

    search: (query) => {
        const { tables, columns, recentItems } = get();

        if (!query || query.trim().length === 0) {
            set({ results: [], selectedIndex: 0, isSearching: false });
            return;
        }

        const results = searchSchema(query, tables, columns, recentItems);

        set({
            results,
            selectedIndex: 0,
            isSearching: false
        });
    },

    selectNext: () => {
        const { results, selectedIndex } = get();
        if (results.length === 0) return;

        const newIndex = (selectedIndex + 1) % results.length;
        set({ selectedIndex: newIndex });
    },

    selectPrev: () => {
        const { results, selectedIndex } = get();
        if (results.length === 0) return;

        const newIndex = selectedIndex === 0 ? results.length - 1 : selectedIndex - 1;
        set({ selectedIndex: newIndex });
    },

    selectIndex: (index) => {
        const { results } = get();
        if (index >= 0 && index < results.length) {
            set({ selectedIndex: index });
        }
    },

    getSelectedResult: () => {
        const { results, selectedIndex } = get();
        return results[selectedIndex] || null;
    },

    setTables: (tables) => {
        set({ tables });
    },

    setColumns: (columns) => {
        set({ columns });
    },

    addRecentItem: (displayName) => {
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

    clearSearch: () => {
        set({ query: '', results: [], selectedIndex: 0 });
    },
}));

// Load recent items from localStorage on init
if (typeof window !== 'undefined') {
    try {
        const saved = localStorage.getItem('glance_recent');
        if (saved) {
            const recentItems = JSON.parse(saved);
            useSearchStore.setState({ recentItems });
        }
    } catch (e) {
        console.error('Failed to load recent items:', e);
    }
}
