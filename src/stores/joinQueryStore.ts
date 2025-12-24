import { create } from 'zustand';
import type { ForeignKey, Column } from '../lib/types';

export interface JoinTable {
    name: string;
    alias: string;
    selectedColumns: string[];
    useStar: boolean; // Use table.* instead of individual columns
    joinCondition?: {
        fromTable: string;
        fromColumn: string;
        toTable: string;
        toColumn: string;
    };
}

interface JoinQueryState {
    tables: JoinTable[];
    isBuilding: boolean;

    // Actions
    addTable: (tableName: string, foreignKey?: ForeignKey, allColumns?: Column[]) => void;
    removeTable: (tableName: string) => void;
    toggleColumn: (tableName: string, columnName: string) => void;
    toggleStar: (tableName: string) => void;
    selectAllColumns: (tableName: string, columns: Column[]) => void;
    clearAllColumns: (tableName: string) => void;
    clearQuery: () => void;
    setBuilding: (building: boolean) => void;
    getGeneratedSQL: () => string;
}

// Generate smart alias for table name
function generateAlias(tableName: string, existingAliases: string[]): string {
    // Try first letter
    let alias = tableName.charAt(0).toLowerCase();
    if (!existingAliases.includes(alias)) return alias;

    // Try first two letters
    alias = tableName.substring(0, 2).toLowerCase();
    if (!existingAliases.includes(alias)) return alias;

    // Try first letter of each word (split by underscore)
    const parts = tableName.split('_');
    alias = parts.map(p => p.charAt(0).toLowerCase()).join('');
    if (!existingAliases.includes(alias)) return alias;

    // Try first three letters
    alias = tableName.substring(0, 3).toLowerCase();
    if (!existingAliases.includes(alias)) return alias;

    // Append number
    let counter = 1;
    alias = tableName.charAt(0).toLowerCase();
    while (existingAliases.includes(`${alias}${counter}`)) {
        counter++;
    }
    return `${alias}${counter}`;
}

export const useJoinQueryStore = create<JoinQueryState>((set, get) => ({
    tables: [],
    isBuilding: false,

    addTable: (tableName: string, foreignKey?: ForeignKey, allColumns?: Column[]) => {
        const { tables } = get();

        // Don't add if already exists
        if (tables.some(t => t.name.toLowerCase() === tableName.toLowerCase())) {
            return;
        }

        const existingAliases = tables.map(t => t.alias);
        const alias = generateAlias(tableName, existingAliases);

        // Default selected columns: just the PK or first few columns
        const defaultColumns: string[] = [];
        if (allColumns) {
            const tableColumns = allColumns.filter(c =>
                c.tableName.toLowerCase() === tableName.toLowerCase()
            );
            // Select first 3 columns by default
            tableColumns.slice(0, 3).forEach(c => defaultColumns.push(c.name));
        }

        const newTable: JoinTable = {
            name: tableName,
            alias,
            selectedColumns: defaultColumns,
            useStar: false,
            joinCondition: foreignKey ? {
                fromTable: foreignKey.parentTable,
                fromColumn: foreignKey.parentColumn,
                toTable: foreignKey.referencedTable,
                toColumn: foreignKey.referencedColumn,
            } : undefined,
        };

        set({
            tables: [...tables, newTable],
            isBuilding: true,
        });
    },

    removeTable: (tableName: string) => {
        const { tables } = get();
        const newTables = tables.filter(t => t.name.toLowerCase() !== tableName.toLowerCase());
        set({
            tables: newTables,
            isBuilding: newTables.length > 0,
        });
    },

    toggleColumn: (tableName: string, columnName: string) => {
        const { tables } = get();
        const newTables = tables.map(t => {
            if (t.name.toLowerCase() === tableName.toLowerCase()) {
                const hasColumn = t.selectedColumns.includes(columnName);
                return {
                    ...t,
                    useStar: false, // Disable star when selecting individual columns
                    selectedColumns: hasColumn
                        ? t.selectedColumns.filter(c => c !== columnName)
                        : [...t.selectedColumns, columnName],
                };
            }
            return t;
        });
        set({ tables: newTables });
    },

    toggleStar: (tableName: string) => {
        const { tables } = get();
        const newTables = tables.map(t => {
            if (t.name.toLowerCase() === tableName.toLowerCase()) {
                return {
                    ...t,
                    useStar: !t.useStar,
                    selectedColumns: [], // Clear individual columns when using *
                };
            }
            return t;
        });
        set({ tables: newTables });
    },

    selectAllColumns: (tableName: string, columns: Column[]) => {
        const { tables } = get();
        const tableColumns = columns
            .filter(c => c.tableName.toLowerCase() === tableName.toLowerCase())
            .map(c => c.name);

        const newTables = tables.map(t => {
            if (t.name.toLowerCase() === tableName.toLowerCase()) {
                return { ...t, selectedColumns: tableColumns };
            }
            return t;
        });
        set({ tables: newTables });
    },

    clearAllColumns: (tableName: string) => {
        const { tables } = get();
        const newTables = tables.map(t => {
            if (t.name.toLowerCase() === tableName.toLowerCase()) {
                return { ...t, selectedColumns: [] };
            }
            return t;
        });
        set({ tables: newTables });
    },

    clearQuery: () => {
        set({ tables: [], isBuilding: false });
    },

    setBuilding: (building: boolean) => {
        set({ isBuilding: building });
    },

    getGeneratedSQL: () => {
        const { tables } = get();
        if (tables.length === 0) return '';

        // Build SELECT clause
        const selectParts: string[] = [];
        tables.forEach(t => {
            if (t.useStar) {
                selectParts.push(`${t.alias}.*`);
            } else {
                t.selectedColumns.forEach(col => {
                    selectParts.push(`${t.alias}.${col}`);
                });
            }
        });

        // If no columns selected, use * from first table
        const selectClause = selectParts.length > 0
            ? selectParts.join(',\n    ')
            : `${tables[0].alias}.*`;

        // Build FROM clause
        const firstTable = tables[0];
        let fromClause = `${firstTable.name} ${firstTable.alias}`;

        // Build JOIN clauses
        const joinClauses: string[] = [];
        for (let i = 1; i < tables.length; i++) {
            const table = tables[i];
            if (table.joinCondition) {
                const { fromTable, fromColumn, toTable, toColumn } = table.joinCondition;

                // Find aliases
                const fromAlias = tables.find(t =>
                    t.name.toLowerCase() === fromTable.toLowerCase()
                )?.alias || fromTable;
                const toAlias = tables.find(t =>
                    t.name.toLowerCase() === toTable.toLowerCase()
                )?.alias || toTable;

                // Determine which side is this table
                if (table.name.toLowerCase() === toTable.toLowerCase()) {
                    joinClauses.push(
                        `JOIN ${table.name} ${table.alias} ON ${table.alias}.${toColumn} = ${fromAlias}.${fromColumn}`
                    );
                } else {
                    joinClauses.push(
                        `JOIN ${table.name} ${table.alias} ON ${table.alias}.${fromColumn} = ${toAlias}.${toColumn}`
                    );
                }
            } else {
                // No join condition, just add the table (cross join)
                joinClauses.push(`CROSS JOIN ${table.name} ${table.alias}`);
            }
        }

        // Combine
        let sql = `SELECT \n    ${selectClause}\nFROM ${fromClause}`;
        if (joinClauses.length > 0) {
            sql += '\n' + joinClauses.join('\n');
        }

        return sql;
    },
}));
