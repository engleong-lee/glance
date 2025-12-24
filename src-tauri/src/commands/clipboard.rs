use arboard::Clipboard;

#[tauri::command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new()
        .map_err(|e| format!("Failed to access clipboard: {}", e))?;
    
    clipboard.set_text(&text)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
    
    println!("Copied to clipboard: {}", &text[..text.len().min(50)]);
    Ok(())
}
