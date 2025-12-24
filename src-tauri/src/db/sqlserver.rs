use tiberius::{Client, Config, AuthMethod};
use tokio::net::TcpStream;
use tokio_util::compat::TokioAsyncWriteCompatExt;
use crate::config::Connection;
use crate::commands::schema::{Table, Column, ForeignKey, PrimaryKey, SchemaData};

/// Connect to SQL Server using the provided connection config and password
pub async fn connect(connection: &Connection, password: Option<&str>) -> Result<Client<tokio_util::compat::Compat<TcpStream>>, String> {
    let mut config = Config::new();
    
    // Parse server - handle instance names like "localhost\SQLEXPRESS"
    let server_parts: Vec<&str> = connection.server.split('\\').collect();
    let host = server_parts[0];
    
    config.host(host);
    config.port(1433); // Default SQL Server port
    config.database(&connection.database);
    config.trust_cert(); // For development - remove in production
    
    // Set authentication
    if connection.auth_type == "sql" {
        if let Some(ref username) = connection.username {
            let pwd = password.unwrap_or("");
            println!("Authenticating as SQL user: {}", username);
            config.authentication(AuthMethod::sql_server(username, pwd));
        } else {
            return Err("Username is required for SQL authentication".to_string());
        }
    } else {
        // Windows authentication - use integrated security via SSPI
        #[cfg(windows)]
        {
            config.authentication(AuthMethod::Integrated);
        }
        #[cfg(not(windows))]
        {
            return Err("Windows authentication is only available on Windows".to_string());
        }
    }
    
    println!("Connecting to {}:{}", host, 1433);
    
    // Connect
    let tcp = TcpStream::connect(config.get_addr())
        .await
        .map_err(|e| format!("Failed to connect to SQL Server: {}", e))?;
    
    tcp.set_nodelay(true).ok();
    
    let client = Client::connect(config, tcp.compat_write())
        .await
        .map_err(|e| format!("Failed to authenticate with SQL Server: {}", e))?;
    
    println!("Connected successfully!");
    Ok(client)
}

/// Extract all tables from the database
pub async fn get_tables(client: &mut Client<tokio_util::compat::Compat<TcpStream>>) -> Result<Vec<Table>, String> {
    let query = r#"
        SELECT TABLE_SCHEMA, TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
    "#;
    
    let stream = client.query(query, &[])
        .await
        .map_err(|e| format!("Failed to query tables: {}", e))?;
    
    let rows = stream.into_first_result()
        .await
        .map_err(|e| format!("Failed to fetch tables: {}", e))?;
    
    let mut tables = Vec::new();
    for row in rows {
        let schema: &str = row.get(0).unwrap_or("dbo");
        let name: &str = row.get(1).unwrap_or("");
        
        tables.push(Table {
            schema: schema.to_string(),
            name: name.to_string(),
            description: None,
        });
    }
    
    Ok(tables)
}

/// Extract all columns from the database
pub async fn get_columns(client: &mut Client<tokio_util::compat::Compat<TcpStream>>) -> Result<Vec<Column>, String> {
    let query = r#"
        SELECT 
            c.TABLE_SCHEMA,
            c.TABLE_NAME,
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.IS_NULLABLE,
            c.ORDINAL_POSITION
        FROM INFORMATION_SCHEMA.COLUMNS c
        ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
    "#;
    
    let stream = client.query(query, &[])
        .await
        .map_err(|e| format!("Failed to query columns: {}", e))?;
    
    let rows = stream.into_first_result()
        .await
        .map_err(|e| format!("Failed to fetch columns: {}", e))?;
    
    let mut columns = Vec::new();
    for row in rows {
        let table_schema: &str = row.get(0).unwrap_or("dbo");
        let table_name: &str = row.get(1).unwrap_or("");
        let name: &str = row.get(2).unwrap_or("");
        let data_type: &str = row.get(3).unwrap_or("");
        let is_nullable: &str = row.get(4).unwrap_or("YES");
        let ordinal: i32 = row.get(5).unwrap_or(0);
        
        columns.push(Column {
            table_schema: table_schema.to_string(),
            table_name: table_name.to_string(),
            name: name.to_string(),
            data_type: data_type.to_string(),
            is_nullable: is_nullable == "YES",
            is_primary_key: false, // Will be updated later
            is_foreign_key: false, // Will be updated later
            ordinal_position: ordinal,
            description: None,
        });
    }
    
    Ok(columns)
}

