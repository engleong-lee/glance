import { useState } from 'react';
import type { Connection } from '../lib/types';
import { testConnection, saveConnection } from '../lib/tauri';

interface ConnectionFormProps {
    onConnectionSaved?: (connection: Connection, password?: string) => void;
    existingConnection?: Connection;
    onBack?: () => void;
}

export function ConnectionForm({ onConnectionSaved, existingConnection, onBack }: ConnectionFormProps) {
    const [server, setServer] = useState(existingConnection?.server || '');
    const [database, setDatabase] = useState(existingConnection?.database || '');
    const [authType, setAuthType] = useState<'windows' | 'sql'>(
        (existingConnection?.authType as 'windows' | 'sql') || 'sql'  // Default to SQL auth
    );
    const [username, setUsername] = useState(existingConnection?.username || '');
    const [password, setPassword] = useState('');
    const [connectionName, setConnectionName] = useState(existingConnection?.name || '');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleTestConnection = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await testConnection(
                server,
                database,
                authType,
                authType === 'sql' ? username : undefined,
                authType === 'sql' ? password : undefined
            );
            setSuccess(result);
        } catch (err) {
            setError(err as string);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConnection = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const connection: Connection = {
                id: existingConnection?.id || crypto.randomUUID(),
                name: connectionName || `${server}/${database}`,
                server,
                database,
                authType,
                username: authType === 'sql' ? username : undefined,
                isDefault: existingConnection?.isDefault ?? true,
            };

            await saveConnection(connection);
            setSuccess('Connection saved successfully!');
            onConnectionSaved?.(connection, authType === 'sql' ? password : undefined);
        } catch (err) {
            setError(err as string);
        } finally {
            setIsLoading(false);
        }
    };

    // Common input props to disable autocorrect/autocomplete
    const inputProps = {
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false,
        'data-form-type': 'other',
    };

    // Handle keyboard events to prevent global handlers from capturing Tab
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.stopPropagation(); // Prevent App.tsx global Tab handler
        }
    };

    return (
        <div className="connection-form" onKeyDown={handleKeyDown}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                    {existingConnection ? 'Edit Connection' : 'Database Connection'}
                </h2>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                    >
                        ← Back
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Connection Name</label>
                    <input
                        type="text"
                        value={connectionName}
                        onChange={(e) => setConnectionName(e.target.value)}
                        placeholder="e.g., Production DB"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...inputProps}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Server</label>
                    <input
                        type="text"
                        value={server}
                        onChange={(e) => setServer(e.target.value)}
                        placeholder="localhost\SQLEXPRESS"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...inputProps}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Database</label>
                    <input
                        type="text"
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                        placeholder="DatabaseName"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...inputProps}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Authentication</label>
                    <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value as 'windows' | 'sql')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="sql">SQL Server Authentication</option>
                        <option value="windows">Windows Authentication</option>
                    </select>
                </div>

                {authType === 'sql' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="sa"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                {...inputProps}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                        </div>
                    </>
                )}

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                        {success}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleTestConnection}
                        disabled={isLoading || !server || !database}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Testing...' : 'Test Connection'}
                    </button>

                    <button
                        onClick={handleSaveConnection}
                        disabled={isLoading || !server || !database}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Save & Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
}
