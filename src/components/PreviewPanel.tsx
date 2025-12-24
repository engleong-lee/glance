import { useMemo, useState } from 'react';
import type { SearchResult, Column, ForeignKey, PrimaryKey } from '../lib/types';
import { generateSqlFromResult } from '../lib/sqlGenerator';
import { copyToClipboard } from '../lib/tauri';
import { useJoinQueryStore } from '../stores/joinQueryStore';
import { JoinQueryBuilder } from './JoinQueryBuilder';

interface PreviewPanelProps {
    result: SearchResult | null;
    columns: Column[];
    foreignKeys: ForeignKey[];
    primaryKeys: PrimaryKey[];
    onNavigateToTable?: (tableName: string) => void;
    onCopySQL?: () => void;
}

export function PreviewPanel({
    result,
    columns,
    foreignKeys,
    primaryKeys,
    onNavigateToTable,
    onCopySQL,
}: PreviewPanelProps) {
    const { tables: joinTables, addTable, isBuilding, toggleColumn, toggleStar } = useJoinQueryStore();
    const [columnsExpanded, setColumnsExpanded] = useState(false);

    // Get the current table name
    const currentTableName = useMemo(() => {
        if (!result) return null;
        return result.type === 'table' ? result.name : result.table;
    }, [result]);

    // Get columns for the selected table
    const tableColumns = useMemo(() => {
        if (!result) return [];
        const tableName = result.type === 'table' ? result.name : result.table;
        if (!tableName) return [];
        return columns.filter(col =>
            col.tableName.toLowerCase() === tableName.toLowerCase()
        ).sort((a, b) => a.ordinalPosition - b.ordinalPosition);
    }, [result, columns]);

    // Get outgoing foreign keys (this table references other tables)
    const outgoingFKs = useMemo(() => {
        if (!result) return [];
        const tableName = result.type === 'table' ? result.name : result.table;
        if (!tableName) return [];
        return foreignKeys.filter(fk =>
            fk.parentTable.toLowerCase() === tableName.toLowerCase()
        );
    }, [result, foreignKeys]);

    // Get incoming foreign keys (other tables reference this table)
    const incomingFKs = useMemo(() => {
        if (!result) return [];
        const tableName = result.type === 'table' ? result.name : result.table;
        if (!tableName) return [];
        return foreignKeys.filter(fk =>
            fk.referencedTable.toLowerCase() === tableName.toLowerCase()
        );
    }, [result, foreignKeys]);

    // Check if current table is in JOIN builder
    const currentTableInBuilder = useMemo(() => {
        if (!currentTableName) return null;
        return joinTables.find(t => t.name.toLowerCase() === currentTableName.toLowerCase());
    }, [currentTableName, joinTables]);

    // Start column selection for single table
    const handleStartColumnSelection = () => {
        if (currentTableName && !currentTableInBuilder) {
            addTable(currentTableName, undefined, columns);
        }
    };

    // Toggle column in current table
    const handleToggleColumn = (columnName: string) => {
        if (currentTableName) {
            // If not in builder yet, add it first
            if (!currentTableInBuilder) {
                addTable(currentTableName, undefined, columns);
            }
            toggleColumn(currentTableName, columnName);
        }
    };

    // Toggle star for current table
    const handleToggleStar = () => {
        if (currentTableName) {
            if (!currentTableInBuilder) {
                addTable(currentTableName, undefined, columns);
            }
            toggleStar(currentTableName);
        }
    };

    // Generate SQL for preview (basic SELECT *)
    const sql = useMemo(() => {
        if (!result) return '';
        return generateSqlFromResult(result, primaryKeys);
    }, [result, primaryKeys]);

    // Check if a column is a primary key
    const isPrimaryKey = (columnName: string, tableName: string): boolean => {
        return primaryKeys.some(pk =>
            pk.columnName.toLowerCase() === columnName.toLowerCase() &&
            pk.tableName.toLowerCase() === tableName.toLowerCase()
        );
    };

    // Check if a column is a foreign key
    const isForeignKey = (columnName: string, tableName: string): ForeignKey | undefined => {
        return foreignKeys.find(fk =>
            fk.parentColumn.toLowerCase() === columnName.toLowerCase() &&
            fk.parentTable.toLowerCase() === tableName.toLowerCase()
        );
    };

    // Check if a table is already in the JOIN chain
    const isInJoinChain = (tableName: string): boolean => {
        return joinTables.some(t => t.name.toLowerCase() === tableName.toLowerCase());
    };

    // Handle relationship click - Shift+Click adds to JOIN, regular click navigates
    const handleRelationshipClick = (
        event: React.MouseEvent,
        tableName: string,
        fk: ForeignKey
    ) => {
        if (event.shiftKey) {
            // Shift+Click: Add to JOIN query
            event.preventDefault();

            // If this is the first table, add current table first
            if (joinTables.length === 0 && currentTableName) {
                addTable(currentTableName, undefined, columns);
            }

            // Add the clicked table
            addTable(tableName, fk, columns);
        } else {
            // Regular click: Navigate to table
            onNavigateToTable?.(tableName);
        }
    };

    // Handle copy SQL
    const handleCopySql = async () => {
        try {
            await copyToClipboard(sql);
            onCopySQL?.();
        } catch (err) {
            console.error('Failed to copy SQL:', err);
        }
    };

    // Handle copy from JOIN builder
    const handleJoinCopySuccess = () => {
        onCopySQL?.();
    };

    if (!result) {
        return (
            <div className="preview-panel h-full flex items-center justify-center text-gray-400 dark:text-gray-500 p-8">
                <div className="text-center">
                    <div className="text-4xl mb-3">👀</div>
                    <p className="text-sm">Select an item to preview</p>
                    <p className="text-xs mt-2">Press <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Tab</kbd> to toggle</p>
                </div>
            </div>
        );
    }

    return (
        <div className="preview-panel h-full overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{result.type === 'table' ? '📋' : '📄'}</span>
                    <div className="flex-1">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {result.displayName}
                            {isInJoinChain(currentTableName || '') && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">
                                    In JOIN
                                </span>
                            )}
                        </h2>
                        {result.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {result.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content - all scrolls together */}
            {/* Columns Section */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Columns ({tableColumns.length})
                    </h3>
                    {!isBuilding && (
                        <button
                            onClick={handleStartColumnSelection}
                            className="text-xs text-blue-500 hover:text-blue-600"
                        >
                            Select Columns
                        </button>
                    )}
                    {isBuilding && currentTableInBuilder && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggleStar}
                                className={`text-xs px-2 py-0.5 rounded ${currentTableInBuilder.useStar ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                            >
                                *
                            </button>
                            <span className="text-xs text-gray-400">
                                {currentTableInBuilder.useStar ? 'All' : `${currentTableInBuilder.selectedColumns.length} selected`}
                            </span>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    {(columnsExpanded ? tableColumns : tableColumns.slice(0, 15)).map((col) => {
                        const fk = isForeignKey(col.name, col.tableName);
                        const pk = isPrimaryKey(col.name, col.tableName);
                        const isColSelected = currentTableInBuilder?.selectedColumns.includes(col.name) || currentTableInBuilder?.useStar;
                        return (
                            <div
                                key={`${col.tableName}.${col.name}`}
                                onClick={() => isBuilding && handleToggleColumn(col.name)}
                                className={`flex items-center gap-2 text-sm py-1 px-2 rounded transition-colors ${isBuilding ? 'cursor-pointer' : ''
                                    } ${isColSelected && isBuilding
                                        ? 'bg-blue-100 dark:bg-blue-900/50 border-l-2 border-blue-500'
                                        : result.type === 'column' && result.name === col.name
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <span className="flex-shrink-0 w-4 text-center">
                                    {pk && '🔑'}
                                    {!pk && fk && '🔗'}
                                </span>
                                <span className="font-mono text-gray-800 dark:text-gray-200 truncate">
                                    {col.name}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                    {col.dataType}
                                    {!col.isNullable && (
                                        <span className="text-amber-500 ml-1">*</span>
                                    )}
                                </span>
                                {fk && (
                                    <button
                                        onClick={(e) => handleRelationshipClick(e, fk.referencedTable, fk)}
                                        className={`text-xs hover:underline truncate ${isInJoinChain(fk.referencedTable)
                                            ? 'text-green-500 hover:text-green-600'
                                            : 'text-blue-500 hover:text-blue-600'
                                            }`}
                                        title={`Click to navigate, Shift+Click to add to JOIN\n${fk.referencedTable}.${fk.referencedColumn}`}
                                    >
                                        → {fk.referencedTable}
                                        {isInJoinChain(fk.referencedTable) && ' ✓'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {!columnsExpanded && tableColumns.length > 15 && (
                        <button
                            onClick={() => setColumnsExpanded(true)}
                            className="text-xs text-blue-500 hover:text-blue-600 px-2 py-1 hover:underline"
                        >
                            ... and {tableColumns.length - 15} more columns
                        </button>
                    )}
                    {columnsExpanded && tableColumns.length > 15 && (
                        <button
                            onClick={() => setColumnsExpanded(false)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 hover:underline"
                        >
                            Show less
                        </button>
                    )}
                </div>
            </div>

            {/* Relationships Section */}
            {(outgoingFKs.length > 0 || incomingFKs.length > 0) && (
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Relationships
                        </h3>
                        <span className="text-xs text-gray-400">
                            Shift+Click to add to JOIN
                        </span>
                    </div>
                    <div className="space-y-1">
                        {/* Outgoing FKs - tables this references */}
                        {outgoingFKs.map((fk) => (
                            <button
                                key={fk.constraintName}
                                onClick={(e) => handleRelationshipClick(e, fk.referencedTable, fk)}
                                className={`flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded transition-colors ${isInJoinChain(fk.referencedTable)
                                    ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <span className="text-blue-500">→</span>
                                <span className={`font-medium ${isInJoinChain(fk.referencedTable)
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-800 dark:text-gray-200'
                                    }`}>
                                    {fk.referencedTable}
                                    {isInJoinChain(fk.referencedTable) && (
                                        <span className="ml-1 text-green-500">✓</span>
                                    )}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    ({fk.parentColumn} → {fk.referencedColumn})
                                </span>
                            </button>
                        ))}
                        {/* Incoming FKs - tables that reference this */}
                        {incomingFKs.map((fk) => (
                            <button
                                key={fk.constraintName}
                                onClick={(e) => handleRelationshipClick(e, fk.parentTable, fk)}
                                className={`flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded transition-colors ${isInJoinChain(fk.parentTable)
                                    ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <span className="text-green-500">←</span>
                                <span className={`font-medium ${isInJoinChain(fk.parentTable)
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-800 dark:text-gray-200'
                                    }`}>
                                    {fk.parentTable}
                                    {isInJoinChain(fk.parentTable) && (
                                        <span className="ml-1 text-green-500">✓</span>
                                    )}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    ({fk.parentColumn} → {fk.referencedColumn})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* SQL Preview Section - only show if not building JOIN */}
            {!isBuilding && (
                <div className="px-4 py-3">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        SQL Preview
                    </h3>
                    <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                            <code>{sql}</code>
                        </pre>
                        <button
                            onClick={handleCopySql}
                            className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                            Copy SQL
                        </button>
                    </div>
                </div>
            )}
            {/* JOIN Query Builder */}
            <JoinQueryBuilder
                allColumns={columns}
                onCopySuccess={handleJoinCopySuccess}
            />
        </div>
    );
}
