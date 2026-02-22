use serde::Serialize;
use std::sync::Mutex;
use tauri::{Manager, State};

struct WsPort(Mutex<u16>);

#[derive(Serialize)]
struct LayoutBounds {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[tauri::command]
fn get_ws_port(state: State<WsPort>) -> u16 {
    *state.0.lock().unwrap()
}

#[tauri::command]
fn show_layout(app: tauri::AppHandle, show: bool) {
    if let Some(layout) = app.get_webview_window("layout") {
        if show {
            let _ = layout.show();
        } else {
            let _ = layout.hide();
        }
    }
}

#[tauri::command]
fn lock_layout(app: tauri::AppHandle, lock: bool) {
    if let Some(layout) = app.get_webview_window("layout") {
        let _ = layout.set_always_on_top(lock);
        let _ = layout.set_ignore_cursor_events(lock);
        // Note: Tauri v2 doesn't have direct set_movable/set_resizable equivalents
        // The ignore_cursor_events effectively prevents interaction when locked
    }
}

#[tauri::command]
fn resize_layout(app: tauri::AppHandle) -> Option<LayoutBounds> {
    if let Some(layout) = app.get_webview_window("layout") {
        if let Ok(pos) = layout.outer_position() {
            if let Ok(size) = layout.outer_size() {
                return Some(LayoutBounds {
                    x: pos.x,
                    y: pos.y,
                    width: size.width,
                    height: size.height,
                });
            }
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Dev mode: fixed port so bridge can be run manually
    // Release mode: dynamic port
    let ws_port: u16 = if cfg!(debug_assertions) {
        27015
    } else {
        portpicker::pick_unused_port().expect("No available port found")
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(WsPort(Mutex::new(ws_port)))
        .setup(move |app| {
            // Create layout window (hidden by default)
            let _layout = tauri::WebviewWindowBuilder::new(
                app,
                "layout",
                tauri::WebviewUrl::App("layout.html".into()),
            )
            .title("")
            .inner_size(800.0, 600.0)
            .decorations(false)
            .transparent(true)
            .visible(false)
            .resizable(true)
            .maximizable(false)
            .build()?;

            // Spawn bridge process
            let port_str = ws_port.to_string();

            if cfg!(debug_assertions) {
                // Dev mode: spawn node process directly
                // tauri dev runs from src-tauri, so dist lives one level up.
                match std::process::Command::new("node")
                    .args(["../dist/bridge.js", "--dev", "--ws-port", &port_str])
                    .spawn()
                {
                    Ok(_) => println!("Bridge started on port {}", port_str),
                    Err(e) => {
                        eprintln!(
                            "Failed to spawn node bridge: {}. Falling back to sidecar binary.",
                            e
                        );
                        let handle = app.handle().clone();
                        let port_str = port_str.clone();
                        tauri::async_runtime::spawn(async move {
                            use tauri_plugin_shell::ShellExt;
                            match handle.shell().sidecar("bridge") {
                                Ok(cmd) => match cmd.args(["--ws-port", &port_str]).spawn() {
                                    Ok((_rx, _child)) => {
                                        println!("Sidecar started on port {}", port_str)
                                    }
                                    Err(err) => eprintln!("Failed to spawn sidecar: {}", err),
                                },
                                Err(err) => eprintln!("Failed to create sidecar command: {}", err),
                            }
                        });
                    }
                }
            } else {
                // Production: spawn sidecar binary via shell plugin
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    use tauri_plugin_shell::ShellExt;
                    match handle.shell().sidecar("bridge") {
                        Ok(cmd) => match cmd.args(["--ws-port", &port_str]).spawn() {
                            Ok((_rx, _child)) => println!("Sidecar started on port {}", port_str),
                            Err(e) => eprintln!("Failed to spawn sidecar: {}", e),
                        },
                        Err(e) => eprintln!("Failed to create sidecar command: {}", e),
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_ws_port,
            show_layout,
            lock_layout,
            resize_layout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
