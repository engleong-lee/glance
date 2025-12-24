import { create } from 'zustand';
import type { Connection, SchemaData } from '../lib/types';
import { getConnections, saveConnection as saveConnectionApi, deleteConnection as deleteConnectionApi, setDefaultConnection as setDefaultConnectionApi, indexSchema } from '../lib/tauri';

interface ConnectionState {
    connections: Connection[];
    currentConnection: Connection | null;
    isConnected: boolean;
    isConnecting: boolean;
    isIndexing: boolean;
    indexingProgress: number;
    schema: SchemaData | null;
    error: string | null;

    // Actions
    loadConnections: () => Promise<void>;
    setCurrentConnection: (connection: Connection | null) => void;
    saveConnection: (connection: Connection) => Promise<void>;
    deleteConnection: (connectionId: string) => Promise<void>;
    setDefaultConnection: (connectionId: string) => Promise<void>;
    connect: (connection: Connection, password?: string) => Promise<void>;
    disconnect: () => void;
    clearError: () => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
    connections: [],
    currentConnection: null,
    isConnected: false,
    isConnecting: false,
    isIndexing: false,
    indexingProgress: 0,
    schema: null,
    error: null,

    loadConnections: async () => {
        console.log('loadConnections called');
        try {
            const connections = await getConnections();
            console.log('loadConnections got:', connections.length, 'connections', connections);
            set({ connections });

            // Auto-select default connection
            const defaultConnection = connections.find(c => c.isDefault);
            if (defaultConnection) {
                set({ currentConnection: defaultConnection });
            }
        } catch (err) {
            console.error('loadConnections error:', err);
            set({ error: err as string });
        }
    },

    setCurrentConnection: (connection) => {
        set({ currentConnection: connection });
    },

    saveConnection: async (connection) => {
        try {
            await saveConnectionApi(connection);
            await get().loadConnections();
        } catch (err) {
            set({ error: err as string });
        }
    },

    deleteConnection: async (connectionId) => {
        console.log('deleteConnection called with id:', connectionId);
        try {
            await deleteConnectionApi(connectionId);
            console.log('deleteConnectionApi completed successfully');
            await get().loadConnections();
            console.log('loadConnections completed');

            // If we deleted the current connection, clear it
            const current = get().currentConnection;
            if (current?.id === connectionId) {
                set({ currentConnection: null, isConnected: false, schema: null });
            }
        } catch (err) {
            console.error('deleteConnection error:', err);
            set({ error: err as string });
        }
    },

    setDefaultConnection: async (connectionId) => {
        try {
            await setDefaultConnectionApi(connectionId);
            await get().loadConnections();
        } catch (err) {
            set({ error: err as string });
        }
    },

    connect: async (connection, password) => {
        set({ isConnecting: true, error: null });

        try {
            set({ currentConnection: connection, isConnecting: false, isConnected: true });

            // Start indexing schema
            set({ isIndexing: true, indexingProgress: 0 });

            console.log('Calling indexSchema with connection id:', connection.id);
            const schema = await indexSchema(connection.id, password);
            console.log('Schema received:', {
                tables: schema?.tables?.length ?? 0,
                columns: schema?.columns?.length ?? 0,
                primaryKeys: schema?.primaryKeys?.length ?? 0,
                foreignKeys: schema?.foreignKeys?.length ?? 0,
            });
            console.log('Schema received:', {
                tables: schema?.tables?.length ?? 0,
                columns: schema?.columns?.length ?? 0,
                primaryKeys: schema?.primaryKeys?.length ?? 0,
                foreignKeys: schema?.foreignKeys?.length ?? 0,
            });

            set({
                schema,
                isIndexing: false,
                indexingProgress: 100,
            });
        } catch (err) {
            console.error('Error indexing schema:', err);
            set({
                error: err as string,
                isConnecting: false,
                isIndexing: false
            });
        }
    },

    disconnect: () => {
        set({
            isConnected: false,
            currentConnection: null,
            schema: null,
            indexingProgress: 0
        });
    },

    clearError: () => {
        set({ error: null });
    },
}));
