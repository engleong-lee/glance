import type { SearchResult, PrimaryKey } from './types';

/**
 * Generate SELECT SQL for a table
 */
export function generateTableSelect(tableName: string): string {
    return `SELECT * FROM ${tableName}`;
}

/**
 * Generate SELECT SQL for a specific column
 * Format: SELECT <column>, * FROM tablename
 */
export function generateColumnSelect(
    tableName: string,
    columnName: string
): string {
    return `SELECT ${columnName}, * FROM ${tableName}`;
}

/**
 * Generate SQL from a search result
 */
export function generateSqlFromResult(
    result: SearchResult,
    _primaryKeys: PrimaryKey[] = [],
    _options: Record<string, unknown> = {}
): string {
    if (result.type === 'table') {
        return generateTableSelect(result.displayName);
    }

    // For columns, result.table contains the table name
    const tableName = result.table || result.displayName.split('.')[0];
    const columnName = result.name;

    return generateColumnSelect(tableName, columnName);
}

/**
 * Generate a JOIN query between two tables
 * (For Phase 2)
 */
export function generateJoinQuery(
    table1: string,
    table2: string,
    joinColumn: string
): string {
    // Generate aliases from table names
    const alias1 = table1.charAt(0).toLowerCase();
    const alias2 = table2.charAt(0).toLowerCase() + '2';

    return `SELECT
    ${alias1}.*,
    ${alias2}.*
FROM ${table1} ${alias1}
JOIN ${table2} ${alias2} ON ${alias2}.${joinColumn} = ${alias1}.id`;
}
