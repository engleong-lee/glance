import { useState } from 'react';
import { useSettingsStore, Theme, CopyBehavior } from '../stores/settingsStore';
import { useConnectionStore } from '../stores/connectionStore';
import type { Connection } from '../lib/types';

type SettingsTab = 'general' | 'connections' | 'appearance' | 'shortcuts';

interface SettingsProps {
    onClose: () => void;
    onEditConnection?: (connection: Connection | null) => void;
    initialTab?: SettingsTab;
}

export function Settings({ onClose, onEditConnection, initialTab = 'general' }: SettingsProps) {
    const {
        theme,
        rowLimit,
        copyBehavior,
        autoRefreshSchema,
        hotkey,
        groupsFilePath,
        setTheme,
        setRowLimit,
        setCopyBehavior,
        setAutoRefreshSchema,
        setGroupsFilePath,
        resetToDefaults,
    } = useSettingsStore();

    const { connections, currentConnection, deleteConnection, setDefaultConnection } = useConnectionStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    const tabs = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'connections', label: 'Connections', icon: '🔗' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    ] as const;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    >
                        <span className="text-xl">×</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex h-[60vh]">
                    {/* Sidebar */}
                    <nav className="w-48 border-r border-gray-200 dark:border-gray-700 p-4">
                        <ul className="space-y-1">
                            {tabs.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'general' && (
                            <GeneralSettings
                                rowLimit={rowLimit}
                                copyBehavior={copyBehavior}
                                autoRefreshSchema={autoRefreshSchema}
                                groupsFilePath={groupsFilePath}
                                onRowLimitChange={setRowLimit}
                                onCopyBehaviorChange={setCopyBehavior}
                                onAutoRefreshChange={setAutoRefreshSchema}
                                onGroupsFilePathChange={setGroupsFilePath}
                            />
                        )}

                        {activeTab === 'connections' && (
                            <ConnectionSettings
                                connections={connections}
                                currentConnection={currentConnection}
                                onEditConnection={onEditConnection}
                                onDeleteConnection={deleteConnection}
                                onSetDefault={setDefaultConnection}
                            />
                        )}

                        {activeTab === 'appearance' && (
                            <AppearanceSettings
                                theme={theme}
                                onThemeChange={setTheme}
                            />
                        )}

                        {activeTab === 'shortcuts' && (
                            <ShortcutsSettings
                                hotkey={hotkey}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={resetToDefaults}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

// General Settings Tab
interface GeneralSettingsProps {
    rowLimit: number;
    copyBehavior: CopyBehavior;
    autoRefreshSchema: boolean;
    groupsFilePath: string;
    onRowLimitChange: (limit: number) => void;
    onCopyBehaviorChange: (behavior: CopyBehavior) => void;
    onAutoRefreshChange: (enabled: boolean) => void;
    onGroupsFilePathChange: (path: string) => void;
}

function GeneralSettings({
    rowLimit,
    copyBehavior,
    autoRefreshSchema,
    groupsFilePath,
    onRowLimitChange,
    onCopyBehaviorChange,
    onAutoRefreshChange,
    onGroupsFilePathChange,
}: GeneralSettingsProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">General Settings</h3>

            {/* Row Limit */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Default Row Limit
                </label>
                <select
                    value={rowLimit}
                    onChange={(e) => onRowLimitChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value={10}>10 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                    <option value={500}>500 rows</option>
                    <option value={0}>No limit</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sets the TOP N clause in generated SELECT queries (0 = no limit)
                </p>
            </div>

            {/* Copy Behavior */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Copy Behavior
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="copyBehavior"
                            value="copyOnly"
                            checked={copyBehavior === 'copyOnly'}
                            onChange={() => onCopyBehaviorChange('copyOnly')}
                            className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Copy SQL only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="copyBehavior"
                            value="copyAndClose"
                            checked={copyBehavior === 'copyAndClose'}
                            onChange={() => onCopyBehaviorChange('copyAndClose')}
                            className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Copy SQL and close window</span>
                    </label>
                </div>
            </div>

            {/* Auto Refresh */}
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={autoRefreshSchema}
                        onChange={(e) => onAutoRefreshChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto-refresh schema on startup
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Automatically fetch latest schema from database when app starts
                        </p>
                    </div>
                </label>
            </div>

            {/* Groups File Path */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Groups Configuration File
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={groupsFilePath}
                        onChange={(e) => onGroupsFilePathChange(e.target.value)}
                        placeholder="/path/to/schema-groups.json"
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                        onClick={() => {
                            // TODO: Implement file picker via Tauri dialog
                            console.log('Open file picker');
                        }}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm"
                    >
                        Browse
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Path to JSON file with table groupings and annotations
                </p>
            </div>
        </div>
    );
}

// Connection Settings Tab
interface ConnectionSettingsProps {
    connections: Connection[];
    currentConnection: Connection | null;
    onEditConnection?: (connection: Connection | null) => void;
    onDeleteConnection: (id: string) => Promise<void>;
    onSetDefault: (id: string) => Promise<void>;
}

function ConnectionSettings({
    connections,
    currentConnection,
    onEditConnection,
    onDeleteConnection,
    onSetDefault,
}: ConnectionSettingsProps) {
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Connections</h3>
                <button
                    onClick={() => onEditConnection?.(null)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                    + Add Connection
                </button>
            </div>

            {connections.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-4xl mb-2">🔌</p>
                    <p>No connections configured</p>
                    <p className="text-sm">Add a connection to get started</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {connections.map((conn) => (
                        <div
                            key={conn.id}
                            className={`p-4 rounded-lg border transition-colors ${currentConnection?.id === conn.id
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">🗄️</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {conn.name}
                                            </span>
                                            {conn.isDefault && (
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                                    Default
                                                </span>
                                            )}
                                            {currentConnection?.id === conn.id && (
                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                                                    Connected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {conn.server} / {conn.database}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!conn.isDefault && (
                                        <button
                                            onClick={() => onSetDefault(conn.id)}
                                            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            title="Set as default"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onEditConnection?.(conn)}
                                        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                        Edit
                                    </button>
                                    {confirmingDeleteId === conn.id ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
                                            <button
                                                onClick={async () => {
                                                    await onDeleteConnection(conn.id);
                                                    setConfirmingDeleteId(null);
                                                }}
                                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => setConfirmingDeleteId(null)}
                                                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmingDeleteId(conn.id)}
                                            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Appearance Settings Tab
interface AppearanceSettingsProps {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

function AppearanceSettings({ theme, onThemeChange }: AppearanceSettingsProps) {
    const themes: { value: Theme; label: string; icon: string }[] = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
        { value: 'system', label: 'System', icon: '💻' },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>

            {/* Theme Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {themes.map(({ value, label, icon }) => (
                        <button
                            key={value}
                            onClick={() => onThemeChange(value)}
                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${theme === value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <span className="text-2xl">{icon}</span>
                            <span className={`text-sm font-medium ${theme === value
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview</p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔍</span>
                        <span className="text-gray-400 dark:text-gray-500">Search tables...</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/30">
                            <span>📋</span>
                            <span className="text-gray-900 dark:text-white">PERSON</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                            <span>📋</span>
                            <span className="text-gray-700 dark:text-gray-300">PERSON_ADDRESS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Shortcuts Settings Tab
interface ShortcutsSettingsProps {
    hotkey: string;
}

function ShortcutsSettings({ hotkey }: ShortcutsSettingsProps) {
    const shortcuts = [
        { keys: hotkey, description: 'Show/hide Glance (global)' },
        { keys: 'Escape', description: 'Hide window / Clear search' },
        { keys: '↑ / ↓', description: 'Navigate results' },
        { keys: 'Enter', description: 'Copy SQL for selected item' },
        { keys: 'Tab', description: 'Toggle preview panel' },
        { keys: 'Shift+Tab', description: 'Hide preview panel' },
        { keys: 'Cmd/Ctrl+G', description: 'Toggle sidebar' },
        { keys: 'Cmd/Ctrl+1-9', description: 'Quick select result 1-9' },
        { keys: 'Alt+←', description: 'Go back in navigation history' },
        { keys: 'Backspace', description: 'Go back (when at start of search)' },
        { keys: 'Cmd/Ctrl+Enter', description: 'Copy JOIN SQL' },
        { keys: 'Cmd/Ctrl+Shift+C', description: 'Clear JOIN builder' },
        { keys: 'Shift+Click', description: 'Add table to JOIN on relationship' },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Keyboard Shortcuts</h3>

            {/* Global Hotkey */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Global Hotkey</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Press this keyboard shortcut from anywhere to show Glance
                        </p>
                    </div>
                    <kbd className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow text-sm font-mono">
                        {hotkey.replace('CommandOrControl', '⌘/Ctrl')}
                    </kbd>
                </div>
            </div>

            {/* Shortcuts List */}
            <div className="space-y-1">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {shortcuts.slice(1).map(({ keys, description }) => (
                        <div key={keys} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-gray-600 dark:text-gray-400">{description}</span>
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                                {keys}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>

            {/* Help Text */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-1">💡 Pro Tips</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>Use <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">:col email</code> to search only columns</li>
                    <li>Use <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">:table person</code> to search only tables</li>
                    <li>Multi-word search works: "lac status" finds "MO_CPIS_LAC_LEGAL_STATUS_CODES"</li>
                </ul>
            </div>
        </div>
    );
}
