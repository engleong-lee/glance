import { invoke } from '@tauri-apps/api/core';
import type { Connection, SchemaData, AppConfig, Settings } from './types';

// Connection commands
export async function testConnection(
    server: string,
    database: string,
    authType: 'windows' | 'sql',
    username?: string,
    password?: string
): Promise<string> {
    return invoke('test_connection', { server, database, authType, username, password });
}

export async function saveConnection(connection: Connection): Promise<void> {
    return invoke('save_connection', { connection });
}

export async function getConnections(): Promise<Connection[]> {
    return invoke('get_connections');
}

export async function deleteConnection(connectionId: string): Promise<void> {
    return invoke('delete_connection', { connectionId });
}

export async function setDefaultConnection(connectionId: string): Promise<void> {
    return invoke('set_default_connection', { connectionId });
}

// Schema commands
export async function indexSchema(connectionId: string, password?: string): Promise<SchemaData> {
    return invoke('index_schema', { connectionId, password });
}

export async function getSchema(): Promise<SchemaData> {
    return invoke('get_schema');
}

export async function refreshSchema(connectionId: string): Promise<SchemaData> {
    return invoke('refresh_schema', { connectionId });
}

// Clipboard commands
export async function copyToClipboard(text: string): Promise<void> {
    return invoke('copy_to_clipboard', { text });
}

// Settings commands
export async function getSettings(): Promise<Settings> {
    return invoke('get_settings');
}

export async function saveSettings(settings: Settings): Promise<void> {
    return invoke('save_settings', { settings });
}

// Config commands
export async function getConfig(): Promise<AppConfig> {
    return invoke('get_config');
}

export async function saveConfig(config: AppConfig): Promise<void> {
    return invoke('save_config', { config });
}

// Window commands
export async function showWindow(): Promise<void> {
    return invoke('show_window');
}

export async function hideWindow(): Promise<void> {
    return invoke('hide_window');
}

export async function toggleWindow(): Promise<void> {
    return invoke('toggle_window');
}
