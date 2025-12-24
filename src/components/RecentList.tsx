interface RecentListProps {
    items: string[];
    onSelect: (item: string) => void;
    onClear: () => void;
}

export function RecentList({ items, onSelect, onClear }: RecentListProps) {
    return (
        <div className="recent-list">
            {/* Recent Items */}
            <div className="space-y-0.5">
                {items.slice(0, 10).map((item, index) => (
                    <button
                        key={`${item}-${index}`}
                        onClick={() => onSelect(item)}
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left group"
                    >
                        <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">🕐</span>
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                            {item}
                        </span>
                    </button>
                ))}
            </div>

            {/* Show more indicator */}
            {items.length > 10 && (
                <div className="px-4 py-1 text-xs text-gray-400 dark:text-gray-500">
                    +{items.length - 10} more
                </div>
            )}

            {/* Clear button */}
            {items.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 mt-1">
                    <button
                        onClick={onClear}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Clear history
                    </button>
                </div>
            )}
        </div>
    );
}
