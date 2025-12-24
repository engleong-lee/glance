interface EmptyStateProps {
    type: 'no-results' | 'no-groups' | 'no-history' | 'no-connection' | 'error';
    title?: string;
    message?: string;
    icon?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ type, title, message, icon, action }: EmptyStateProps) {
    const defaults = getDefaults(type);

    return (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="text-5xl mb-4">
                {icon || defaults.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {title || defaults.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {message || defaults.message}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    {action.label}
                </button>
            )}
            {defaults.tips && defaults.tips.length > 0 && (
                <div className="mt-6 text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-sm">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                        💡 {defaults.tips.length > 1 ? 'Tips:' : 'Tip:'}
                    </p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {defaults.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function getDefaults(type: EmptyStateProps['type']) {
    switch (type) {
        case 'no-results':
            return {
                icon: '🔍',
                title: 'No results found',
                message: 'Try adjusting your search or using different keywords.',
                tips: [
                    '• Use fewer characters',
                    '• Try different spelling',
                    '• Use :col to search columns only',
                    '• Use :table to search tables only',
                ],
            };
        case 'no-groups':
            return {
                icon: '📁',
                title: 'No groups configured',
                message: 'Add table groupings to organize your schema and help your team navigate.',
                tips: [
                    '• Create a schema-groups.json file',
                    '• Point to it in Settings → Groups File Path',
                    '• Share with your team via Git',
                ],
            };
        case 'no-history':
            return {
                icon: '🕐',
                title: 'No recent items',
                message: 'Tables and columns you select will appear here for quick access.',
                tips: [],
            };
        case 'no-connection':
            return {
                icon: '🔌',
                title: 'Not connected',
                message: 'Connect to a database to start exploring its schema.',
                tips: [],
            };
        case 'error':
            return {
                icon: '⚠️',
                title: 'Something went wrong',
                message: 'An error occurred. Please try again.',
                tips: [],
            };
        default:
            return {
                icon: '📭',
                title: 'Nothing here',
                message: '',
                tips: [],
            };
    }
}

// Error boundary component
interface ErrorDisplayProps {
    error: string | Error | null;
    title?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
}

export function ErrorDisplay({ error, title, onRetry, onDismiss }: ErrorDisplayProps) {
    if (!error) return null;

    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <span className="text-red-500 dark:text-red-400 text-xl">⚠️</span>
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        {title || 'Error'}
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {errorMessage}
                    </p>
                    <div className="flex gap-2 mt-3">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                            >
                                Try Again
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                            >
                                Dismiss
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Connection error component with recovery options
interface ConnectionErrorProps {
    error: string;
    onRetry: () => void;
    onEditConnection: () => void;
    onWorkOffline?: () => void;
}

export function ConnectionError({ error, onRetry, onEditConnection, onWorkOffline }: ConnectionErrorProps) {
    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <div>
                    <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100">
                        Unable to connect to database
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        {error}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
                >
                    Try Again
                </button>
                <button
                    onClick={onEditConnection}
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-50 dark:hover:bg-gray-600"
                >
                    Edit Connection
                </button>
                {onWorkOffline && (
                    <button
                        onClick={onWorkOffline}
                        className="px-4 py-2 text-amber-600 dark:text-amber-400 text-sm font-medium hover:text-amber-800 dark:hover:text-amber-200"
                    >
                        Work Offline
                    </button>
                )}
            </div>
        </div>
    );
}
