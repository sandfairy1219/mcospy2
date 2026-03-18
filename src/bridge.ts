// Sidecar bridge - Node.js backend process for Tauri
// Communicates with frontend via WebSocket

import { writeFileSync, appendFileSync } from "fs";
import pathMod from "path";
const _logFile = pathMod.join(pathMod.dirname(process.execPath), "bridge-debug.log");
function debugLog(msg: string) {
    try { appendFileSync(_logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch {}
}
debugLog(`Bridge starting. execPath=${process.execPath} cwd=${process.cwd()} argv=${JSON.stringify(process.argv)}`);

import EventEmitter from "events";
import { GlobalKeyboardListener, IGlobalKeyEvent } from "node-global-key-listener";
import dotenv from "dotenv";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";

import type * as Frida from "frida";
import { existsSync, readFileSync, copyFileSync } from "fs";
import { adb, attachProcess, checkFridaPerm, connectFrida, connectAdbDevice, executeProcess, fileExist, fileName, getArch, getUrl, startFrida } from "./data/frida";
import { exec } from "child_process";
import { createServer as createPixelServer } from "./core/server";
import { getHardwareId, authVerify, authActivate } from "./auth";
import type { ServerFacade } from "./core/server";
import { _anOffset, _eposOffset, _xaOffset } from "./offsets";
import { nutKeymap } from "./keymaps";
import { Commander } from "./commander";

type NutKeyboard = {
    config: { autoDelayMs: number };
    pressKey: (key: number) => void | Promise<void>;
    releaseKey: (key: number) => void | Promise<void>;
};

type NutModule = {
    keyboard: NutKeyboard;
    Key: Record<string, number>;
};

let keyboard: NutKeyboard | null = null;
let nutKeys: Record<string, number> | null = null;
try {
    const nut = require("@nut-tree-fork/nut-js") as NutModule;
    keyboard = nut.keyboard;
    nutKeys = nut.Key;
    keyboard.config.autoDelayMs = 0;
} catch (err) {
    console.warn("nut-js disabled: native lib unavailable", err);
}

// Parse CLI args
const args = process.argv.slice(2);
let wsPort = 27015;
const portIdx = args.indexOf('--ws-port');
if (portIdx !== -1 && args[portIdx + 1]) {
    wsPort = parseInt(args[portIdx + 1], 10);
}
const isDev = args.includes('--dev') || process.env.NODE_ENV === 'development';

const agentPathIdx = args.indexOf('--agent-path');
const explicitAgentPath = (agentPathIdx !== -1 && args[agentPathIdx + 1]) ? args[agentPathIdx + 1] : null;

const process_name = 'com.gameparadiso.milkchoco';
const frida_version = '16.4.10';

// Lazy-load agent script (only needed when attaching to a process)
let _agentScript: string | null = null;
function getAgentScript(): string {
    if (_agentScript !== null) return _agentScript;

    const agentCandidates = [
        explicitAgentPath,                                            // explicit CLI arg
        path.join(__dirname, 'scripts', 'agent.js'),                   // pkg snapshot (dist/scripts/)
        path.join(__dirname, './../public/scripts/', 'agent.js'),     // dev
        path.join(__dirname, './../../public/scripts/', 'agent.js'),   // packaged
        path.join(process.cwd(), 'public/scripts/', 'agent.js'),      // cwd fallback
        path.join(path.dirname(process.execPath), 'resources', 'agent.js'),            // Tauri resource (flat)
        path.join(path.dirname(process.execPath), 'resources', 'scripts', 'agent.js'), // Tauri resource (nested)
        path.join(path.dirname(process.execPath), 'resources', 'public', 'scripts', 'agent.js'), // Tauri resource (public/scripts)
        path.join(path.dirname(process.execPath), 'scripts', 'agent.js'),              // next to exe
        path.join(path.dirname(process.execPath), '..', 'resources', 'agent.js'),      // NSIS layout
        path.join(path.dirname(process.execPath), '..', 'resources', 'public', 'scripts', 'agent.js'), // NSIS public/scripts
    ].filter((p): p is string => Boolean(p));

    const agentPath = agentCandidates.find(p => existsSync(p));
    if (!agentPath) {
        throw new Error("Failed to open agent file. Searched: " + agentCandidates.join(", "));
    }
    console.info("[agent] loaded from:", agentPath);

    const rawAgentScript = readFileSync(agentPath, 'utf8').toString();
    _agentScript = rawAgentScript;
    const cutIdx1 = rawAgentScript.indexOf('"cut";');
    const cutIdx2 = cutIdx1 < 0 ? rawAgentScript.indexOf("'cut';") : cutIdx1;
    const marker = cutIdx1 < 0 ? "'cut';" : '"cut";';
    if (cutIdx2 >= 0) {
        _agentScript = rawAgentScript.slice(cutIdx2 + marker.length);
    } else {
        console.warn('Agent sentinel "cut" not found; using full agent script as fallback');
    }
    return _agentScript;
}

// Lazy-load mute-logging script (prepended to agent when "mute-logging" config is on)
let _muteLoggingScript: string | null = null;
function getMuteLoggingScript(): string {
    if (_muteLoggingScript !== null) return _muteLoggingScript;

    const candidates = [
        path.join(__dirname, 'scripts', 'mute-logging.js'),
        path.join(__dirname, './../public/scripts/', 'mute-logging.js'),
        path.join(__dirname, './../../public/scripts/', 'mute-logging.js'),
        path.join(process.cwd(), 'public/scripts/', 'mute-logging.js'),
        path.join(path.dirname(process.execPath), 'resources', 'mute-logging.js'),
        path.join(path.dirname(process.execPath), 'resources', 'scripts', 'mute-logging.js'),
        path.join(path.dirname(process.execPath), 'resources', 'public', 'scripts', 'mute-logging.js'),
        path.join(path.dirname(process.execPath), 'scripts', 'mute-logging.js'),
        path.join(path.dirname(process.execPath), '..', 'resources', 'mute-logging.js'),
        path.join(path.dirname(process.execPath), '..', 'resources', 'public', 'scripts', 'mute-logging.js'),
    ].filter((p): p is string => Boolean(p));

    const found = candidates.find(p => existsSync(p));
    if (!found) {
        console.warn("mute-logging.js not found; muting disabled");
        _muteLoggingScript = "";
        return _muteLoggingScript;
    }

    const raw = readFileSync(found, 'utf8').toString();
    const cutIdx1 = raw.indexOf('"cut";');
    const cutIdx2 = cutIdx1 < 0 ? raw.indexOf("'cut';") : cutIdx1;
    const marker = cutIdx1 < 0 ? "'cut';" : '"cut";';
    if (cutIdx2 >= 0) {
        _muteLoggingScript = raw.slice(cutIdx2 + marker.length);
    } else {
        _muteLoggingScript = raw;
    }
    return _muteLoggingScript;
}

// Load env
const envCandidates = [
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(process.cwd(), '.env'),
];
const resolvedEnvPath = envCandidates.find(p => existsSync(p));
if (resolvedEnvPath) {
    dotenv.config({ path: resolvedEnvPath });
} else {
    dotenv.config();
}

// Read version from package.json
let appVersion = '1.0.0';
try {
    const pkgCandidates = [
        path.resolve(__dirname, '..', 'package.json'),
        path.resolve(__dirname, '..', '..', 'package.json'),
        path.resolve(process.cwd(), 'package.json'),
    ];
    const pkgPath = pkgCandidates.find(p => existsSync(p));
    if (pkgPath) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        appVersion = pkg.version || appVersion;
    }
} catch {}

// Event emitter & global keyboard listener
const emitter = new EventEmitter();
let keyboardListenerEnabled = false;
const isWindows = process.platform === "win32";
const isPkg = typeof (process as any).pkg !== 'undefined';

// Resolve WinKeyServer.exe path - in pkg mode, the snapshot path is virtual
// so we need to copy it to the real filesystem
const keyListenerBin = path.join(
    path.dirname(require.resolve("node-global-key-listener")),
    "..",
    "bin",
    "WinKeyServer.exe"
);

let resolvedKeyListenerBin = keyListenerBin;
if (isPkg && isWindows && existsSync(keyListenerBin)) {
    // Copy from pkg snapshot to real filesystem next to the executable
    const realBin = path.join(path.dirname(process.execPath), 'WinKeyServer.exe');
    try {
        if (!existsSync(realBin)) {
            copyFileSync(keyListenerBin, realBin);
        }
        resolvedKeyListenerBin = realBin;
    } catch (e) {
        console.warn("Failed to extract WinKeyServer.exe:", e);
    }
}

if (isWindows && !existsSync(resolvedKeyListenerBin)) {
    console.warn("Global keyboard listener disabled: missing WinKeyServer.exe", resolvedKeyListenerBin);
} else {
    try {
        const listener = new GlobalKeyboardListener(
            isPkg && isWindows ? { windows: { serverPath: resolvedKeyListenerBin } } : {}
        );
        listener.addListener((event, down) => {
            emitter.emit("gk", event, down);
        }).catch((err: Error) => {
            keyboardListenerEnabled = false;
            console.warn("Global keyboard listener failed to start:", err.message);
        });
        keyboardListenerEnabled = true;
    } catch (err) {
        console.warn("Global keyboard listener disabled (spawn failed)", err);
    }
}

// Commander
const commander = new Commander();

// State
let serial: string = "127.0.0.1:5555";
let adbId: string = '';
let fridaDevice: Frida.Device = null;
let cookie: string = '';
let exp: Frida.ScriptExports = null;
let cheats: Cheats = {};
let config: Config = {};
let keybinds: Keybinds = {};
let wpdata: { [key: string]: WPData } = {};
let web: ServerFacade | null = null;

// WebSocket server
debugLog(`Starting WebSocket server on port ${wsPort}`);
const wss = new WebSocketServer({ port: wsPort });
let clients: Set<WebSocket> = new Set();
debugLog(`WebSocket server created on port ${wsPort}`);

// Message router (replaces Electron's ipcMain)
interface MessageRouter {
    on(channel: string, handler: (...args: any[]) => void): void;
    removeListener(channel: string, handler: (...args: any[]) => void): void;
    removeAllListeners(channel: string): void;
}

const messageHandlers: Map<string, Set<(...args: any[]) => void>> = new Map();
const messageRouter: MessageRouter = {
    on(channel: string, handler: (...args: any[]) => void) {
        if (!messageHandlers.has(channel)) messageHandlers.set(channel, new Set());
        messageHandlers.get(channel)!.add(handler);
    },
    removeListener(channel: string, handler: (...args: any[]) => void) {
        messageHandlers.get(channel)?.delete(handler);
    },
    removeAllListeners(channel: string) {
        messageHandlers.delete(channel);
    }
};

function routeMessage(channel: string, ...args: any[]) {
    const handlers = messageHandlers.get(channel);
    if (handlers) {
        for (const handler of handlers) {
            handler(...args);
        }
    }
}

// Send event to all connected frontend clients
function sendEvent(channel: string, ...data: any[]) {
    const msg = JSON.stringify({ type: 'event', channel, data });
    for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msg);
        }
    }
}

