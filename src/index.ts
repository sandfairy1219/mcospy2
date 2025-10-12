import Logger from "electron-log";
import EventEmitter from "events";
import { GlobalKeyboardListener, IGlobalKeyEvent } from "node-global-key-listener";
import dotenv from "dotenv";
import path from "path";
import { MongoClient } from "mongodb";
import { createWindow } from "./data/utils";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import isDev from "electron-is-dev";
import frida from "frida";
import { existsSync, readFileSync } from "fs";
import { adb, attachProcess, checkFridaPerm, connectFrida, connectAdbDevice, executeProcess, fileExist, fileName, getArch, getUrl, startFrida } from "./data/frida";
import { exec } from "child_process";
import { createServer as createPixelServer } from "./core/server";
import type { ServerFacade } from "./core/server";
import { _anOffset, _eposOffset, _xaOffset } from "./offsets";
import { keyboard } from "@nut-tree-fork/nut-js";
import { nutKeymap } from "./keymaps";
import { createGuardedIpc, PermissionLevel } from "./core/guardedIpc";
import { isCheatAllowed } from "./core/cheatPolicy";
import { Commander } from "./commander";

keyboard.config.autoDelayMs = 0;

const process_name = 'com.gameparadiso.milkchoco';
const frida_version = '16.4.10';
const agentPath = isDev ? path.join(__dirname, './../public/scripts/', 'agent.js') : path.join(__dirname, './../../public/scripts/', 'agent.js');
if(!existsSync(agentPath)) {
    Logger.error("Failed to open agent file");
    process.exit(1);
}

// Read agent script and strip everything up to the sentinel line "cut"; to avoid leaking helpers/types
const rawAgentScript = readFileSync(agentPath, 'utf8').toString();
let agentScript = rawAgentScript;
const cutIdx1 = rawAgentScript.indexOf('"cut";');
const cutIdx2 = cutIdx1 < 0 ? rawAgentScript.indexOf("'cut';") : cutIdx1;
const marker = cutIdx1 < 0 ? "'cut';" : '"cut";';
if (cutIdx2 >= 0) {
    agentScript = rawAgentScript.slice(cutIdx2 + marker.length);
} else {
    Logger.warn('Agent sentinel "cut" not found; using full agent script as fallback');
}

// load env (support both dev and packaged paths gracefully)
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

// connect to mongodb
const client = new MongoClient(process.env.MONGO_URI || "mongodb+srv://ID:PASS@cluster.mongodb.net/");
// register logger
Logger.initialize();
// create event emitter
const emitter = new EventEmitter();
const listener = new GlobalKeyboardListener();
// listen for global key events
listener.addListener((event, down) => {
    emitter.emit("gk", event, down);
});

// Commander
const commander = new Commander();

// vars
let main: BrowserWindow | null = null;
let tk:Token|null = null;
let serial:string = "127.0.0.1:5555";
let adbId:string = '';
let fridaDevice:frida.Device = null;
let cookie:string = '';
let exp:frida.ScriptExports = null;
let cheats:Cheats = {};
let config:Config = {};
let keybinds:Keybinds = {};
let web: ServerFacade | null = null;
let checker: NodeJS.Timeout | null = null;

// exit app
const exitApp = async () => {
    const db = client.db("sanabi");
    const tokens = db.collection("tokens");
    if(tk) await tokens.updateOne({ code:tk.code }, { $set: { using: false } });
    Logger.log("App closed");
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
    app.quit();
    try { web?.stop(); } catch {}
    process.exit(0);
};

const getExceptNums = async () => {
    const db = client.db("sanabi");
    const tokens = db.collection("tokens");
    const htokens = await tokens.find({ tier: { $gt: tk.tier } }).toArray();
    return htokens.flatMap(token => token.excs);
}

