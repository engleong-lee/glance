import { useState } from 'react';
import type { TableGroup } from '../lib/types';
import { GroupList } from './GroupList';
import { RecentList } from './RecentList';

interface SidebarProps {
    groups: TableGroup[];
    recentItems: string[];
    onSelectTable: (tableName: string) => void;
    onClearHistory: () => void;
}

export function Sidebar({ groups, recentItems, onSelectTable, onClearHistory }: SidebarProps) {
    const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);
    const [isRecentsExpanded, setIsRecentsExpanded] = useState(true);

    return (
        <aside className="sidebar w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {/* Groups Section */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <span className="flex items-center gap-2">
                        <span>📁</span>
                        <span>Groups</span>
                        {groups.length > 0 && (
                            <span className="text-xs text-gray-400">({groups.length})</span>
                        )}
                    </span>
                    <span className={`transform transition-transform ${isGroupsExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>
                {isGroupsExpanded && (
                    <div className="pb-2">
                        {groups.length > 0 ? (
                            <GroupList groups={groups} onSelectTable={onSelectTable} />
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                                <p>No groups configured.</p>
                                <p className="mt-1">Load a groups JSON file in Settings.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recents Section */}
            <div>
                <button
                    onClick={() => setIsRecentsExpanded(!isRecentsExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <span className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>Recent</span>
                        {recentItems.length > 0 && (
                            <span className="text-xs text-gray-400">({recentItems.length})</span>
                        )}
                    </span>
                    <span className={`transform transition-transform ${isRecentsExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>
                {isRecentsExpanded && (
                    <div className="pb-2">
                        {recentItems.length > 0 ? (
                            <RecentList
                                items={recentItems}
                                onSelect={onSelectTable}
                                onClear={onClearHistory}
                            />
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                                No recent items.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