/// Extract primary keys
pub async fn get_primary_keys(client: &mut Client<tokio_util::compat::Compat<TcpStream>>) -> Result<Vec<PrimaryKey>, String> {
    let query = r#"
        SELECT 
            t.name AS table_name,
            c.name AS column_name
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        INNER JOIN sys.tables t ON i.object_id = t.object_id
        WHERE i.is_primary_key = 1
    "#;
    
    let stream = client.query(query, &[])
        .await
        .map_err(|e| format!("Failed to query primary keys: {}", e))?;
    
    let rows = stream.into_first_result()
        .await
        .map_err(|e| format!("Failed to fetch primary keys: {}", e))?;
    
    let mut pks = Vec::new();
    for row in rows {
        let table_name: &str = row.get(0).unwrap_or("");
        let column_name: &str = row.get(1).unwrap_or("");
        
        pks.push(PrimaryKey {
            table_name: table_name.to_string(),
            column_name: column_name.to_string(),
        });
    }
    
    Ok(pks)
}

/// Extract foreign keys
pub async fn get_foreign_keys(client: &mut Client<tokio_util::compat::Compat<TcpStream>>) -> Result<Vec<ForeignKey>, String> {
    let query = r#"
        SELECT 
            fk.name AS constraint_name,
            tp.name AS parent_table,
            cp.name AS parent_column,
            tr.name AS referenced_table,
            cr.name AS referenced_column
        FROM sys.foreign_keys fk
        INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
        INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
        INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
        INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    "#;
    
    let stream = client.query(query, &[])
        .await
        .map_err(|e| format!("Failed to query foreign keys: {}", e))?;
    
    let rows = stream.into_first_result()
        .await
        .map_err(|e| format!("Failed to fetch foreign keys: {}", e))?;
    
    let mut fks = Vec::new();
    for row in rows {
        let constraint_name: &str = row.get(0).unwrap_or("");
        let parent_table: &str = row.get(1).unwrap_or("");
        let parent_column: &str = row.get(2).unwrap_or("");
        let referenced_table: &str = row.get(3).unwrap_or("");
        let referenced_column: &str = row.get(4).unwrap_or("");
        
        fks.push(ForeignKey {
            constraint_name: constraint_name.to_string(),
            parent_table: parent_table.to_string(),
            parent_column: parent_column.to_string(),
            referenced_table: referenced_table.to_string(),
            referenced_column: referenced_column.to_string(),
        });
    }
    
    Ok(fks)
}

/// Extract complete schema from database
pub async fn extract_schema(connection: &Connection, password: Option<&str>) -> Result<SchemaData, String> {
    let mut client = connect(connection, password).await?;
    
    println!("Extracting tables...");
    let tables = get_tables(&mut client).await?;
    println!("Found {} tables", tables.len());
    
    println!("Extracting columns...");
    let mut columns = get_columns(&mut client).await?;
    println!("Found {} columns", columns.len());
    
    println!("Extracting primary keys...");
    let primary_keys = get_primary_keys(&mut client).await?;
    
    println!("Extracting foreign keys...");
    let foreign_keys = get_foreign_keys(&mut client).await?;
    
    // Mark primary key and foreign key columns
    for col in &mut columns {
        // Check if this column is a primary key
        col.is_primary_key = primary_keys.iter().any(|pk| {
            pk.table_name.eq_ignore_ascii_case(&col.table_name) && 
            pk.column_name.eq_ignore_ascii_case(&col.name)
        });
        
        // Check if this column is a foreign key
        col.is_foreign_key = foreign_keys.iter().any(|fk| {
            fk.parent_table.eq_ignore_ascii_case(&col.table_name) && 
            fk.parent_column.eq_ignore_ascii_case(&col.name)
        });
    }
    
    Ok(SchemaData {
        tables,
        columns,
        primary_keys,
        foreign_keys,
    })
}
