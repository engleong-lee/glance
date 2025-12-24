import { useCallback, useEffect } from 'react';
import { useSearchStore } from '../stores/searchStore';
import type { SearchResult } from '../lib/types';

interface UseSearchOptions {
    onSelect?: (result: SearchResult) => void;
    debounceMs?: number;
}

export function useSearch({ onSelect }: UseSearchOptions = {}) {
    const {
        query,
        results,
        selectedIndex,
        isSearching,
        setQuery,
        selectNext,
        selectPrev,
        getSelectedResult,
        addRecentItem,
        selectIndex,
        clearSearch,
    } = useSearchStore();

    // Handle keyboard navigation
    const handleKeyDown = useCallback(async (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectNext();
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectPrev();
                break;
            case 'Enter':
                event.preventDefault();
                const selected = getSelectedResult();
                if (selected) {
                    addRecentItem(selected.displayName);
                    onSelect?.(selected);
                }
                break;
            case 'Escape':
                event.preventDefault();
                clearSearch();
                // Hide the window
                try {
                    const { invoke } = await import('@tauri-apps/api/core');
                    await invoke('hide_window');
                } catch (e) {
                    console.error('Failed to hide window:', e);
                }
                break;
            case 'Tab':
                // Tab can be used for preview toggle
                event.preventDefault();
                break;
        }
    }, [selectNext, selectPrev, getSelectedResult, addRecentItem, onSelect, clearSearch]);

    // Handle quick select with Ctrl+1-9
    const handleQuickSelect = useCallback((event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
            const index = parseInt(event.key) - 1;
            const { results, selectIndex, addRecentItem } = useSearchStore.getState();
            if (index < results.length) {
                selectIndex(index);
                const selected = results[index];
                addRecentItem(selected.displayName);
                onSelect?.(selected);
            }
        }
    }, [onSelect]);

    // Global keyboard listener for quick select
    useEffect(() => {
        window.addEventListener('keydown', handleQuickSelect);
        return () => window.removeEventListener('keydown', handleQuickSelect);
    }, [handleQuickSelect]);

    return {
        query,
        results,
        selectedIndex,
        isSearching,
        setQuery,
        setSelectedIndex: selectIndex,
        handleKeyDown,
        clearSearch,
        selectResult: (result: SearchResult) => {
            addRecentItem(result.displayName);
            onSelect?.(result);
        },
    };
}
