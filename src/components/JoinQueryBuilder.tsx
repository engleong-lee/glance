import { useMemo, useState } from 'react';
import { useJoinQueryStore, JoinTable } from '../stores/joinQueryStore';
import type { Column } from '../lib/types';
import { copyToClipboard } from '../lib/tauri';

interface JoinQueryBuilderProps {
    allColumns: Column[];
    onCopySuccess?: () => void;
}

export function JoinQueryBuilder({ allColumns, onCopySuccess }: JoinQueryBuilderProps) {
    const {
        tables,
        isBuilding,
        removeTable,
        toggleColumn,
        toggleStar,
        selectAllColumns,
        clearAllColumns,
        clearQuery,
        getGeneratedSQL,
    } = useJoinQueryStore();

    const generatedSQL = useMemo(() => getGeneratedSQL(), [tables, getGeneratedSQL]);

    const handleCopySQL = async () => {
        if (generatedSQL) {
            await copyToClipboard(generatedSQL);
            onCopySuccess?.();
        }
    };

    if (!isBuilding || tables.length === 0) {
        return null;
    }

    return (
        <div className="join-query-builder border-t border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/30">
                <div className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        🔗 JOIN Builder
                    </span>
                    <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                        {tables.length} table{tables.length > 1 ? 's' : ''}
                    </span>
                </div>
                <button
                    onClick={clearQuery}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    title="Clear all (Ctrl+Shift+C)"
                >
                    Clear
                </button>
            </div>

            {/* Tables in JOIN chain */}
            <div className="px-4 py-2 space-y-2 max-h-[200px] overflow-y-auto">
                {tables.map((table, index) => (
                    <JoinTableItem
                        key={table.name}
                        table={table}
                        index={index}
                        allColumns={allColumns}
                        onRemove={() => removeTable(table.name)}
                        onToggleColumn={(col) => toggleColumn(table.name, col)}
                        onToggleStar={() => toggleStar(table.name)}
                        onSelectAll={() => selectAllColumns(table.name, allColumns)}
                        onClearAll={() => clearAllColumns(table.name)}
                    />
                ))}
            </div>

            {/* Generated SQL Preview */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Generated SQL
                    </span>
                    <button
                        onClick={handleCopySQL}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                        Copy SQL
                    </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 rounded p-2 text-xs font-mono overflow-x-auto max-h-[150px]">
                    <code>{generatedSQL}</code>
                </pre>
            </div>
        </div>
    );
}

interface JoinTableItemProps {
    table: JoinTable;
    index: number;
    allColumns: Column[];
    onRemove: () => void;
    onToggleColumn: (columnName: string) => void;
    onToggleStar: () => void;
    onSelectAll: () => void;
    onClearAll: () => void;
}

function JoinTableItem({
    table,
    index,
    allColumns,
    onRemove,
    onToggleColumn,
    onToggleStar,
    onSelectAll,
    onClearAll,
}: JoinTableItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const tableColumns = useMemo(() =>
        allColumns.filter(c => c.tableName.toLowerCase() === table.name.toLowerCase()),
        [allColumns, table.name]
    );

    const visibleColumns = isExpanded ? tableColumns : tableColumns.slice(0, 10);
    const hiddenCount = tableColumns.length - 10;

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            {/* Table Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    {index === 0 ? (
                        <span className="text-xs text-gray-400">FROM</span>
                    ) : (
                        <span className="text-xs text-blue-500">JOIN</span>
                    )}
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                        {table.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                        ({table.alias})
                    </span>
                </div>
                <button
                    onClick={onRemove}
                    className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    title="Remove from query"
                >
                    ✕
                </button>
            </div>

            {/* Join Condition */}
            {table.joinCondition && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 pl-2">
                    ON {table.alias}.{table.joinCondition.toColumn} = {table.joinCondition.fromColumn}
                </div>
            )}

            {/* Column Selection */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">Columns:</span>
                <button
                    onClick={onSelectAll}
                    className="text-xs text-blue-500 hover:text-blue-600"
                >
                    All
                </button>
                <button
                    onClick={onClearAll}
                    className="text-xs text-gray-400 hover:text-gray-600"
                >
                    None
                </button>
            </div>

            {/* Column Chips */}
            <div className="flex flex-wrap gap-1">
                {/* Star (*) button for select all */}
                <button
                    onClick={onToggleStar}
                    className={`px-2 py-0.5 text-xs rounded transition-colors font-bold ${table.useStar
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    title="Select all columns (*)"
                >
                    *
                </button>
                {!table.useStar && visibleColumns.map((col) => {
                    const isSelected = table.selectedColumns.includes(col.name);
                    return (
                        <button
                            key={col.name}
                            onClick={() => onToggleColumn(col.name)}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${isSelected
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            title={`${col.name} (${col.dataType})`}
                        >
                            {col.isPrimaryKey && '🔑'}
                            {col.isForeignKey && '🔗'}
                            {col.name}
                        </button>
                    );
                })}
                {!table.useStar && !isExpanded && hiddenCount > 0 && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-xs text-blue-500 hover:text-blue-600 px-1 hover:underline"
                    >
                        +{hiddenCount} more
                    </button>
                )}
                {!table.useStar && isExpanded && tableColumns.length > 10 && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1 hover:underline"
                    >
                        Show less
                    </button>
                )}
                {table.useStar && (
                    <span className="text-xs text-purple-500 px-1">
                        All columns selected
                    </span>
                )}
            </div>
        </div>
    );
}
