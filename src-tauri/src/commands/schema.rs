use serde::{Deserialize, Serialize};
use crate::config;
use crate::db::{sqlserver, cache};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Table {
    pub schema: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub table_schema: String,
    pub table_name: String,
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
    pub is_foreign_key: bool,
    pub ordinal_position: i32,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForeignKey {
    pub constraint_name: String,
    pub parent_table: String,
    pub parent_column: String,
    pub referenced_table: String,
    pub referenced_column: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrimaryKey {
    pub table_name: String,
    pub column_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SchemaData {
    pub tables: Vec<Table>,
    pub columns: Vec<Column>,
    pub foreign_keys: Vec<ForeignKey>,
    pub primary_keys: Vec<PrimaryKey>,
}

/// Index schema from SQL Server and cache it locally
#[tauri::command]
pub async fn index_schema(connection_id: String, password: Option<String>) -> Result<SchemaData, String> {
    let app_config = config::load_config()?;
    
    // Find the connection
    let connection = app_config.connections.iter()
        .find(|c| c.id == connection_id)
        .ok_or_else(|| "Connection not found".to_string())?;
    
    println!("=== INDEX SCHEMA DEBUG ===");
    println!("Connection ID: {}", connection_id);
    println!("Server: {}", connection.server);
    println!("Database: {}", connection.database);
    println!("Auth Type: {}", connection.auth_type);
    println!("Password provided: {}", password.is_some());
    
    // Try to extract schema from SQL Server
    let pwd_ref = password.as_deref();
    let schema = match sqlserver::extract_schema(connection, pwd_ref).await {
        Ok(s) => {
            println!("SUCCESS: Extracted {} tables, {} columns", s.tables.len(), s.columns.len());
            s
        },
        Err(e) => {
            println!("ERROR: SQL Server connection failed: {}", e);
            
            // If SQL Server connection fails, check if we have cached data
            if cache::has_cached_schema(&connection_id) {
                println!("FALLBACK: Using cached schema");
                return cache::load_cached_schema(&connection_id);
            }
            
            // Return the actual error so the user can see what's wrong
            return Err(format!("SQL Server connection failed: {}", e));
        }
    };
    
    // Cache the schema for offline use
    if let Err(e) = cache::cache_schema(&schema, &connection_id) {
        eprintln!("Warning: Failed to cache schema: {}", e);
    }
    
    Ok(schema)
}

/// Get schema from cache (fast, offline)
#[tauri::command]
pub async fn get_schema(connection_id: Option<String>) -> Result<SchemaData, String> {
    // If no connection_id provided, try to get from default connection
    let conn_id = match connection_id {
        Some(id) => id,
        None => {
            let app_config = config::load_config()?;
            app_config.connections.iter()
                .find(|c| c.is_default)
                .map(|c| c.id.clone())
                .ok_or_else(|| "No default connection configured".to_string())?
        }
    };
    
    // Try to load from cache
    if cache::has_cached_schema(&conn_id) {
        return cache::load_cached_schema(&conn_id);
    }
    
    // If no cache, return error - we can't connect without password
    Err("No cached schema found. Please connect with password first.".to_string())
}

/// Refresh schema - always fetches from SQL Server
#[tauri::command]
pub async fn refresh_schema(connection_id: String, password: Option<String>) -> Result<SchemaData, String> {
    index_schema(connection_id, password).await
}