// main app events
app.on("ready", async () => {
    await client.connect();

    main = createWindow("main", 300, 400, true, {
        title: `Pixel v${app.getVersion()}`,
        maximizable: false,
        fullscreenable: false,
        fullscreen: false,
    }, async () => {
        try{
            Logger.info(isDev ? "Development mode" : "Production mode");
            if(isDev){
                main.webContents.send("login");
            } else {
                autoUpdater.checkForUpdatesAndNotify();
            }
        } catch(err){
            Logger.error("Update error", err);
            main.webContents.send("login");
        }
    });
    main.once('close', exitApp);
    main.once('closed', exitApp);
    const state = (id:string, state:string, log:string) => {
        if(main.isDestroyed()) return;
        main.webContents.send("update-state", id, state, log);
    };

    const layout = createWindow("layout", 800, 600, false, {
        maximizable: true,
        fullscreenable: true,
        fullscreen: false,
        frame: false,
        transparent: true,
        resizable: true,
        movable: true,
    });

    autoUpdater.on("checking-for-update", () => {
    });

    autoUpdater.on("update-available", () => {
        main.webContents.send("update");
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on("download-progress", (progress) => {
        main.webContents.send("download", progress.percent);
    });

    autoUpdater.on("update-downloaded", () => {
        Logger.log("Update downloaded");
        autoUpdater.quitAndInstall(false, true);
        exitApp();
    });

    autoUpdater.on("error", (err) => {
        Logger.error("Update error", err);
        main.webContents.send("login");
    });

    autoUpdater.on("update-cancelled", () => {
        main.webContents.send("login");
    });

    autoUpdater.on("update-not-available", () => {
        main.webContents.send("login");
    });

    // web server (create after windows + state function exist)
    web = createPixelServer(
        () => config,
        (channel: string, ...args: any[]) => emitter.emit(channel, ...args),
        (id: string, st: string, log: string) => state(id, st, log)
    );

    // get token
    ipcMain.on("login", async (e, key) => {
        const db = client.db("sanabi");
        const tokens = db.collection("tokens");
        const token = await tokens.findOne({ code: key });
        if(!token) main.webContents.send("token", "Invalid token");
        else if(token.expiration < Date.now()) main.webContents.send("token", "Token expired");
        else if(token.using) main.webContents.send("token", "Token already using");
        else {
            tk = token as unknown as Token;
            await tokens.updateOne({ code: key }, { $set: { using:true } })
            main.webContents.send("token", token);
            checker = setInterval(async () => {
                const doc = await client.db("sanabi").collection("tokens").findOne({ code: key });
                if(!doc || doc.expiration < Date.now() || doc.blocked) {
                    clearInterval(checker);
                    exitApp();
                }
            }, 1000 * 60 * 10);
        }
    });

    // macros
    ipcMain.on("get-macros", async (e, ids:string[]) => {
        const db = client.db("sanabi");
        const macros = db.collection("macros");
        const result = await macros.find({ id: { $in: ids } }).toArray();
        main.webContents.send("macros", result);
    })

    // layout
    ipcMain.on("show-layout", (e, bool:boolean) => {
        if(bool) layout.show();
        else layout.hide();
    });
    ipcMain.on("lock-layout", (e, bool:boolean) => {
        layout.setMovable(!bool);
        layout.setResizable(!bool);
        layout.setAlwaysOnTop(bool);
        layout.setIgnoreMouseEvents(bool);
    });
    ipcMain.on("resize-layout", (e) => {
        main.webContents.send("resize-layout", layout.getBounds());
    });

    // initialize
    ipcMain.on("init", (e, _keybinds, _config, _layoutBounds:Electron.Rectangle|null) => {
        keybinds = _keybinds;
        config = _config;
        if(_layoutBounds) layout.setBounds(_layoutBounds);
        layout.webContents.send("init-config", config);
    });
    ipcMain.on("get-config", (e) => {e.returnValue = config;});
    ipcMain.on('serial', (e, s:string) => {serial = s});
    ipcMain.on('cookie', (e, c:string) => {cookie = c});
    ipcMain.on("keybind", (e, id, key) => {
        keybinds[id] = key;
        emitter.emit("keybind", id, key);
    });
    ipcMain.on("config", (e, id, data) => {
        config[id] = data;
        emitter.emit("config", id, data);
        layout.webContents.send("config", id, data);
    });
    ipcMain.on("cheats", (e, id, _state:boolean) => {
        // Permission-gated cheat toggling
        if (!isCheatAllowed(tk, id)) return;
        cheats[id] = _state;
        emitter.emit("cheats", id, _state);
    });

    const _main = async (onip:boolean) => {
        try{
            if(onip){
                adbId = await connectAdbDevice(serial);
            } else {
                const ip = await adb.getIpAddress(serial);
                if(ip.length > 0) {
                    await adb.tcpip(serial);
                    adbId = serial;
                } else {
                    state("adb", "error", "Failed to get ip address");
                }
            }
            if(adbId === '') return state("adb", "error", "Failed to connect to adb");
            state("adb", "active", `Connected to adb`);
        } catch(err){
            Logger.error("ADB error", err);
            state("adb", "error", "Failed to connect to adb");
        }
    }
    ipcMain.on("connect-adb", async (e, serial:string, onip:boolean) => {
        state("adb", "pending", "Trying to connect to adb");
        try{
            await adb.startServer();
            state("adb", "pending", "Server started");
            await _main(onip);
        } catch(err){
            Logger.error("ADB error", err);
            state("adb", "pending", "Server error");
            await _main(onip);
        }
    });

    ipcMain.on("download-server", async (e) => {
        if(adbId === '') return state("server", "error", "ADB not connected");
        const url = getUrl(frida_version, await getArch(adbId));
        exec(`start ${url}`);
    });

    ipcMain.on("upload-server", async (e) => {
        if(adbId === '') return state("server", "error", "ADB not connected");
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{name: 'Frida Server', extensions:[]}]
        })
        if(result.canceled) return;
        const filePath = result.filePaths[0];
        const name = fileName(frida_version, await getArch(adbId));
        try{
            adb.push(adbId, filePath, `/data/local/tmp/${name}`);
        } catch(e) {
            Logger.error("Failed to upload frida server");
        }
    });

    ipcMain.on("start-server", async (e) => {
        if(adbId === '') return state("server", "error", "ADB not connected");
        state("server", "pending", "Starting frida server");
        try{
            const arch = await getArch(adbId);
            if(arch === '') return state("server", "error", "Failed to get arch");
            const filename = await fileExist(adbId, frida_version);
            if(filename === '') return state("server", "error", "Cannot find frida server");
            const perm = await checkFridaPerm(adbId, filename);
            if(!perm) return state("server", "error", "Frida permissions denied");
            if(!await startFrida(adbId, filename, () => state("server", "error", "Frida server crashed"))) {
                return state("server", "error", "Failed to start frida server");
            }
            state("server", "active", "Frida server started");
        } catch(e) {
            Logger.error("Frida server error", e);
            state("server", "error", "Failed to start frida server");
        }
    });

    ipcMain.on("connect-frida", async (e) => {
        state("frida", "pending", "Connecting to frida server");
        await connectFrida(serial, () => state("frida", "error", "Frida server crashed"), (d) => {
            fridaDevice = d;
            state("frida", "active", "Connected to frida server");
        });
    });

    ipcMain.on("get-cookie", async (e) => {
        if(!tk) return state("session", "error", "Token required");
        if(!fridaDevice) return state("session", "error", "Frida not connected");
        state("session", "pending", "Getting cookie");
        try{
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
                (message:frida.Message, data:Buffer) => {
                    if(message.type === 'send') {
                        cookie = message.payload;
                        state("session", "succeed", "Cookie received");
                        main.webContents.send("cookie", cookie);
                    }
                },
                () => {
                    state("session", "active", "Script attached");
                },
                () => {
                    state("session", "error", "Session disposed");
                    dispose();
                },
                false // useEmulator
            )
        } catch (err){
            Logger.error("Cookie error", err);
            state("session", "error", "Failed to get cookie");
        }
    });

    ipcMain.on("start-agent", async (e) => {
        if(!tk) return state("session", "error", "Token required");
        if(!fridaDevice) return state("session", "error", "Frida not connected");
        state("session", "pending", "Starting agent");
        let found:boolean = false;
        let guardInst: { on: Function; removeAll: Function } | null = null;
        try{
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
                async (message:frida.Message, data:Buffer) => {
                    if(message.type === 'send') {
                        state("session", "active", "Xigncode Bypassed");
                        const [dispose, script] = await attachProcess(bpPid, fridaDevice,
                            agentScript
                            .replace("/*xaOffset*/", JSON.stringify(_xaOffset))
                            .replace("/*anOffset*/", JSON.stringify(_anOffset))
                            // .replace("/*cdOffset*/", JSON.stringify(_cdOffset))
                            .replace("/*eposOffset*/", JSON.stringify(_eposOffset))
                            ,
                            (message:frida.Message, data:Buffer) => {
                                if(message.type === 'send') {
                                    const [channel, ...args] = [...message.payload];
                                    if(channel == 'Address.init'){
                                        found = true;
                                        Logger.info("Module Initialized", args);
                                        state("session", "succeed", `Module Initialized`);
                                        main.webContents.send("init", true);
                                        script.post(['init', cheats, keybinds, config]);
                                    } else emitter.emit(channel, ...args);
                                }
                            },
                            () => {
                                state("session", "pending", "Agent attached");
                                layout.webContents.send("init-config", config);
                                // Permission-guarded IPC
                                guardInst = createGuardedIpc(() => tk) as any;
                                if(tk){
                                    emitter.on("config", (key, value) => {
                                        script.post(['config', key, value]);
                                    });
                                    emitter.on("keybind", (key, value) => {
                                        script.post(['keybind', key, value]);
                                    });
                                    emitter.on("cheats", (key, value) => {
                                        script.post(['cheats', key, value]);
                                    });
                                    emitter.on("gk", (event:IGlobalKeyEvent, down) => {
                                        script.post(['keyevent', event.name, event.state, down]);
                                    });
                                    ipcMain.on("listen-sub", (e, val:boolean) => {
                                        script.post(['listen-sub', val]);
                                    });
                                    ipcMain.on("listen-main", (e, val:boolean) => {
                                        script.post(['listen-main', val]);
                                    });
                                    ipcMain.on("reverse", (e) => {
                                        script.post(['reverse']);
                                    });
                                    ipcMain.on("pos", (e, pos:number[]) => {
                                        script.post(['pos', pos]);
                                    });
                                    ipcMain.on("skillcode", (e, code:number) => {
                                        script.post(['skillcode', code]);
                                    });
                                    if(isDev) ipcMain.on("state", (e, code:number) => {
                                        script.post(['state', code]);
                                    });
                                    (guardInst as any).on("scan-epos", PermissionLevel.User, async (e: any) => {
                                        script.post(['scan-epos']);
                                        script.post(['tier-numbers', await getExceptNums()]);
                                    });
                                    (guardInst as any).on("scan-entity", PermissionLevel.User, async (e: any) => {
                                        script.post(['scan-entity']);
                                        script.post(['tier-numbers', await getExceptNums()]);
                                    });
                                    ipcMain.on("clear-all", (e) => {
                                        script.post(['clear-all']);
                                    });
                                    (guardInst as any).on("except-number", PermissionLevel.User, (e: any, data:number[]) => {
                                        script.post(['except-number', data]);
                                    });
                                    ipcMain.on("change-NaN", (e) => {
                                        script.post(['change-NaN']);
                                    });
                                    // Admin-level sensitive operations
                                    (guardInst as any).on("match-win", PermissionLevel.Power, (e: any) => script.post(['match-win']));
                                    (guardInst as any).on("match-lose", PermissionLevel.Power, (e: any) => script.post(['match-lose']));
                                    (guardInst as any).on("match-draw", PermissionLevel.Power, (e: any) => script.post(['match-draw']));
                                    (guardInst as any).on("receive-dia", PermissionLevel.Power, (e: any, amount: number) => script.post(['receive-dia', amount]));
                                    (guardInst as any).on("receive-gold", PermissionLevel.Power, (e: any, amount: number) => script.post(['receive-gold', amount]));
                                    (guardInst as any).on("receive-xp", PermissionLevel.Power, (e: any, amount: number) => script.post(['receive-xp', amount]));
                                    (guardInst as any).on("receive-clan-xp", PermissionLevel.Power, (e: any, amount: number) => script.post(['receive-clan-xp', amount]));
                                    (guardInst as any).on("receive-sl-coin", PermissionLevel.Power, (e: any, amount: number) => script.post(['receive-sl-coin', amount]));
                                    (guardInst as any).on("receive-sl-point", PermissionLevel.Power, (e: any, amount: number) => script.post(['receive-sl-point', amount]));
                                    (guardInst as any).on("unlock-sl-medal", PermissionLevel.Power, (e: any) => script.post(['unlock-sl-medal']));
                                    (guardInst as any).on("unlock-all-item", PermissionLevel.Power, (e: any, charid: number) => script.post(['unlock-all-item', charid]));
                                    (guardInst as any).on("unlock-all-char", PermissionLevel.Power, (e: any) => script.post(['unlock-all-char']));
                                    (guardInst as any).on("kick-player", PermissionLevel.Power, (e: any, number: number) => script.post(['kick-player', number]));

                                    (guardInst as any).on("change-nickname", PermissionLevel.User, (e: any, name: string) => script.post(['change-nickname', name]));
                                    (guardInst as any).on("purchase-pass", PermissionLevel.User, (e: any, num: number, item: number) => script.post(['purchase-pass', num, item]));
                                    (guardInst as any).on("server-exploit", PermissionLevel.User, (e: any) => script.post(['server-exploit']));
                                    (guardInst as any).on("create-clan", PermissionLevel.User, (e: any, name: string) => script.post(['create-clan', name]));

                                    ipcMain.on("ctm-default-milk", (e) => script.post(['ctm-default-milk']));
                                    ipcMain.on("ctm-default-choco", (e) => script.post(['ctm-default-choco']));
                                    ipcMain.on("ctm-desert-milk", (e) => script.post(['ctm-desert-milk']));
                                    ipcMain.on("ctm-desert-choco", (e) => script.post(['ctm-desert-choco']));
                                    ipcMain.on("ctm-castle-milk", (e) => script.post(['ctm-castle-milk']));
                                    ipcMain.on("ctm-castle-choco", (e) => script.post(['ctm-castle-choco']));
                                    ipcMain.on("ctm-mountain-milk", (e) => script.post(['ctm-mountain-milk']));
                                    ipcMain.on("ctm-mountain-choco", (e) => script.post(['ctm-mountain-choco']));
                                    ipcMain.on("execute-cmd", (e: any, data:string) => script.post(['execute-cmd', data]));
                                    // Developer tools (dev-only + developer permission)
                                    (guardInst as any).on("get-ranges", PermissionLevel.Developer, (e: any, data:string) => script.post(['get-ranges', data]), { devOnly: true });
                                    (guardInst as any).on("find-ranges", PermissionLevel.Developer, (e: any, data:string) => script.post(['find-ranges', data]), { devOnly: true });
                                    (guardInst as any).on("search-pattern", PermissionLevel.Developer, (e: any, data:string) => script.post(['search-pattern', data]), { devOnly: true });
                                    (guardInst as any).on("dev-perf", PermissionLevel.Developer, (e: any, val:boolean) => script.post(['dev-perf', val]), { devOnly: true });
                                    emitter.on("gyro", (data) => {
                                        script.post(['gyro', data]);
                                    });
                                    emitter.on('execute-macro', (e, id:string) => {
                                        script.post(['execute-macro', id]);
                                    });
                                }
                            },
                            () => {
                                layout.webContents.send("init-config", config);
                                main.webContents.send("init", false);
                                emitter.removeAllListeners("config");
                                emitter.removeAllListeners("keybind");
                                emitter.removeAllListeners("cheats");
                                emitter.removeAllListeners("gk");
                                // dispose guarded listeners
                                try { guardInst && (guardInst as any).removeAll(); } catch {}
                                guardInst = null;
                                ipcMain.removeAllListeners("listen-sub");
                                ipcMain.removeAllListeners("listen-main");
                                ipcMain.removeAllListeners("reverse");
                                ipcMain.removeAllListeners("pos");
                                ipcMain.removeAllListeners("skillcode");
                                if(isDev) ipcMain.removeAllListeners("state");
                                ipcMain.removeAllListeners("scan-epos");
                                ipcMain.removeAllListeners("scan-entity");
                                ipcMain.removeAllListeners("clear-all");
                                ipcMain.removeAllListeners("except-number");
                                ipcMain.removeAllListeners("change-NaN");
                                ipcMain.removeAllListeners("change-ads-reward");
                                ipcMain.removeAllListeners("match-win");
                                ipcMain.removeAllListeners("match-lose");
                                ipcMain.removeAllListeners("match-draw");
                                ipcMain.removeAllListeners("receive-dia");
                                ipcMain.removeAllListeners("receive-gold");
                                ipcMain.removeAllListeners("receive-xp");
                                ipcMain.removeAllListeners("receive-clan-xp");
                                ipcMain.removeAllListeners("receive-sl-coin");
                                ipcMain.removeAllListeners("receive-sl-point");
                                ipcMain.removeAllListeners("unlock-sl-medal");
                                ipcMain.removeAllListeners("unlock-all-item");
                                ipcMain.removeAllListeners("kick-player");
                                ipcMain.removeAllListeners("change-nickname");
                                ipcMain.removeAllListeners("purchase-pass");
                                ipcMain.removeAllListeners("server-exploit");
                                ipcMain.removeAllListeners("get-ranges");
                                ipcMain.removeAllListeners("find-ranges");
                                ipcMain.removeAllListeners("execute-cmd");
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
        } catch (err){
            Logger.error("Agent error", err);
            state("session", "error", "Failed to start agent");
        }
    });

    // cheat
    emitter.on("listen-sub", (v:[number, number]) => {
        main.webContents.send("listen-sub", v);
    })
    emitter.on("listen-main", (v:[number, number]) => {
        main.webContents.send("listen-main", v);
    });
    emitter.on("pos", (pos:number[]) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        main.webContents.send("pos", pos);
    });
    emitter.on("skillcode", (code:number) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        main.webContents.send("skillcode", code);
    });
    if(isDev) emitter.on("state", (code:number) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        main.webContents.send("state", code);
    });
    emitter.on("epos-state", (_state:string, msg:string) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        state("epos", _state, msg);
    });
    emitter.on("entity-state", (_state:string, msg:string) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        state("entity", _state, msg);
    });
    emitter.on("clear-all", () => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        state("epos", "clear", "");
        state("entity", "clear", "");
        layout.webContents.send("clear");
    });
    emitter.on("clear-esp", () => {
        if(!layout || layout.isDestroyed() || !layout.isVisible()) return;
        layout.webContents.send("clear");
    });
    emitter.on("esp", (data:DrawRect[]) => {
        if(!layout || layout.isDestroyed() || !layout.isVisible() || !cheats['esp']) return;
        layout.webContents.send("draw", data);
    })
    emitter.on("except-number", (data:number[]) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        main.webContents.send("except-number", data);
    });
    // developer perf output forwarding
    emitter.on("perf", (data:any) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        main.webContents.send("perf", data);
    });
    ipcMain.on("console-cmd", (e: any, data:string) => {
        if(!main || main.isDestroyed() || !main.isVisible()) return;
        const [cmd, ...args] = data.trim().split(" ").map(s => s.trim())
        const msg = commander.apply(cmd, ...args);
        main.webContents.send("log", msg);
    });

    // server
    ipcMain.on("server-start", (e, port:number) => {
        web?.start(port || 3000);
    });
    ipcMain.on("server-stop", (e) => {
        web?.stop();
    });

    // click
    emitter.on("touch", (x:number, y:number) => {
        adb.shell(adbId, `input tap ${x} ${y}`);
    })
    // keyboard
    emitter.on("sendkey", async (keyName: string) => {
        if(nutKeymap[keyName]){
            keyboard.pressKey(nutKeymap[keyName]);
            keyboard.releaseKey(nutKeymap[keyName]);
        }
    })
});

emitter.on("log", (...args:any[]) => {
    Logger.log(...args);
    if(!main || main.isDestroyed() || !main.isVisible()) return;
    main.webContents.send("log", ...args);
});
ipcMain.on("log", (e, ...args:any[]) => {
    Logger.log(...args);
});