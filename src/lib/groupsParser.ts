import type { TableGroup, TableGroupItem } from './types';

interface GroupsConfig {
    version: string;
    database?: string;
    groups: TableGroup[];
}

/**
 * Parse groups configuration from JSON
 */
export function parseGroupsConfig(json: string): GroupsConfig {
    try {
        const config = JSON.parse(json) as GroupsConfig;
        validateGroupsConfig(config);
        return config;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Validate groups configuration structure
 */
function validateGroupsConfig(config: unknown): asserts config is GroupsConfig {
    if (!config || typeof config !== 'object') {
        throw new Error('Groups config must be an object');
    }

    const c = config as Record<string, unknown>;

    if (typeof c.version !== 'string') {
        throw new Error('Groups config must have a version field');
    }

    if (!Array.isArray(c.groups)) {
        throw new Error('Groups config must have a groups array');
    }

    for (const group of c.groups) {
        validateGroup(group);
    }
}

/**
 * Validate a single group
 */
function validateGroup(group: unknown): asserts group is TableGroup {
    if (!group || typeof group !== 'object') {
        throw new Error('Each group must be an object');
    }

    const g = group as Record<string, unknown>;

    if (typeof g.id !== 'string' || !g.id) {
        throw new Error('Each group must have an id');
    }

    if (typeof g.name !== 'string' || !g.name) {
        throw new Error('Each group must have a name');
    }

    if (!Array.isArray(g.tables)) {
        throw new Error('Each group must have a tables array');
    }

    for (const table of g.tables) {
        validateTableItem(table);
    }
}

/**
 * Validate a table item within a group
 */
function validateTableItem(table: unknown): asserts table is TableGroupItem {
    if (!table || typeof table !== 'object') {
        throw new Error('Each table must be an object');
    }

    const t = table as Record<string, unknown>;

    if (typeof t.name !== 'string' || !t.name) {
        throw new Error('Each table must have a name');
    }
}

/**
 * Get default empty groups config
 */
export function getDefaultGroupsConfig(): GroupsConfig {
    return {
        version: '1.0',
        groups: []
    };
}

/**
 * Load groups config from local storage
 */
export function loadGroupsFromStorage(): GroupsConfig | null {
    try {
        const stored = localStorage.getItem('glance_groups');
        if (stored) {
            return parseGroupsConfig(stored);
        }
        return null;
    } catch (error) {
        console.error('Failed to load groups from storage:', error);
        return null;
    }
}

/**
 * Save groups config to local storage
 */
export function saveGroupsToStorage(config: GroupsConfig): void {
    try {
        localStorage.setItem('glance_groups', JSON.stringify(config));
    } catch (error) {
        console.error('Failed to save groups to storage:', error);
    }
}

/**
 * Example groups config for demonstration
 */
export function getExampleGroupsConfig(): GroupsConfig {
    return {
        version: '1.0',
        database: 'Example',
        groups: [
            {
                id: 'person-management',
                name: 'Person Management',
                description: 'Core person/client records and related data',
                icon: '👤',
                entryPoint: 'PERSON',
                tables: [
                    {
                        name: 'PERSON',
                        description: 'Core client record - one row per person',
                        tips: 'Always check status_id before assuming active',
                    },
                    {
                        name: 'PERSON_ADDRESS',
                        description: 'Address history for persons',
                    },
                    {
                        name: 'PERSON_CONTACT',
                        description: 'Phone numbers, emails, etc.',
                    },
                ],
            },
            {
                id: 'care-packages',
                name: 'Care Packages',
                description: 'Service packages and allocations',
                icon: '📦',
                entryPoint: 'CARE_PACKAGE',
                tables: [
                    {
                        name: 'CARE_PACKAGE',
                        description: 'Main care package record',
                    },
                    {
                        name: 'CARE_PACKAGE_ITEM',
                        description: 'Individual services in a package',
                    },
                ],
            },
        ],
    };
}
