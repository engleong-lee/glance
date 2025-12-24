use crate::config::{self, Connection};
use uuid::Uuid;

#[tauri::command]
pub async fn test_connection(
    server: String,
    database: String,
    auth_type: String,
    username: Option<String>,
    password: Option<String>,
) -> Result<String, String> {
    // TODO: Implement actual SQL Server connection test using tiberius
    // For now, return success for valid-looking inputs
    
    if server.is_empty() {
        return Err("Server cannot be empty".to_string());
    }
    
    if database.is_empty() {
        return Err("Database cannot be empty".to_string());
    }
    
    if auth_type == "sql" {
        if username.is_none() || username.as_ref().map(|u| u.is_empty()).unwrap_or(true) {
            return Err("Username is required for SQL authentication".to_string());
        }
        if password.is_none() || password.as_ref().map(|p| p.is_empty()).unwrap_or(true) {
            return Err("Password is required for SQL authentication".to_string());
        }
    }
    
    // Placeholder: In Phase 1, we'll implement actual connection testing
    Ok(format!("Connection test successful: {}\\{}", server, database))
}

#[tauri::command]
pub async fn save_connection(connection: Connection) -> Result<(), String> {
    let mut app_config = config::load_config()?;
    
    // Check if connection already exists
    if let Some(pos) = app_config.connections.iter().position(|c| c.id == connection.id) {
        app_config.connections[pos] = connection;
    } else {
        // If this is marked as default, unmark others
        if connection.is_default {
            for c in &mut app_config.connections {
                c.is_default = false;
            }
        }
        app_config.connections.push(connection);
    }
    
    config::save_config(&app_config)
}

#[tauri::command]
pub async fn get_connections() -> Result<Vec<Connection>, String> {
    let app_config = config::load_config()?;
    Ok(app_config.connections)
}

#[tauri::command]
pub async fn delete_connection(connection_id: String) -> Result<(), String> {
    println!("delete_connection called with id: {}", connection_id);
    let mut app_config = config::load_config()?;
    let before_count = app_config.connections.len();
    app_config.connections.retain(|c| c.id != connection_id);
    let after_count = app_config.connections.len();
    println!("Connections before: {}, after: {}", before_count, after_count);
    config::save_config(&app_config)?;
    println!("Config saved successfully");
    Ok(())
}

#[tauri::command]
pub async fn set_default_connection(connection_id: String) -> Result<(), String> {
    let mut app_config = config::load_config()?;
    
    // Set all connections to non-default, then set the specified one as default
    for c in &mut app_config.connections {
        c.is_default = c.id == connection_id;
    }
    
    config::save_config(&app_config)
}

#[tauri::command]
pub fn generate_connection_id() -> String {
    Uuid::new_v4().to_string()
}
