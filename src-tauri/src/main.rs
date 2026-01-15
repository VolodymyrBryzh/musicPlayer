// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::Engine;
use id3::TagLike;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use walkdir::WalkDir;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Track {
    pub id: usize,
    pub path: String,
    pub filename: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoverArt {
    pub data: String, // Base64 encoded
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackgroundImage {
    pub path: String,
    pub name: String,
}

/// Scan a directory for audio files
#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<Track>, String> {
    let audio_extensions = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"];
    let mut tracks: Vec<Track> = Vec::new();
    let mut id = 0;

    for entry in WalkDir::new(&path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let file_path = entry.path();
        if let Some(ext) = file_path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            if audio_extensions.contains(&ext_str.as_str()) {
                let filename = file_path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                let (title, artist, album) = parse_metadata(file_path);

                tracks.push(Track {
                    id,
                    path: file_path.to_string_lossy().to_string(),
                    filename: filename.clone(),
                    title: title.or(Some(filename.replace(&format!(".{}", ext_str), ""))),
                    artist,
                    album,
                });
                id += 1;
            }
        }
    }

    // Sort by filename
    tracks.sort_by(|a, b| {
        a.filename
            .to_lowercase()
            .cmp(&b.filename.to_lowercase())
    });

    Ok(tracks)
}

/// Parse audio file metadata (MP3 only for now)
fn parse_metadata(path: &std::path::Path) -> (Option<String>, Option<String>, Option<String>) {
    let ext = path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if ext == "mp3" {
        if let Ok(tag) = id3::Tag::read_from_path(path) {
            return (
                tag.title().map(String::from),
                tag.artist().map(String::from),
                tag.album().map(String::from),
            );
        }
    }

    (None, None, None)
}

/// Get cover art from audio file (MP3 only)
#[tauri::command]
fn get_cover_art(path: String) -> Result<Option<CoverArt>, String> {
    let file_path = PathBuf::from(&path);
    let ext = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if ext == "mp3" {
        if let Ok(tag) = id3::Tag::read_from_path(&file_path) {
            for picture in tag.pictures() {
                let mime = match picture.mime_type.as_str() {
                    "image/jpeg" => "image/jpeg",
                    "image/png" => "image/png",
                    _ => continue,
                };

                let data = base64::engine::general_purpose::STANDARD.encode(&picture.data);

                return Ok(Some(CoverArt {
                    data,
                    mime_type: mime.to_string(),
                }));
            }
        }
    }

    Ok(None)
}

/// Get list of background images from the app's backgrounds folder
#[tauri::command]
fn get_backgrounds() -> Result<Vec<BackgroundImage>, String> {
    let image_extensions = ["png", "jpg", "jpeg", "webp", "gif"];
    let mut backgrounds: Vec<BackgroundImage> = Vec::new();

    // Get app executable path and look for backgrounds folder next to it
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let app_dir = exe_path.parent().ok_or("Cannot get app directory")?;
    let backgrounds_dir = app_dir.join("backgrounds");

    // Create backgrounds folder if it doesn't exist
    if !backgrounds_dir.exists() {
        std::fs::create_dir_all(&backgrounds_dir).ok();
    }

    if backgrounds_dir.exists() {
        for entry in WalkDir::new(&backgrounds_dir)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let file_path = entry.path();
            if let Some(ext) = file_path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if image_extensions.contains(&ext_str.as_str()) {
                    let name = file_path
                        .file_stem()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();
                    
                    backgrounds.push(BackgroundImage {
                        path: file_path.to_string_lossy().to_string(),
                        name,
                    });
                }
            }
        }
    }

    backgrounds.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(backgrounds)
}

/// Scan all folders and subfolders where the exe is located
#[tauri::command]
fn scan_local(_app_handle: tauri::AppHandle) -> Result<Vec<Track>, String> {
    let audio_extensions = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"];
    let mut tracks: Vec<Track> = Vec::new();
    let mut id = 0;

    // Get app executable path - scan the folder where exe is located
    // e.g. if exe is in C:\Music\Player\app.exe, scan C:\Music\Player\
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let scan_dir = exe_path.parent().ok_or("Cannot get app directory")?;

    for entry in WalkDir::new(scan_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let file_path = entry.path();
        if let Some(ext) = file_path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            if audio_extensions.contains(&ext_str.as_str()) {
                let filename = file_path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                let (title, artist, album) = parse_metadata(file_path);

                tracks.push(Track {
                    id,
                    path: file_path.to_string_lossy().to_string(),
                    filename: filename.clone(),
                    title: title.or(Some(filename.replace(&format!(".{}", ext_str), ""))),
                    artist,
                    album,
                });
                id += 1;
            }
        }
    }

    // Sort by filename
    tracks.sort_by(|a, b| {
        a.filename
            .to_lowercase()
            .cmp(&b.filename.to_lowercase())
    });

    Ok(tracks)
}

/// Get app directory path
#[tauri::command]
fn get_app_dir() -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let app_dir = exe_path.parent().ok_or("Cannot get app directory")?;
    Ok(app_dir.to_string_lossy().to_string())
}

/// Toggle fullscreen mode - pure fullscreen without changing decorations
#[tauri::command]
async fn toggle_fullscreen(window: tauri::Window) -> Result<bool, String> {
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    Ok(!is_fullscreen)
}

/// Scan specific files (for drag & drop)
#[tauri::command]
fn scan_files(paths: Vec<String>) -> Result<Vec<Track>, String> {
    let audio_extensions = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"];
    let mut tracks: Vec<Track> = Vec::new();
    let mut id = 0;

    for path_str in paths {
        let file_path = PathBuf::from(&path_str);
        
        // If it's a directory, scan it recursively
        if file_path.is_dir() {
            for entry in WalkDir::new(&file_path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
            {
                let entry_path = entry.path();
                if let Some(ext) = entry_path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if audio_extensions.contains(&ext_str.as_str()) {
                        let filename = entry_path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default();

                        let (title, artist, album) = parse_metadata(entry_path);

                        tracks.push(Track {
                            id,
                            path: entry_path.to_string_lossy().to_string(),
                            filename: filename.clone(),
                            title: title.or(Some(filename.replace(&format!(".{}", ext_str), ""))),
                            artist,
                            album,
                        });
                        id += 1;
                    }
                }
            }
        } else if file_path.is_file() {
            // Single file
            if let Some(ext) = file_path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if audio_extensions.contains(&ext_str.as_str()) {
                    let filename = file_path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let (title, artist, album) = parse_metadata(&file_path);

                    tracks.push(Track {
                        id,
                        path: file_path.to_string_lossy().to_string(),
                        filename: filename.clone(),
                        title: title.or(Some(filename.replace(&format!(".{}", ext_str), ""))),
                        artist,
                        album,
                    });
                    id += 1;
                }
            }
        }
    }

    // Sort by filename
    tracks.sort_by(|a, b| {
        a.filename
            .to_lowercase()
            .cmp(&b.filename.to_lowercase())
    });

    Ok(tracks)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            scan_local,
            scan_files,
            get_cover_art,
            get_backgrounds,
            get_app_dir,
            toggle_fullscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
