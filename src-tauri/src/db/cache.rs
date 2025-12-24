use rusqlite::{Connection, params};
use crate::config;
use crate::commands::schema::{Table, Column, ForeignKey, PrimaryKey, SchemaData};
use std::path::PathBuf;

/// Get the path to the SQLite cache database
fn get_cache_path() -> Result<PathBuf, String> {
    config::get_cache_path()
}

/// Initialize the cache database with required tables
pub fn init_cache() -> Result<Connection, String> {
    let cache_path = get_cache_path()?;
    
    // Ensure parent directory exists
    if let Some(parent) = cache_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create cache directory: {}", e))?;
    }
    
    let conn = Connection::open(&cache_path)
        .map_err(|e| format!("Failed to open cache database: {}", e))?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tables (
            id INTEGER PRIMARY KEY,
            schema TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            connection_id TEXT NOT NULL,
            UNIQUE(schema, name, connection_id)
        )",
        [],
    ).map_err(|e| format!("Failed to create tables table: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS columns (
            id INTEGER PRIMARY KEY,
            table_schema TEXT NOT NULL,
            table_name TEXT NOT NULL,
            name TEXT NOT NULL,
            data_type TEXT NOT NULL,
            is_nullable INTEGER NOT NULL,
            is_primary_key INTEGER NOT NULL,
            is_foreign_key INTEGER NOT NULL,
            ordinal_position INTEGER NOT NULL,
            description TEXT,
            connection_id TEXT NOT NULL,
            UNIQUE(table_schema, table_name, name, connection_id)
        )",
        [],
    ).map_err(|e| format!("Failed to create columns table: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS primary_keys (
            id INTEGER PRIMARY KEY,
            table_name TEXT NOT NULL,
            column_name TEXT NOT NULL,
            connection_id TEXT NOT NULL,
            UNIQUE(table_name, column_name, connection_id)
        )",
        [],
    ).map_err(|e| format!("Failed to create primary_keys table: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS foreign_keys (
            id INTEGER PRIMARY KEY,
            constraint_name TEXT NOT NULL,
            parent_table TEXT NOT NULL,
            parent_column TEXT NOT NULL,
            referenced_table TEXT NOT NULL,
            referenced_column TEXT NOT NULL,
            connection_id TEXT NOT NULL,
            UNIQUE(constraint_name, connection_id)
        )",
        [],
    ).map_err(|e| format!("Failed to create foreign_keys table: {}", e))?;
    
    Ok(conn)
}

/// Cache tables in SQLite
pub fn cache_tables(conn: &Connection, tables: &[Table], connection_id: &str) -> Result<(), String> {
    // Clear existing tables for this connection
    conn.execute(
        "DELETE FROM tables WHERE connection_id = ?1",
        params![connection_id],
    ).map_err(|e| format!("Failed to clear tables cache: {}", e))?;
    
    // Insert new tables
    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO tables (schema, name, description, connection_id) VALUES (?1, ?2, ?3, ?4)"
    ).map_err(|e| format!("Failed to prepare insert: {}", e))?;
    
    for table in tables {
        stmt.execute(params![
            &table.schema,
            &table.name,
            &table.description,
            connection_id
        ]).map_err(|e| format!("Failed to insert table: {}", e))?;
    }
    
    Ok(())
}

/// Cache columns in SQLite
pub fn cache_columns(conn: &Connection, columns: &[Column], connection_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM columns WHERE connection_id = ?1",
        params![connection_id],
    ).map_err(|e| format!("Failed to clear columns cache: {}", e))?;
    
    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO columns 
         (table_schema, table_name, name, data_type, is_nullable, is_primary_key, is_foreign_key, ordinal_position, description, connection_id) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    ).map_err(|e| format!("Failed to prepare insert: {}", e))?;
    
    for col in columns {
        stmt.execute(params![
            &col.table_schema,
            &col.table_name,
            &col.name,
            &col.data_type,
            col.is_nullable as i32,
            col.is_primary_key as i32,
            col.is_foreign_key as i32,
            col.ordinal_position,
            &col.description,
            connection_id
        ]).map_err(|e| format!("Failed to insert column: {}", e))?;
    }
    
    Ok(())
}

/// Cache primary keys in SQLite
pub fn cache_primary_keys(conn: &Connection, pks: &[PrimaryKey], connection_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM primary_keys WHERE connection_id = ?1",
        params![connection_id],
    ).map_err(|e| format!("Failed to clear primary_keys cache: {}", e))?;
    
    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO primary_keys (table_name, column_name, connection_id) VALUES (?1, ?2, ?3)"
    ).map_err(|e| format!("Failed to prepare insert: {}", e))?;
    
    for pk in pks {
        stmt.execute(params![
            &pk.table_name,
            &pk.column_name,
            connection_id
        ]).map_err(|e| format!("Failed to insert primary key: {}", e))?;
    }
    
    Ok(())
}

