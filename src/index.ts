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
import { adb, attachProcess, checkFridaPerm, conenctFrida, connectAdbDevice, executeProcess, fileExist, fileName, getArch, getUrl, startFrida } from "./data/frida";
import { exec } from "child_process";
import express from "express";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import { _anOffset, _eposOffset, _xaOffset } from "./offsets";
import { Key, keyboard } from "@nut-tree-fork/nut-js";
import { nutKeymap } from "./keymaps";

keyboard.config.autoDelayMs = 0;

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
// connect to mongodb
const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
// register logger
Logger.initialize();
// create event emitter
const emitter = new EventEmitter();
const listener = new GlobalKeyboardListener();
// listen for global key events
listener.addListener((event, down) => {
    emitter.emit("gk", event, down);
});

// vars
let tk:Token|null = null;
let serial:string = "127.0.0.1:5555";
let adbId:string = '';
let fridaDevice:frida.Device = null;
let cookie:string = '';
let exp:frida.ScriptExports = null;
let cheats:Cheats = {};
let config:Config = {};
let keybinds:Keybinds = {};

// express server
// const copt = {
//     cert: readFileSync(path.join(__dirname, './../public/cert', 'cert.pem')),
//     key: readFileSync(path.join(__dirname, './../public/cert', 'key.pem')),
// }
const appServer = express();
const server = http.createServer(appServer);
// const server = https.createServer(copt, appServer);
const io = new Server(server);
appServer.use(express.static(path.join(__dirname, './../public')));
appServer.get('/', (req, res) => {res.sendFile(path.join(__dirname, './../public/routes/main.html'))});
appServer.get('/mobile', (req, res) => {
    if(config['plugin-server-mobile-controller']){
        res.sendFile(path.join(__dirname, './../public/routes/mobile_controller.html'))
    } else {
        res.send("Mobile controller disabled");
    }
});
// exit app
const exitApp = async () => {
    const db = client.db("sanabi");
    const tokens = db.collection("tokens");
    if(tk) await tokens.updateOne({ code:tk.code }, { $set: { using: false } });
    Logger.log("App closed");
    app.quit();
    server.close();
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
        await conenctFrida(serial, () => state("frida", "error", "Frida server crashed"), (d) => {
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
                                    ipcMain.on("scan-epos", async (e) => {
                                        script.post(['scan-epos']);
                                        script.post(['tier-numbers', await getExceptNums()]);
                                    });
                                    ipcMain.on("scan-entity", async (e) => {
                                        script.post(['scan-entity']);
                                        script.post(['tier-numbers', await getExceptNums()]);
                                    });
                                    ipcMain.on("clear-all", (e) => {
                                        script.post(['clear-all']);
                                    });
                                    ipcMain.on("except-number", (e, data:number[]) => {
                                        script.post(['except-number', data]);
                                    });
                                    ipcMain.on("change-NaN", (e) => {
                                        script.post(['change-NaN']);
                                    });
                                    ipcMain.on("change-ads-reward", (e) => {
                                        script.post(['change-ads-reward']);
                                    });
                                    ipcMain.on("match-win", (e) => script.post(['match-win']));
                                    ipcMain.on("match-lose", (e) => script.post(['match-lose']));
                                    ipcMain.on("match-draw", (e) => script.post(['match-draw']));
                                    ipcMain.on("receive-dia", (e, amount: number) => script.post(['receive-dia', amount]));
                                    ipcMain.on("receive-gold", (e, amount: number) => script.post(['receive-gold', amount]));
                                    ipcMain.on("receive-xp", (e, amount: number) => script.post(['receive-xp', amount]));
                                    ipcMain.on("receive-clan-xp", (e, amount: number) => script.post(['receive-clan-xp', amount]));
                                    ipcMain.on("receive-sl-coin", (e, amount: number) => script.post(['receive-sl-coin', amount]));
                                    ipcMain.on("receive-sl-point", (e, amount: number) => script.post(['receive-sl-point', amount]));
                                    ipcMain.on("unlock-sl-medal", (e) => script.post(['unlock-sl-medal']));
                                    ipcMain.on("unlock-all-item", (e, charid: number) => script.post(['unlock-all-item', charid]));
                                    
                                    ipcMain.on("kick-player", (e, number: number) => script.post(['kick-player', number]));
                                    ipcMain.on("change-nickname", (e, name: string) => script.post(['change-nickname', name]));
                                    ipcMain.on("purchase-pass", (e, num: number, item: number) => script.post(['purchase-pass', num, item]));
                                    ipcMain.on("server-exploit", (e) => script.post(['server-exploit']));

                                    ipcMain.on("ctm-default-milk", (e) => script.post(['ctm-default-milk']));
                                    ipcMain.on("ctm-default-choco", (e) => script.post(['ctm-default-choco']));
                                    ipcMain.on("ctm-desert-milk", (e) => script.post(['ctm-desert-milk']));
                                    ipcMain.on("ctm-desert-choco", (e) => script.post(['ctm-desert-choco']));
                                    ipcMain.on("ctm-castle-milk", (e) => script.post(['ctm-castle-milk']));
                                    ipcMain.on("ctm-castle-choco", (e) => script.post(['ctm-castle-choco']));
                                    ipcMain.on("ctm-mountain-milk", (e) => script.post(['ctm-mountain-milk']));
                                    ipcMain.on("ctm-mountain-choco", (e) => script.post(['ctm-mountain-choco']));
                                    ipcMain.on("get-ranges", (e, data:string) => {
                                        script.post(['get-ranges', data]);
                                    });
                                    ipcMain.on("find-ranges", (e, data:string) => {
                                        script.post(['find-ranges', data]);
                                    });
                                    ipcMain.on("search-pattern", (e, data:string) => {
                                        script.post(['search-pattern', data]);
                                    });
                                    ipcMain.on("execute-cmd", (e, data:string) => script.post(['execute-cmd', data]));
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
                                cheats = {};
                                state("session", "error", "Session disposed");
                                dispose();
                            },
                            true // useEmulator
                        )
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
        main.webContents.send("pos", pos);
    });
    emitter.on("skillcode", (code:number) => {
        main.webContents.send("skillcode", code);
    });
    if(isDev) emitter.on("state", (code:number) => {
        main.webContents.send("state", code);
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

    // server
    ipcMain.on("server-start", (e, port:number) => {
        state('express', 'pending', 'Starting server');
        server.listen(port, () => {
            state('express', 'active', `Started on port ${port}`);
        });
    });
    ipcMain.on("server-stop", (e) => {
        state('express', 'pending', 'Stopping server');
        server.close(() => {
            state('express', 'error', 'Server stopped');
        });
    });

    // socket
    io.on("connection", (socket) => {
        console.log("Socket connected");
        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });
        socket.on("gyro", (data) => {
            if(config['gyro-scope']) emitter.emit("gyro", data);
        });
        socket.on("key", (key:string) => {
            console.log("Keydown", key);
        });
    });

    // click
    emitter.on("touch", (x:number, y:number) => {
        adb.shell(adbId, `input tap ${x} ${y}`);
    })
    // keyboard
    keyboard.config.autoDelayMs = 0;
    emitter.on("sendkey", async (keyName: string) => {
        if(nutKeymap[keyName]){
            keyboard.pressKey(nutKeymap[keyName]);
            keyboard.releaseKey(nutKeymap[keyName]);
        }
    })
});

emitter.on("log", (...args:any[]) => {
    Logger.log(...args);
});
ipcMain.on("log", (e, ...args:any[]) => {
    Logger.log(...args);
});