// Send response to a specific request
function sendResponse(ws: WebSocket, id: number, data: any, error?: string) {
    const msg = JSON.stringify({ type: 'response', id, data, error });
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
    }
}

// Cleanup and exit
const exitApp = async () => {
    console.log("App closed");
    emitter.removeAllListeners("pos");
    emitter.removeAllListeners("skillcode");
    emitter.removeAllListeners("esp");
    emitter.removeAllListeners("gyro");
    emitter.removeAllListeners("execute-macro");
    emitter.removeAllListeners("listen-sub");
    emitter.removeAllListeners("listen-main");
    emitter.removeAllListeners("reverse");
    emitter.removeAllListeners("state");
    emitter.removeAllListeners("scan-epos");
    emitter.removeAllListeners("scan-entity");
    try { web?.stop(); } catch { }
    wss.close();
    process.exit(0);
};

// Helper: state update -> send to frontend
const state = (id: string, _state: string, log: string) => {
    sendEvent("update-state", id, _state, log);
};

// ---- Auth ----
const authServerUrl = process.env.AUTH_SERVER_URL || '';
let authenticated = false;

messageRouter.on("auth-verify", async () => {
    if (!authServerUrl) { sendEvent("auth-status", { ok: true }); authenticated = true; main(); return; }
    const hwid = getHardwareId();
    const result = await authVerify(authServerUrl, hwid);
    if (result.ok) { authenticated = true; main(); }
    sendEvent("auth-status", result);
});

