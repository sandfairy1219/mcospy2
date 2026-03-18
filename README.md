# mcospy

Frida-based cheat tool for the MilkChoco mobile game.

A Tauri v2 desktop app that connects to Android devices via ADB and injects a Frida agent to manipulate game memory.

## Architecture

- **Tauri (Rust)** - Desktop app shell
- **Bridge (Node.js)** - Sidecar process handling Frida/ADB connection, global keyboard hooking, and WebSocket IPC
- **Frontend (TypeScript)** - WebView-based UI
- **Agent (TypeScript)** - Frida script injected into the game process

## Features

- Aimbot, ESP, blackhole, and other combat cheats
- Infinite ammo, skill damage, move speed modification
- Global hotkey support
- Deathmatch automation
- Preset save/load
- Auto-update
- License key authentication

## Requirements

- Windows 10/11
- Node.js 18+
- Rust (for Tauri build)
- ADB (for Android device connection)
- Frida 16.4.10

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start Tauri dev server |
| `bun run dev:sidecar` | Run bridge standalone (debug) |
| `bun run watch` | Watch TypeScript + CSS changes |
| `bun run build` | Build frontend |
| `bun run build:sidecar` | Build bridge binary |
| `bun run dist` | Full build (build + sidecar + tauri) |
| `bun run release [patch\|minor\|major]` | Bump version, build, push, and create GitHub release (default: patch) |

## License

ISC
