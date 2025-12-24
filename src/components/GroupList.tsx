import { useState } from 'react';
import type { TableGroup } from '../lib/types';

interface GroupListProps {
    groups: TableGroup[];
    onSelectTable: (tableName: string) => void;
}

export function GroupList({ groups, onSelectTable }: GroupListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (groupId: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    return (
        <div className="group-list">
            {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                return (
                    <div key={group.id} className="group-item">
                        {/* Group Header */}
                        <button
                            onClick={() => toggleGroup(group.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title={group.description}
                        >
                            <span className="transform transition-transform text-xs text-gray-400">
                                {isExpanded ? '▼' : '▶'}
                            </span>
                            <span className="flex-shrink-0">{group.icon || '📁'}</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                {group.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                                {group.tables.length}
                            </span>
                        </button>

                        {/* Group Description Tooltip (on hover via title) */}
                        {isExpanded && group.description && (
                            <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                {group.description}
                            </div>
                        )}

                        {/* Tables in Group */}
                        {isExpanded && (
                            <div className="pl-4">
                                {group.tables.map((table) => {
                                    const isEntryPoint = group.entryPoint === table.name;
                                    return (
                                        <button
                                            key={table.name}
                                            onClick={() => onSelectTable(table.name)}
                                            className="w-full flex items-center gap-2 px-4 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
                                            title={table.tips ? `${table.description || ''}\n\n💡 ${table.tips}` : table.description}
                                        >
                                            <span className="flex-shrink-0 w-4 text-center">
                                                {isEntryPoint ? '⭐' : '📋'}
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300 truncate">
                                                {table.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Expanded table descriptions */}
                        {isExpanded && (
                            <div className="pl-8 space-y-0.5 pb-2">
                                {group.tables.filter(t => t.description).slice(0, 3).map((table) => (
                                    <div
                                        key={`${table.name}-desc`}
                                        className="text-xs text-gray-400 dark:text-gray-500 truncate px-4"
                                    >
                                        {/* Show description inline if expanded */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