messageRouter.on("auth-activate", async (key: string) => {
    if (!authServerUrl) { sendEvent("auth-status", { ok: true }); authenticated = true; main(); return; }
    const hwid = getHardwareId();
    const result = await authActivate(authServerUrl, key, hwid);
    if (result.ok) { authenticated = true; main(); }
    sendEvent("auth-status", result);
});

// ---- Main initialization ----
async function main() {
    if (authenticated === false && authServerUrl) return;
    if (!keyboardListenerEnabled) {
        console.warn("Continuing without global keyboard capture. Keybind hotkeys will be unavailable.");
    }

    // Web server
    web = createPixelServer(
        () => config,
        (channel: string, ...args: any[]) => emitter.emit(channel, ...args),
        (id: string, st: string, log: string) => state(id, st, log)
    );

    // ---- IPC message handlers ----

    // Initialize
    messageRouter.on("init", (_keybinds: any, _config: any, _wpdata: any, _layoutBounds: any) => {
        keybinds = _keybinds;
        config = _config;
        wpdata = _wpdata;
        sendEvent("init-config", config);
    });

    messageRouter.on("get-config", () => {
        sendEvent("get-config-response", config);
    });

    messageRouter.on("serial", (s: string) => { serial = s });
    messageRouter.on("cookie", (c: string) => { cookie = c });
    messageRouter.on("keybind", (id: string, key: string) => {
        keybinds[id] = key;
        emitter.emit("keybind", id, key);
    });
    messageRouter.on("config", (id: string, data: any) => {
        config[id] = data;
        emitter.emit("config", id, data);
        sendEvent("config", id, data); // for layout window
    });
    messageRouter.on("cheats", (id: string, _state: boolean) => {
        cheats[id] = _state;
        emitter.emit("cheats", id, _state);
    });

    const _main = async (onip: boolean) => {
        try {
            if (onip) {
                adbId = await connectAdbDevice(serial);
            } else {
                const ip = await adb.getIpAddress(serial);
                if (ip.length > 0) {
                    await adb.tcpip(serial);
                    adbId = serial;
                } else {
                    state("adb", "error", "Failed to get ip address");
                }
            }
            if (adbId === '') return state("adb", "error", "Failed to connect to adb");
            state("adb", "active", `Connected to adb`);
        } catch (err) {
            console.error("ADB error", err);
            state("adb", "error", "Failed to connect to adb");
        }
    }
    messageRouter.on("connect-adb", async (serial: string, onip: boolean) => {
        state("adb", "pending", "Trying to connect to adb");
        try {
            await adb.startServer();
            state("adb", "pending", "Server started");
            await _main(onip);
        } catch (err) {
            console.error("ADB error", err);
            const msg = err instanceof Error ? err.message : String(err);
            state("adb", "error", `ADB server start failed: ${msg}`);
        }
    });

    messageRouter.on("download-server", async () => {
        if (adbId === '') return state("server", "error", "ADB not connected");
        const url = getUrl(frida_version, await getArch(adbId));
        exec(`start ${url}`);
    });

    messageRouter.on("upload-server", async (filePath: string) => {
        if (adbId === '') return state("server", "error", "ADB not connected");
        if (!filePath) return;
        const name = fileName(frida_version, await getArch(adbId));
        try {
            adb.push(adbId, filePath, `/data/local/tmp/${name}`);
        } catch (e) {
            console.error("Failed to upload frida server");
        }
    });

    messageRouter.on("start-server", async () => {
        if (adbId === '') return state("server", "error", "ADB not connected");
        state("server", "pending", "Starting frida server");
        try {
            const arch = await getArch(adbId);
            if (arch === '') return state("server", "error", "Failed to get arch");
            const filename = await fileExist(adbId, frida_version);
            if (filename === '') return state("server", "error", "Cannot find frida server");
            const perm = await checkFridaPerm(adbId, filename);
            if (!perm) return state("server", "error", "Frida permissions denied");
            if (!await startFrida(adbId, filename, () => state("server", "error", "Frida server crashed"))) {
                return state("server", "error", "Failed to start frida server");
            }
            state("server", "active", "Frida server started");
        } catch (e) {
            console.error("Frida server error", e);
            state("server", "error", "Failed to start frida server");
        }
    });

    messageRouter.on("connect-frida", async () => {
        state("frida", "pending", "Connecting to frida server");
        try {
            await connectFrida(serial, () => state("frida", "error", "Frida server crashed"), (d) => {
                if (d) {
                    fridaDevice = d;
                    state("frida", "active", "Connected to frida server");
                } else {
                    state("frida", "error", "Frida device not found");
                }
            });
        } catch (e) {
            console.error("Frida connect error", e);
            state("frida", "error", "Failed to connect to frida");
        }
    });

    messageRouter.on("get-cookie", async () => {
        if (!fridaDevice) return state("session", "error", "Frida not connected");
        state("session", "pending", "Getting cookie");
        try {
            const [dispose, script] = await executeProcess(process_name, fridaDevice, `
                setTimeout(() => {
                    setImmediate(function() {
                        Java.perform(() => {
                            let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
                            XigncodeClientSystem["getCookie2"].implementation = function (str) {
                                let result = this["getCookie2"](str);
                                send(result);
                                return result;
                            };
                        });
                    });
                }, 100)`,
                (message: Frida.Message, data: Buffer) => {
                    if (message.type === 'send') {
                        cookie = message.payload;
                        state("session", "succeed", "Cookie received");
                        sendEvent("cookie", cookie);
                    }
                },
                () => {
                    state("session", "active", "Script attached");
                },
                () => {
                    state("session", "error", "Session disposed");
                    dispose();
                },
                false
            )
        } catch (err) {
            console.error("Cookie error", err);
            state("session", "error", "Failed to get cookie");
        }
    });

    messageRouter.on("start-agent", async () => {
        if (!fridaDevice) return state("session", "error", "Frida not connected");
        state("session", "pending", "Starting agent");
        let found: boolean = false;
        try {
            const [bpDispose, byScript, bpPid] = await executeProcess(process_name, fridaDevice,
                `Java.perform(() => {
                    let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
                    XigncodeClientSystem["initialize"].implementation = function (activity,str,str2,str3,callback) {
                        send(["XigncodeClientSystem.initialize", activity, str, str2, str3]);
                        return 0;
                    };
                    XigncodeClientSystem["getCookie2"].implementation = function (str) {
                        let result = this["getCookie2"](str);
                        return result;
                    };
                });`.replace("return result", `return '${cookie.trim()}'`),
                async (message: Frida.Message, data: Buffer) => {
                    if (message.type === 'send') {
                        state("session", "active", "Xigncode Bypassed");
                        try {
                        const agentSrc = getAgentScript();
                        const mutePrefix = config["mute-logging"] ? getMuteLoggingScript() : "";
                        debugLog(`Agent script loaded (${agentSrc.length} chars), mute=${!!mutePrefix}, attaching to pid ${bpPid}`);
                        const [dispose, script] = await attachProcess(bpPid, fridaDevice,
                            mutePrefix + agentSrc
                                .replace("/*xaOffset*/", JSON.stringify(_xaOffset))
                                .replace("/*anOffset*/", JSON.stringify(_anOffset))
                                .replace("/*eposOffset*/", JSON.stringify(_eposOffset))
                            ,
                            (message: Frida.Message, data: Buffer) => {
                                if (message.type === 'send') {
                                    const [channel, ...args] = [...message.payload];
                                    if (channel == 'Address.init') {
                                        found = true;
                                        console.info("Module Initialized", args);
                                        state("session", "succeed", `Module Initialized`);
                                        sendEvent("init", true);
                                        script.post(['init', cheats, keybinds, config, wpdata]);
                                    } else emitter.emit(channel, ...args);
                                }
                            },
                            () => {
                                state("session", "pending", "Agent attached");
                                sendEvent("init-config", config);
                                // Register IPC handlers (no permission gating)
                                emitter.on("config", (key, value) => {
                                    script.post(['config', key, value]);
                                });
                                emitter.on("keybind", (key, value) => {
                                    script.post(['keybind', key, value]);
                                });
                                emitter.on("cheats", (key, value) => {
                                    script.post(['cheats', key, value]);
                                });
                                emitter.on("gk", (event: IGlobalKeyEvent, down) => {
                                    script.post(['keyevent', event.name, event.state, down]);
                                });
                                messageRouter.on("listen-sub", (val: boolean) => {
                                    script.post(['listen-sub', val]);
                                });
                                messageRouter.on("listen-main", (val: boolean) => {
                                    script.post(['listen-main', val]);
                                });
                                messageRouter.on("reverse", () => {
                                    script.post(['reverse']);
                                });
                                messageRouter.on("pos", (pos: number[]) => {
                                    script.post(['pos', pos]);
                                });
                                messageRouter.on("skillcode", (code: number) => {
                                    script.post(['skillcode', code]);
                                });
                                if (isDev) messageRouter.on("state", (code: number) => {
                                    script.post(['state', code]);
                                });
                                messageRouter.on("scan-epos", async () => {
                                    script.post(['scan-epos']);
                                });
                                messageRouter.on("scan-entity", async () => {
                                    script.post(['scan-entity']);
                                });
                                messageRouter.on("clear-all", () => {
                                    script.post(['clear-all']);
                                });
                                messageRouter.on("except-number", (data: number[]) => {
                                    script.post(['except-number', data]);
                                });
                                messageRouter.on("change-NaN", () => {
                                    script.post(['change-NaN']);
                                });
                                messageRouter.on("match-win", () => script.post(['match-win']));
                                messageRouter.on("match-lose", () => script.post(['match-lose']));
                                messageRouter.on("match-draw", () => script.post(['match-draw']));
                                messageRouter.on("match-milk", () => script.post(['match-milk']));
                                messageRouter.on("match-choco", () => script.post(['match-choco']));
                                messageRouter.on("receive-dia", (amount: number) => script.post(['receive-dia', amount]));
                                messageRouter.on("receive-gold", (amount: number) => script.post(['receive-gold', amount]));
                                messageRouter.on("receive-xp", (amount: number) => script.post(['receive-xp', amount]));
                                messageRouter.on("receive-clan-xp", (amount: number) => script.post(['receive-clan-xp', amount]));
                                messageRouter.on("receive-sl-coin", (amount: number) => script.post(['receive-sl-coin', amount]));
                                messageRouter.on("receive-sl-point", (amount: number) => script.post(['receive-sl-point', amount]));
                                messageRouter.on("unlock-sl-medal", () => script.post(['unlock-sl-medal']));
                                messageRouter.on("unlock-all-item", (charid: number) => script.post(['unlock-all-item', charid]));
                                messageRouter.on("unlock-all-char", () => script.post(['unlock-all-char']));
                                messageRouter.on("get-daily-reward", (repeat: number) => script.post(['get-daily-reward', repeat]));
                                messageRouter.on("get-guide-reward", () => script.post(['get-guide-reward']));
                                messageRouter.on("ads-reward", () => script.post(['ads-reward']));
                                messageRouter.on("ads-shop-dia", () => script.post(['ads-shop-dia']));
                                messageRouter.on("ads-shop-gold", () => script.post(['ads-shop-gold']));
                                messageRouter.on("request-br-reward", () => script.post(['request-br-reward']));
                                messageRouter.on("kick-player", (number: number) => script.post(['kick-player', number]));
                                messageRouter.on("change-nickname", (name: string) => script.post(['change-nickname', name]));
                                messageRouter.on("purchase-pass", (num: number, item: number) => script.post(['purchase-pass', num, item]));
                                messageRouter.on("server-exploit", () => script.post(['server-exploit']));
                                messageRouter.on("claim-supply", (passType: number, count: number) => script.post(['claim-supply', passType, count]));
                                messageRouter.on("create-clan", (name: string) => script.post(['create-clan', name]));
                                messageRouter.on("break-clan", () => script.post(['break-clan']));
                                messageRouter.on("buy-clan-gold", (amount: number) => script.post(['buy-clan-gold', amount]));
                                messageRouter.on("equip-item", (char: number, slot: number, number: number) => script.post(['equip-item', char, slot, number]));

                                messageRouter.on("ctm-default-milk", () => script.post(['ctm-default-milk']));
                                messageRouter.on("ctm-default-choco", () => script.post(['ctm-default-choco']));
                                messageRouter.on("ctm-desert-milk", () => script.post(['ctm-desert-milk']));
                                messageRouter.on("ctm-desert-choco", () => script.post(['ctm-desert-choco']));
                                messageRouter.on("ctm-castle-milk", () => script.post(['ctm-castle-milk']));
                                messageRouter.on("ctm-castle-choco", () => script.post(['ctm-castle-choco']));
                                messageRouter.on("ctm-mountain-milk", () => script.post(['ctm-mountain-milk']));
                                messageRouter.on("ctm-mountain-choco", () => script.post(['ctm-mountain-choco']));
                                messageRouter.on("deathmatch-start", () => script.post(['deathmatch-start']));
                                messageRouter.on("deathmatch-stop", () => script.post(['deathmatch-stop']));
                                messageRouter.on("execute-cmd", (data: string) => script.post(['execute-cmd', data]));
                                // Developer tools (dev-only)
                                if (isDev) {
                                    messageRouter.on("get-ranges", (data: string) => script.post(['get-ranges', data]));
                                    messageRouter.on("find-ranges", (data: string) => script.post(['find-ranges', data]));
                                    messageRouter.on("search-pattern", (data: string) => script.post(['search-pattern', data]));
                                    messageRouter.on("dev-perf", (val: boolean) => script.post(['dev-perf', val]));
                                }
                                emitter.on("gyro", (data) => {
                                    script.post(['gyro', data]);
                                });
                                emitter.on('execute-macro', (e, id: string) => {
                                    script.post(['execute-macro', id]);
                                });
                            },
                            () => {
                                sendEvent("init-config", config);
                                sendEvent("init", false);
                                emitter.removeAllListeners("config");
                                emitter.removeAllListeners("keybind");
                                emitter.removeAllListeners("cheats");
                                emitter.removeAllListeners("gk");
                                messageRouter.removeAllListeners("listen-sub");
                                messageRouter.removeAllListeners("listen-main");
                                messageRouter.removeAllListeners("reverse");
                                messageRouter.removeAllListeners("pos");
                                messageRouter.removeAllListeners("skillcode");
                                if (isDev) messageRouter.removeAllListeners("state");
                                messageRouter.removeAllListeners("scan-epos");
                                messageRouter.removeAllListeners("scan-entity");
                                messageRouter.removeAllListeners("clear-all");
                                messageRouter.removeAllListeners("except-number");
                                messageRouter.removeAllListeners("change-NaN");
                                messageRouter.removeAllListeners("change-ads-reward");
                                messageRouter.removeAllListeners("match-win");
                                messageRouter.removeAllListeners("match-lose");
                                messageRouter.removeAllListeners("match-draw");
                                messageRouter.removeAllListeners("receive-dia");
                                messageRouter.removeAllListeners("receive-gold");
                                messageRouter.removeAllListeners("receive-xp");
                                messageRouter.removeAllListeners("receive-clan-xp");
                                messageRouter.removeAllListeners("receive-sl-coin");
                                messageRouter.removeAllListeners("receive-sl-point");
                                messageRouter.removeAllListeners("unlock-sl-medal");
                                messageRouter.removeAllListeners("unlock-all-item");
                                messageRouter.removeAllListeners("get-daily-reward");
                                messageRouter.removeAllListeners("get-guide-reward");
                                messageRouter.removeAllListeners("ads-reward");
                                messageRouter.removeAllListeners("ads-shop-dia");
                                messageRouter.removeAllListeners("ads-shop-gold");
                                messageRouter.removeAllListeners("request-br-reward");
                                messageRouter.removeAllListeners("kick-player");
                                messageRouter.removeAllListeners("change-nickname");
                                messageRouter.removeAllListeners("purchase-pass");
                                messageRouter.removeAllListeners("server-exploit");
                                messageRouter.removeAllListeners("claim-supply");
                                messageRouter.removeAllListeners("create-clan");
                                messageRouter.removeAllListeners("break-clan");
                                messageRouter.removeAllListeners("buy-clan-gold");
                                messageRouter.removeAllListeners("equip-item");
                                messageRouter.removeAllListeners("get-ranges");
                                messageRouter.removeAllListeners("find-ranges");
                                messageRouter.removeAllListeners("execute-cmd");
                                emitter.removeAllListeners("gyro");
                                emitter.removeAllListeners("execute-macro");
                                exp = null;
                                commander.dispose()
                                cheats = {};
                                state("epos", "clear", "");
                                state("entity", "clear", "");
                                state("session", "error", "Session disposed");
                                dispose();
                            },
                            true // useEmulator
                        )
                        commander.init(script);
                        } catch (err) {
                            console.error("Agent attach error:", err);
                            debugLog(`Agent attach error: ${err}`);
                            state("session", "error", `Agent attach failed: ${err}`);
                        }
                    }
                },
                () => {
                    state("session", "pending", "Process attached");
                },
                () => {
                    state("session", "error", "Session disposed");
                    bpDispose();
                }, false // useEmulator
            );
        } catch (err) {
            console.error("Agent error", err);
            state("session", "error", "Failed to start agent");
        }
    });

    emitter.on("wp-data", (_wpdata: { [key: string]: WPData }) => {
        wpdata = _wpdata;
        sendEvent("wp-data", _wpdata);
    })

    // Cheat event forwarding
    emitter.on("listen-sub", (v: [number, number]) => {
        sendEvent("listen-sub", v);
    })
    emitter.on("listen-main", (v: [number, number]) => {
        sendEvent("listen-main", v);
    });
    emitter.on("pos", (pos: number[]) => {
        sendEvent("pos", pos);
    });
    emitter.on("skillcode", (code: number) => {
        sendEvent("skillcode", code);
    });
    emitter.on("deathmatch", (state: string) => {
        sendEvent("deathmatch", state);
    });
    if (isDev) emitter.on("state", (code: number) => {
        sendEvent("state", code);
    });
    emitter.on("epos-state", (_state: string, msg: string) => {
        state("epos", _state, msg);
    });
    emitter.on("entity-state", (_state: string, msg: string) => {
        state("entity", _state, msg);
    });
    emitter.on("clear-all", () => {
        state("epos", "clear", "");
        state("entity", "clear", "");
        sendEvent("clear");
    });
    emitter.on("clear-esp", () => {
        sendEvent("clear");
    });
    emitter.on("esp", (data: DrawRect[]) => {
        if (!cheats['esp']) return;
        sendEvent("draw", data);
    })
    emitter.on("except-number", (data: number[]) => {
        sendEvent("except-number", data);
    });
    emitter.on("perf", (data: any) => {
        sendEvent("perf", data);
    });
    messageRouter.on("console-cmd", (data: string) => {
        const [cmd, ...cmdArgs] = data.trim().split(" ").map(s => s.trim())
        const msg = commander.apply(cmd, ...cmdArgs);
        sendEvent("log", msg);
    });

    // Server
    messageRouter.on("server-start", (port: number) => {
        web?.start(port || 3000);
    });
    messageRouter.on("server-stop", () => {
        web?.stop();
    });

    // Touch / keyboard
    emitter.on("touch", (x: number, y: number) => {
        adb.shell(adbId, `input tap ${x} ${y}`);
    })
    emitter.on("sendkey", async (keyName: string) => {
        if (keyboard && nutKeys && nutKeymap[keyName]) {
            const keyCode = nutKeys[nutKeymap[keyName]];
            if (keyCode !== undefined) {
                keyboard.pressKey(keyCode);
                keyboard.releaseKey(keyCode);
            }
        }
    })

    messageRouter.on("log", (...args: any[]) => {
        console.log(...args);
    });

    console.log(`Bridge sidecar started on WebSocket port ${wsPort}`);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Frontend connected');

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'invoke') {
                const { channel, args, id } = msg;
                // Route the message to handlers
                routeMessage(channel, ...(args || []));
                // For invoke with id, send ack (handlers send results via events)
                if (id !== undefined) {
                    sendResponse(ws, id, { ok: true });
                }
            }
        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Frontend disconnected');
    });
});

// Log emitter
emitter.on("log", (...args: any[]) => {
    console.log(...args);
    sendEvent("log", ...args);
});

// Handle process signals for clean shutdown
process.on('SIGINT', () => exitApp());
process.on('SIGTERM', () => exitApp());

// Start main (auth-gated: main() is called after auth-verify/auth-activate succeeds)
// If no AUTH_SERVER_URL, start immediately
if (!authServerUrl) {
    main().catch(err => {
        console.error("Bridge startup error:", err);
        process.exit(1);
    });
}