/// Cache foreign keys in SQLite
pub fn cache_foreign_keys(conn: &Connection, fks: &[ForeignKey], connection_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM foreign_keys WHERE connection_id = ?1",
        params![connection_id],
    ).map_err(|e| format!("Failed to clear foreign_keys cache: {}", e))?;
    
    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO foreign_keys 
         (constraint_name, parent_table, parent_column, referenced_table, referenced_column, connection_id) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    ).map_err(|e| format!("Failed to prepare insert: {}", e))?;
    
    for fk in fks {
        stmt.execute(params![
            &fk.constraint_name,
            &fk.parent_table,
            &fk.parent_column,
            &fk.referenced_table,
            &fk.referenced_column,
            connection_id
        ]).map_err(|e| format!("Failed to insert foreign key: {}", e))?;
    }
    
    Ok(())
}

/// Cache complete schema data
pub fn cache_schema(schema: &SchemaData, connection_id: &str) -> Result<(), String> {
    let conn = init_cache()?;
    
    cache_tables(&conn, &schema.tables, connection_id)?;
    cache_columns(&conn, &schema.columns, connection_id)?;
    cache_primary_keys(&conn, &schema.primary_keys, connection_id)?;
    cache_foreign_keys(&conn, &schema.foreign_keys, connection_id)?;
    
    Ok(())
}

/// Load cached schema from SQLite
pub fn load_cached_schema(connection_id: &str) -> Result<SchemaData, String> {
    let conn = init_cache()?;
    
    // Load tables
    let mut stmt = conn.prepare(
        "SELECT schema, name, description FROM tables WHERE connection_id = ?1"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let tables: Vec<Table> = stmt.query_map(params![connection_id], |row| {
        Ok(Table {
            schema: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
        })
    }).map_err(|e| format!("Failed to query tables: {}", e))?
    .filter_map(|r| r.ok())
    .collect();
    
    // Load columns
    let mut stmt = conn.prepare(
        "SELECT table_schema, table_name, name, data_type, is_nullable, is_primary_key, is_foreign_key, ordinal_position, description 
         FROM columns WHERE connection_id = ?1"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let columns: Vec<Column> = stmt.query_map(params![connection_id], |row| {
        Ok(Column {
            table_schema: row.get(0)?,
            table_name: row.get(1)?,
            name: row.get(2)?,
            data_type: row.get(3)?,
            is_nullable: row.get::<_, i32>(4)? != 0,
            is_primary_key: row.get::<_, i32>(5)? != 0,
            is_foreign_key: row.get::<_, i32>(6)? != 0,
            ordinal_position: row.get(7)?,
            description: row.get(8)?,
        })
    }).map_err(|e| format!("Failed to query columns: {}", e))?
    .filter_map(|r| r.ok())
    .collect();
    
    // Load primary keys
    let mut stmt = conn.prepare(
        "SELECT table_name, column_name FROM primary_keys WHERE connection_id = ?1"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let primary_keys: Vec<PrimaryKey> = stmt.query_map(params![connection_id], |row| {
        Ok(PrimaryKey {
            table_name: row.get(0)?,
            column_name: row.get(1)?,
        })
    }).map_err(|e| format!("Failed to query primary_keys: {}", e))?
    .filter_map(|r| r.ok())
    .collect();
    
    // Load foreign keys
    let mut stmt = conn.prepare(
        "SELECT constraint_name, parent_table, parent_column, referenced_table, referenced_column 
         FROM foreign_keys WHERE connection_id = ?1"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let foreign_keys: Vec<ForeignKey> = stmt.query_map(params![connection_id], |row| {
        Ok(ForeignKey {
            constraint_name: row.get(0)?,
            parent_table: row.get(1)?,
            parent_column: row.get(2)?,
            referenced_table: row.get(3)?,
            referenced_column: row.get(4)?,
        })
    }).map_err(|e| format!("Failed to query foreign_keys: {}", e))?
    .filter_map(|r| r.ok())
    .collect();
    
    Ok(SchemaData {
        tables,
        columns,
        primary_keys,
        foreign_keys,
    })
}

/// Check if cache exists for a connection
pub fn has_cached_schema(connection_id: &str) -> bool {
    if let Ok(conn) = init_cache() {
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM tables WHERE connection_id = ?1",
            params![connection_id],
            |row| row.get(0)
        ).unwrap_or(0);
        count > 0
    } else {
        false
    }
}
