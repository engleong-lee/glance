import Fuse from 'fuse.js';
import type { Table, Column, SearchResult } from './types';

// Fuse.js configuration for fuzzy search - optimized settings
const fuseOptions = {
    keys: [
        { name: 'name', weight: 2 },
        { name: 'searchName', weight: 2 },
        { name: 'description', weight: 1 },
    ],
    threshold: 0.5,       // Slightly stricter for better performance
    distance: 500,        // Reduced for performance
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
};

export interface SearchableItem {
    type: 'table' | 'column';
    name: string;
    searchName: string;
    displayName: string;
    description?: string;
    table?: string;
}

// Cache for Fuse instances to avoid re-indexing
let cachedFuse: Fuse<SearchableItem> | null = null;
let cachedItems: SearchableItem[] = [];
let cacheKey = '';

function createSearchableName(name: string): string {
    return name.replace(/_/g, ' ').toLowerCase();
}

export function createSearchableItems(tables: Table[], columns: Column[]): SearchableItem[] {
    const items: SearchableItem[] = [];

    for (const table of tables) {
        items.push({
            type: 'table',
            name: table.name,
            searchName: createSearchableName(table.name),
            displayName: table.schema ? `${table.schema}.${table.name}` : table.name,
            description: table.description,
        });
    }

    for (const column of columns) {
        items.push({
            type: 'column',
            name: column.name,
            searchName: createSearchableName(column.name),
            displayName: `${column.tableName}.${column.name}`,
            description: column.description,
            table: column.tableName,
        });
    }

    return items;
}

// Get or create cached Fuse index
function getFuseIndex(tables: Table[], columns: Column[]): Fuse<SearchableItem> {
    const newCacheKey = `${tables.length}-${columns.length}`;

    if (cachedFuse && cacheKey === newCacheKey) {
        return cachedFuse;
    }

    cachedItems = createSearchableItems(tables, columns);
    cachedFuse = new Fuse(cachedItems, fuseOptions);
    cacheKey = newCacheKey;

    return cachedFuse;
}

export function parseSearchQuery(query: string): { prefix: string | null; term: string } {
    const trimmed = query.trim();

    if (trimmed.startsWith(':col ')) {
        return { prefix: 'column', term: trimmed.slice(5) };
    }
    if (trimmed.startsWith(':table ')) {
        return { prefix: 'table', term: trimmed.slice(7) };
    }

    return { prefix: null, term: trimmed };
}

// Simple substring match for multi-word queries
function matchesAllWords(name: string, searchWords: string[]): boolean {
    const nameLower = name.toLowerCase().replace(/_/g, ' ');
    return searchWords.every(word => nameLower.includes(word));
}

export function searchSchema(
    query: string,
    tables: Table[],
    columns: Column[],
    recentItems: string[] = []
): SearchResult[] {
    const { prefix, term } = parseSearchQuery(query);

    if (!term || term.length < 1) {
        return [];
    }

    const searchWords = term.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // For multi-word queries, do a fast pre-filter first
    if (searchWords.length > 1) {
        const allItems = createSearchableItems(tables, columns);

        // Filter by prefix if specified
        let filtered = allItems;
        if (prefix === 'column') {
            filtered = allItems.filter(i => i.type === 'column');
        } else if (prefix === 'table') {
            filtered = allItems.filter(i => i.type === 'table');
        }

        // Fast substring matching
        const matches = filtered.filter(item => matchesAllWords(item.name, searchWords));

        // Convert to results and sort
        return matches
            .map(item => {
                let score = 0.5;
                const recentIndex = recentItems.indexOf(item.displayName);
                if (recentIndex !== -1) {
                    score = score * (0.7 - (recentIndex * 0.05));
                }
                return {
                    type: item.type,
                    name: item.name,
                    displayName: item.displayName,
                    description: item.description,
                    table: item.table,
                    score,
                };
            })
            .sort((a, b) => a.score - b.score)
            .slice(0, 30);
    }

    // For single-word queries, use Fuse.js
    const fuse = getFuseIndex(tables, columns);
    let results = fuse.search(term);

    // Filter by prefix
    if (prefix === 'column') {
        results = results.filter(r => r.item.type === 'column');
    } else if (prefix === 'table') {
        results = results.filter(r => r.item.type === 'table');
    }

    // Convert to SearchResult format
    const searchResults: SearchResult[] = results.map((result) => {
        const item = result.item;
        let score = result.score ?? 1;

        if (item.name.toLowerCase() === term.toLowerCase()) {
            score = score * 0.1;
        }

        if (item.name.toLowerCase().startsWith(term.toLowerCase())) {
            score = score * 0.5;
        }

        const recentIndex = recentItems.indexOf(item.displayName);
        if (recentIndex !== -1) {
            score = score * (0.7 - (recentIndex * 0.05));
        }

        return {
            type: item.type,
            name: item.name,
            displayName: item.displayName,
            description: item.description,
            table: item.table,
            score,
        };
    });

    return searchResults
        .sort((a, b) => a.score - b.score)
        .slice(0, 30);
}

export function highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
