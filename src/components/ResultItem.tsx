import type { SearchResult } from '../lib/types';

interface ResultItemProps {
    result: SearchResult;
    isSelected: boolean;
    onClick: () => void;
    query: string;
}

export function ResultItem({ result, isSelected, onClick, query }: ResultItemProps) {
    const icon = result.type === 'table' ? '📋' : '📄';

    // Highlight matching text
    const highlightedName = highlightMatch(result.displayName, query);

    return (
        <div
            onClick={onClick}
            className={`result-item flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent'
                }`}
        >
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <div
                    className="font-medium text-gray-900 dark:text-gray-100 truncate"
                    dangerouslySetInnerHTML={{ __html: highlightedName }}
                />
                {result.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {result.description}
                    </div>
                )}
                {result.type === 'column' && result.table && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                        in {result.table}
                    </div>
                )}
            </div>
        </div>
    );
}

// Highlight matching text helper
function highlightMatch(text: string, query: string): string {
    if (!query || query.length < 1) return escapeHtml(text);

    // Remove prefix from query
    let searchTerm = query;
    if (query.startsWith(':col ')) searchTerm = query.slice(5);
    else if (query.startsWith(':table ')) searchTerm = query.slice(7);

    if (!searchTerm) return escapeHtml(text);

    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 rounded px-0.5">$1</mark>');
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
