use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};

struct WsPort(Mutex<u16>);

// Sidecar process wrapper that supports both dev (std::process::Child) and
// production (tauri-plugin-shell CommandChild) modes.
enum SidecarProcess {
    Std(std::process::Child),
    Tauri(tauri_plugin_shell::process::CommandChild),
}

impl SidecarProcess {
    fn kill(self) {
        match self {
            SidecarProcess::Std(mut child) => {
                let _ = child.kill();
            }
            SidecarProcess::Tauri(child) => {
                let _ = child.kill();
            }
        }
    }
}

struct SidecarHandle(Mutex<Option<SidecarProcess>>);

#[derive(Serialize, Deserialize)]
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
fn restore_layout_bounds(app: tauri::AppHandle, bounds: LayoutBounds) {
    if let Some(layout) = app.get_webview_window("layout") {
        let _ = layout.set_position(tauri::PhysicalPosition::new(bounds.x, bounds.y));
        let _ = layout.set_size(tauri::PhysicalSize::new(bounds.width, bounds.height));
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
        .manage(SidecarHandle(Mutex::new(None)))
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
            let resource_dir = app.path().resource_dir().ok();
            let frida_binding_path = resource_dir
                .as_ref()
                .map(|p| p.join("frida_binding.node"))
                .and_then(|p| p.to_str().map(|s| s.to_string()));
            let agent_path = resource_dir
                .as_ref()
                .map(|p| p.join("agent.js"))
                .and_then(|p| p.to_str().map(|s| s.to_string()));

            if cfg!(debug_assertions) {
                // Dev mode: spawn node process directly
                // tauri dev runs from src-tauri, so dist lives one level up.
                match std::process::Command::new("node")
                    .args(["../dist/bridge.js", "--dev", "--ws-port", &port_str])
                    .spawn()
                {
                    Ok(child) => {
                        println!("Bridge started on port {}", port_str);
                        let state = app.state::<SidecarHandle>();
                        let mut guard = state.0.lock().unwrap();
                        *guard = Some(SidecarProcess::Std(child));
                    }
                    Err(e) => {
                        eprintln!(
                            "Failed to spawn node bridge: {}. Falling back to sidecar binary.",
                            e
                        );
                        let handle = app.handle().clone();
                        let port_str = port_str.clone();
                        let frida_binding_path = frida_binding_path.clone();
                        let agent_path = agent_path.clone();
                        tauri::async_runtime::spawn(async move {
                            use tauri_plugin_shell::ShellExt;
                            use tauri_plugin_shell::process::CommandEvent;
                            match handle.shell().sidecar("bridge") {
                                Ok(cmd) => {
                                    let mut args = vec!["--ws-port".to_string(), port_str.clone()];
                                    if let Some(path) = frida_binding_path.clone() {
                                        args.push("--frida-binding".to_string());
                                        args.push(path);
                                    }
                                    if let Some(path) = agent_path {
                                        args.push("--agent-path".to_string());
                                        args.push(path);
                                    }
                                    match cmd.args(args).spawn() {
                                        Ok((mut rx, child)) => {
                                            println!("Sidecar started on port {}", port_str);
                                            tauri::async_runtime::spawn(async move {
                                                while let Some(event) = rx.recv().await {
                                                    match event {
                                                        CommandEvent::Stdout(line) => {
                                                            print!("{}", String::from_utf8_lossy(&line));
                                                        }
                                                        CommandEvent::Stderr(line) => {
                                                            eprint!("{}", String::from_utf8_lossy(&line));
                                                        }
                                                        CommandEvent::Terminated(_) => break,
                                                        _ => {}
                                                    }
                                                }
                                            });
                                            let state = handle.state::<SidecarHandle>();
                                            let mut guard = state.0.lock().unwrap();
                                            *guard = Some(SidecarProcess::Tauri(child));
                                        }
                                        Err(err) => eprintln!("Failed to spawn sidecar: {}", err),
                                    }
                                }
                                Err(err) => eprintln!("Failed to create sidecar command: {}", err),
                            }
                        });
                    }
                }
            } else {
                // Production: spawn sidecar binary via shell plugin
                let handle = app.handle().clone();
                let frida_binding_path = frida_binding_path.clone();
                let agent_path = agent_path.clone();
                tauri::async_runtime::spawn(async move {
                    use tauri_plugin_shell::ShellExt;
                    use tauri_plugin_shell::process::CommandEvent;
                    match handle.shell().sidecar("bridge") {
                        Ok(cmd) => {
                            let mut args = vec!["--ws-port".to_string(), port_str.clone()];
                            if let Some(path) = frida_binding_path {
                                args.push("--frida-binding".to_string());
                                args.push(path);
                            }
                            if let Some(path) = agent_path {
                                args.push("--agent-path".to_string());
                                args.push(path);
                            }
                            println!("Spawning sidecar with args: {:?}", args);
                            match cmd.args(args).spawn() {
                                Ok((mut rx, child)) => {
                                    println!("Sidecar started on port {}", port_str);
                                    // IMPORTANT: consume stdout/stderr to prevent pipe buffer
                                    // from filling up and blocking the sidecar process
                                    tauri::async_runtime::spawn(async move {
                                        while let Some(event) = rx.recv().await {
                                            match event {
                                                CommandEvent::Stdout(line) => {
                                                    print!("{}", String::from_utf8_lossy(&line));
                                                }
                                                CommandEvent::Stderr(line) => {
                                                    eprint!("{}", String::from_utf8_lossy(&line));
                                                }
                                                CommandEvent::Terminated(payload) => {
                                                    eprintln!("Sidecar terminated: {:?}", payload);
                                                    break;
                                                }
                                                _ => {}
                                            }
                                        }
                                    });
                                    // Store child handle for cleanup on exit
                                    {
                                        let state = handle.state::<SidecarHandle>();
                                        let mut guard = state.0.lock().unwrap();
                                        *guard = Some(SidecarProcess::Tauri(child));
                                    }
                                }
                                Err(e) => eprintln!("Failed to spawn sidecar: {}", e),
                            }
                        }
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
            restore_layout_bounds,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    // Kill bridge process before exiting
                    let state = window.app_handle().state::<SidecarHandle>();
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(process) = guard.take() {
                            process.kill();
                        }
                    }
                    // When main window is closed, exit the entire app
                    window.app_handle().exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
