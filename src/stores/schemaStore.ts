import { create } from 'zustand';
import type { Table, Column, ForeignKey, PrimaryKey, SchemaData } from '../lib/types';
import { indexSchema, getSchema } from '../lib/tauri';

interface SchemaState {
    tables: Table[];
    columns: Column[];
    foreignKeys: ForeignKey[];
    primaryKeys: PrimaryKey[];
    isIndexing: boolean;
    indexingProgress: number;
    indexingStatus: string;
    lastIndexed: string | null;
    error: string | null;

    // Actions
    indexSchemaFromServer: (connectionId: string) => Promise<void>;
    loadSchemaFromCache: (connectionId?: string) => Promise<void>;
    setProgress: (progress: number, status: string) => void;
    clearSchema: () => void;
    clearError: () => void;
}

export const useSchemaStore = create<SchemaState>((set) => ({
    tables: [],
    columns: [],
    foreignKeys: [],
    primaryKeys: [],
    isIndexing: false,
    indexingProgress: 0,
    indexingStatus: '',
    lastIndexed: null,
    error: null,

    indexSchemaFromServer: async (connectionId: string) => {
        set({
            isIndexing: true,
            indexingProgress: 0,
            indexingStatus: 'Connecting to database...',
            error: null
        });

        try {
            set({ indexingProgress: 10, indexingStatus: 'Extracting tables...' });

            const schema: SchemaData = await indexSchema(connectionId);

            set({ indexingProgress: 80, indexingStatus: 'Processing schema...' });

            set({
                tables: schema.tables,
                columns: schema.columns,
                foreignKeys: schema.foreignKeys,
                primaryKeys: schema.primaryKeys,
                isIndexing: false,
                indexingProgress: 100,
                indexingStatus: 'Complete!',
                lastIndexed: new Date().toISOString(),
            });

        } catch (err) {
            set({
                isIndexing: false,
                indexingProgress: 0,
                indexingStatus: '',
                error: err as string
            });
        }
    },

    loadSchemaFromCache: async (_connectionId?: string) => {
        set({
            isIndexing: true,
            indexingProgress: 0,
            indexingStatus: 'Loading from cache...',
            error: null
        });

        try {
            const schema: SchemaData = await getSchema();

            set({
                tables: schema.tables,
                columns: schema.columns,
                foreignKeys: schema.foreignKeys,
                primaryKeys: schema.primaryKeys,
                isIndexing: false,
                indexingProgress: 100,
                indexingStatus: 'Loaded from cache',
            });

        } catch (err) {
            set({
                isIndexing: false,
                indexingProgress: 0,
                indexingStatus: '',
                error: err as string
            });
        }
    },

    setProgress: (progress: number, status: string) => {
        set({ indexingProgress: progress, indexingStatus: status });
    },

    clearSchema: () => {
        set({
            tables: [],
            columns: [],
            foreignKeys: [],
            primaryKeys: [],
            lastIndexed: null,
        });
    },

    clearError: () => {
        set({ error: null });
    },
}));
