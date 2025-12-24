pub mod settings;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Connection {
    pub id: String,
    pub name: String,
    pub server: String,
    pub database: String,
    pub auth_type: String,
    pub username: Option<String>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub hotkey: String,
    pub row_limit: u32,
    pub theme: String,
    pub auto_refresh: bool,
    pub copy_behavior: String,
    pub groups_file_path: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            hotkey: "Ctrl+Shift+Space".to_string(),
            row_limit: 100,
            theme: "system".to_string(),
            auto_refresh: false,
            copy_behavior: "copyOnly".to_string(),
            groups_file_path: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentItem {
    pub item_type: String,
    pub name: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub connections: Vec<Connection>,
    pub settings: Settings,
    pub recent: Vec<RecentItem>,
}

/// Get the configuration directory for the app
pub fn get_config_dir() -> Result<PathBuf, String> {
    dirs::config_dir()
        .map(|p| p.join("glance"))
        .ok_or_else(|| "Could not determine config directory".to_string())
}

/// Get the path to the config file
pub fn get_config_path() -> Result<PathBuf, String> {
    get_config_dir().map(|p| p.join("config.json"))
}

/// Get the path to the schema cache database
pub fn get_cache_path() -> Result<PathBuf, String> {
    get_config_dir().map(|p| p.join("schema_cache.db"))
}

/// Load the application configuration
pub fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path()?;
    
    if !config_path.exists() {
        // Return default config if file doesn't exist
        return Ok(AppConfig::default());
    }
    
    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config file: {}", e))
}

/// Save the application configuration
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path()?;
    let config_dir = get_config_dir()?;
    
    // Create config directory if it doesn't exist
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))
}
