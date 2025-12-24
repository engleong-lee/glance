// Database connection types
export interface Connection {
    id: string;
    name: string;
    server: string;
    database: string;
    authType: 'windows' | 'sql';
    username?: string;
    isDefault: boolean;
}

// Schema types
export interface Table {
    schema: string;
    name: string;
    description?: string;
    tips?: string;
}

export interface Column {
    tableSchema: string;
    tableName: string;
    name: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    ordinalPosition: number;
    description?: string;
}

export interface ForeignKey {
    constraintName: string;
    parentTable: string;
    parentColumn: string;
    referencedTable: string;
    referencedColumn: string;
}

export interface PrimaryKey {
    tableName: string;
    columnName: string;
}

// Search types
export type SearchResultType = 'table' | 'column';

export interface SearchResult {
    type: SearchResultType;
    name: string;
    displayName: string;
    description?: string;
    table?: string; // For columns, the parent table
    score: number;
}

// Schema data combined
export interface SchemaData {
    tables: Table[];
    columns: Column[];
    foreignKeys: ForeignKey[];
    primaryKeys: PrimaryKey[];
}

// Settings
export interface Settings {
    hotkey: string;
    rowLimit: number;
    theme: 'light' | 'dark' | 'system';
    autoRefresh: boolean;
    copyBehavior: 'copyOnly' | 'copyAndClose';
    groupsFilePath?: string;
}

// Groups configuration
export interface TableGroup {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    entryPoint?: string;
    tables: TableGroupItem[];
}

export interface TableGroupItem {
    name: string;
    description?: string;
    tips?: string;
    columns?: Record<string, { description: string }>;
}

// Recent history
export interface RecentItem {
    type: SearchResultType;
    name: string;
    timestamp: string;
}

// App configuration
export interface AppConfig {
    connections: Connection[];
    settings: Settings;
    recent: RecentItem[];
}
