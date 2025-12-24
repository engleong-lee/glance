import { useEffect, useRef } from 'react';
import type { SearchResult } from '../lib/types';
import { ResultItem } from './ResultItem';

interface ResultsListProps {
    results: SearchResult[];
    selectedIndex: number;
    onSelect: (result: SearchResult) => void;
    onSelectionChange?: (index: number) => void;
    query: string;
}

export function ResultsList({ results, selectedIndex, onSelect, onSelectionChange, query }: ResultsListProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLDivElement>(null);

    // Scroll selected item into view when selectedIndex changes
    useEffect(() => {
        if (selectedRef.current && listRef.current) {
            selectedRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    if (results.length === 0 && query.length > 0) {
        return (
            <div className="results-empty p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">🔍</div>
                <div className="font-medium mb-2">No results found for "{query}"</div>
                <div className="text-sm space-y-1">
                    <p>Try:</p>
                    <ul className="list-disc list-inside">
                        <li>Using fewer characters</li>
                        <li>Checking for typos</li>
                        <li>Searching columns with <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">:col</code></li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div ref={listRef} className="results-list">
            {results.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 sticky top-0">
                    Results ({results.length})
                </div>
            )}
            {results.map((result, index) => (
                <div
                    key={`${result.type}-${result.displayName}`}
                    ref={index === selectedIndex ? selectedRef : null}
                >
                    <ResultItem
                        result={result}
                        isSelected={index === selectedIndex}
                        onClick={() => {
                            onSelectionChange?.(index);
                            onSelect(result);
                        }}
                        query={query}
                    />
                </div>
            ))}
        </div>
    );
}
