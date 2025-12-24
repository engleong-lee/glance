interface IndexingProgressProps {
    progress: number;
    status: string;
    tableCount?: number;
    columnCount?: number;
}

export function IndexingProgress({ progress, status, tableCount, columnCount }: IndexingProgressProps) {
    return (
        <div className="indexing-progress p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 mb-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Indexing Schema</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{status}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Stats */}
            {(tableCount !== undefined || columnCount !== undefined) && (
                <div className="mt-4 flex gap-6 text-sm text-gray-600 dark:text-gray-300">
                    {tableCount !== undefined && (
                        <div>
                            <span className="font-medium">{tableCount.toLocaleString()}</span>
                            <span className="text-gray-400"> tables</span>
                        </div>
                    )}
                    {columnCount !== undefined && (
                        <div>
                            <span className="font-medium">{columnCount.toLocaleString()}</span>
                            <span className="text-gray-400"> columns</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
