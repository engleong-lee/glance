interface KeyboardShortcutsHelpProps {
    onClose: () => void;
}

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
    const sections = [
        {
            title: 'Global',
            shortcuts: [
                { keys: ['⌘', '⇧', 'Space'], description: 'Show/hide Glance', note: 'Works from any app' },
            ],
        },
        {
            title: 'Navigation',
            shortcuts: [
                { keys: ['↑', '↓'], description: 'Navigate results' },
                { keys: ['Enter'], description: 'Copy SQL for selected item' },
                { keys: ['Escape'], description: 'Hide window / Clear search' },
                { keys: ['⌘', '1-9'], description: 'Quick select result 1-9' },
            ],
        },
        {
            title: 'Preview & Sidebar',
            shortcuts: [
                { keys: ['Tab'], description: 'Toggle preview panel' },
                { keys: ['⇧', 'Tab'], description: 'Hide preview panel' },
                { keys: ['⌘', 'G'], description: 'Toggle sidebar' },
                { keys: ['⌥', '←'], description: 'Go back in navigation' },
                { keys: ['Backspace'], description: 'Go back (when at start)' },
            ],
        },
        {
            title: 'JOIN Builder',
            shortcuts: [
                { keys: ['⇧', 'Click'], description: 'Add table to JOIN', note: 'On relationship items' },
                { keys: ['⌘', 'Enter'], description: 'Copy JOIN SQL' },
                { keys: ['⌘', '⇧', 'C'], description: 'Clear JOIN builder' },
            ],
        },
        {
            title: 'Settings',
            shortcuts: [
                { keys: ['⌘', ','], description: 'Open settings' },
            ],
        },
    ];

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⌨️</span>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Keyboard Shortcuts
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    >
                        <span className="text-xl">×</span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                                {section.title}
                            </h3>
                            <div className="space-y-2">
                                {section.shortcuts.map((shortcut, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {shortcut.description}
                                            </span>
                                            {shortcut.note && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    ({shortcut.note})
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, j) => (
                                                <kbd
                                                    key={j}
                                                    className="min-w-[28px] px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono rounded text-center shadow-sm"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <span>💡</span>
                            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> to toggle this help</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact inline help for footer
export function KeyboardHints() {
    const hints = [
        { keys: '↑↓', label: 'Navigate' },
        { keys: '⏎', label: 'Copy SQL' },
        { keys: '⇥', label: 'Preview' },
        { keys: '⌘G', label: 'Sidebar' },
        { keys: '⌘,', label: 'Settings' },
        { keys: '?', label: 'Help' },
        { keys: 'Esc', label: 'Close' },
    ];

    return (
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            {hints.map(({ keys, label }) => (
                <span key={keys}>
                    <kbd className="font-mono">{keys}</kbd> {label}
                </span>
            ))}
        </div>
    );
}
