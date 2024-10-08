import Logger from "electron-log";
import EventEmitter from "events";
import { GlobalKeyboardListener, IGlobalKeyEvent } from "node-global-key-listener";
import dotenv from "dotenv";
import path from "path";
import { MongoClient } from "mongodb";
import { createWindow } from "./data/utils";
import { app, dialog, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import isDev from "electron-is-dev";
import frida from "frida";
import { existsSync, readFileSync } from "fs";
import { adb, checkFridaPerm, conenctFrida, connectAdbDevice, executeProcess, fileExist, fileName, getArch, getUrl, startFrida } from "./data/frida";
import { exec } from "child_process";

const process_name = 'com.gameparadiso.milkchoco';
const frida_version = '16.4.10';
const agentPath = isDev ? path.join(__dirname, './../public/scripts/', 'agent.js') : path.join(__dirname, './../../public/scripts/', 'agent.js');
if(!existsSync(agentPath)) {
    Logger.error("Failed to open agent file");
    process.exit(1);
}

const agentScript = readFileSync(agentPath, 'utf8').toString().split('"cut";')[1];

// load env
const envPath = path.join(__dirname, '/../', '/.env');
dotenv.config({ path: envPath });
// connect to mongo
const client = new MongoClient(process.env.MONGO_URI || "mongodb+srv://realtime:EhcTmV54vQFH0AXq@cluster0.qo3ekyu.mongodb.net/")
// register logger
Logger.initialize();
// create event emitter
const emitter = new EventEmitter();
const listener = new GlobalKeyboardListener();
// listen for global key events
listener.addListener((event, down) => {
    emitter.emit("gk", event, down);
});
// exit app
const exitApp = () => {
    Logger.log("App closed");
    app.quit();
    process.exit(0);
};

// main app events
app.on("ready", async () => {
    await client.connect();
    Logger.log("Connected to mongo");

    const main = createWindow("main", 300, 400, true, {
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
        Logger.log("Checking for updates");
    });

    autoUpdater.on("update-available", () => {
        Logger.log("Update available");
        main.webContents.send("update");
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on("download-progress", (progress) => {
        Logger.log("Download progress", progress.percent);
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
        Logger.log("Update cancelled");
        main.webContents.send("login");
    });

    autoUpdater.on("update-not-available", () => {
        Logger.log("Update not available");
        main.webContents.send("login");
    });

    // get token
    ipcMain.on("login", async (e, key) => {
        const db = client.db("sanabi");
        const tokens = db.collection("tokens");
        const token = await tokens.findOne({ key });
        if(!token) main.webContents.send("token", "Invalid token");
        else if(token.expiration < Date.now()) main.webContents.send("token", "Token expired");
        else main.webContents.send("token", token);
    });

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

    // vars
    let serial:string = "127.0.0.1:5555";
    let adbId:string = '';
    let frida:frida.Device = null;
    let cookie:string = '';
    let exp:frida.ScriptExports = null;
    let cheats:Cheats = {};
    let config:Config = {};
    let keybinds:Keybinds = {};

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
        cheats[id] = _state;
        emitter.emit("cheats", id, _state);
    });
    const state = (id:string, state:string, log:string) => {
        if(main.isDestroyed()) return;
        main.webContents.send("update-state", id, state, log);
    };

    const _main = async () => {
        try{
            adbId = await connectAdbDevice(serial);
            if(adbId === '') return state("adb", "error", "Failed to connect to adb");
            state("adb", "active", `Connected to adb`);
        } catch(err){
            Logger.error("ADB error", err);
            state("adb", "error", "Failed to connect to adb");
        }
    }
    ipcMain.on("connect-adb", async (e) => {
        state("adb", "pending", "Trying to connect to adb");
        try{
            await adb.startServer();
            state("adb", "pending", "Server started");
            await _main();
        } catch(err){
            Logger.error("ADB error", err);
            state("adb", "pending", "Server error");
            await _main();
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
    });

    ipcMain.on("connect-frida", async (e) => {
        state("frida", "pending", "Connecting to frida server");
        await conenctFrida(serial, () => state("frida", "error", "Frida server crashed"), (d) => {
            frida = d;
            state("frida", "active", "Connected to frida server");
        });
    });

    ipcMain.on("get-cookie", async (e) => {
        if(!frida) return state("session", "error", "Frida not connected");
        state("session", "pending", "Getting cookie");
        try{
            const [dispose, script] = await executeProcess(process_name, frida, `
                setTimeout(() => {
                    setImmediate(function() {
                        Java.perform(() => {
                            let Cocos2dxActivity = Java.use("org.cocos2dx.lib.Cocos2dxActivity");
                            Cocos2dxActivity["getCookie"].implementation = function (str) {
                                let result = this["getCookie"](str);
                                send(result);
                                return \`\${result}\`;
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
                }
            )
        } catch (err){
            Logger.error("Cookie error", err);
            state("session", "error", "Failed to get cookie");
        }
    });

    ipcMain.on("start-agent", async (e) => {
        if(!frida) return state("session", "error", "Frida not connected");
        state("session", "pending", "Starting agent");
        let found:boolean = false;
        try{
            const [dispose, script] = await executeProcess(process_name, frida, agentScript.replace("/*cookie*/", cookie),
                (message:frida.Message, data:Buffer) => {
                    if(message.type === 'send') {
                        const [channel, ...args] = [...message.payload];
                        if(channel == 'XigncodeClientSystem.initialize'){
                            exp = script.exports;
                            state("session", "active", "Xigncode Bypassed");
                        } else if(channel == 'Cocos2dxActivity.getCookie'){
                            Logger.info("CocosActivity Connected");
                            if(!found) script.post(['addr']);
                        } else if(channel == 'Address.init'){
                            found = true;
                            Logger.info("Address Found", args);
                            state("session", "succeed", `Address found`);
                            main.webContents.send("init", true);
                            script.post(['init', cheats, keybinds, config]);
                        } else emitter.emit(channel, ...args);
                    }
                },
                () => {
                    state("session", "pending", "Agent attached");
                    layout.webContents.send("init-config", config);
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
                    ipcMain.on("reverse", (e) => {
                        script.post(['reverse']);
                    });
                    ipcMain.on("pos", (e, pos:number[]) => {
                        script.post(['pos', pos]);
                    });
                    ipcMain.on("skillcode", (e, code:number) => {
                        script.post(['skillcode', code]);
                    });
                    ipcMain.on("scan-epos", (e) => {
                        script.post(['scan-epos']);
                    });
                    ipcMain.on("scan-entity", (e) => {
                        script.post(['scan-entity']);
                    });
                    ipcMain.on("clear-all", (e) => {
                        script.post(['clear-all']);
                    });
                    ipcMain.on("except-number", (e, data:number[]) => {
                        script.post(['except-number', data]);
                    });
                    ipcMain.on("change-ads-reward", (e) => {
                        script.post(['change-ads-reward']);
                    });
                    ipcMain.on("get-ranges", (e, data:string) => {
                        script.post(['get-ranges', data]);
                    });
                    ipcMain.on("find-ranges", (e, data:string) => {
                        script.post(['find-ranges', data]);
                    });
                },
                () => {
                    main.webContents.send("init", false);
                    emitter.removeAllListeners("config");
                    emitter.removeAllListeners("keybind");
                    emitter.removeAllListeners("cheats");
                    emitter.removeAllListeners("gk");
                    ipcMain.removeAllListeners("reverse");
                    ipcMain.removeAllListeners("pos");
                    ipcMain.removeAllListeners("skillcode");
                    ipcMain.removeAllListeners("scan-epos");
                    ipcMain.removeAllListeners("scan-entity");
                    ipcMain.removeAllListeners("clear-all");
                    ipcMain.removeAllListeners("except-number");
                    ipcMain.removeAllListeners("get-ranges");
                    ipcMain.removeAllListeners("find-ranges");
                    exp = null;
                    cheats = {};
                    state("session", "error", "Session disposed");
                    dispose();
                }
            )
        } catch (err){
            Logger.error("Agent error", err);
            state("session", "error", "Failed to start agent");
        }
    });

    // cheat
    emitter.on("pos", (pos:number[]) => {
        main.webContents.send("pos", pos);
    });
    emitter.on("skillcode", (code:number) => {
        main.webContents.send("skillcode", code);
    });
    emitter.on("epos-state", (_state:string, msg:string) => {
        state("epos", _state, msg);
    });
    emitter.on("entity-state", (_state:string, msg:string) => {
        state("entity", _state, msg);
    });
    emitter.on("clear-all", () => {
        state("epos", "clear", "");
        state("entity", "clear", "");
        layout.webContents.send("clear");
    });
    emitter.on("clear-esp", () => {
        layout.webContents.send("clear");
    });
    emitter.on("esp", (data:DrawRect[]) => {
        if(!layout.isDestroyed() && layout.isVisible() && cheats['esp']) {
            layout.webContents.send("draw", data);
        }
    })
    emitter.on("except-number", (data:number[]) => {
        main.webContents.send("except-number", data);
    });
});

emitter.on("log", (...args:any[]) => {
    Logger.log(...args);
});
ipcMain.on("log", (e, ...args:any[]) => {
    Logger.log(...args);
});