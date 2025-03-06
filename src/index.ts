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
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { _anOffset, _cdOffset, _eposOffset, _xaOffset } from "./offsets";

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
const appServer = express();
const server = createServer(appServer);
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
    await tokens.updateOne({ key:tk.key }, { $set: { using: false } });
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
        else if(token.using) main.webContents.send("token", "Token already using");
        else {
            tk = token as unknown as Token;
            await tokens.updateOne({ key }, { $set: { using:true } })
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
                }
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
            const [dispose, script] = await executeProcess(process_name, fridaDevice,
                agentScript
                .replace("/*cookie*/", cookie)
                .replace("/*xaOffset*/", JSON.stringify(_xaOffset))
                .replace("/*anOffset*/", JSON.stringify(_anOffset))
                .replace("/*cdOffset*/", JSON.stringify(_cdOffset))
                .replace("/*eposOffset*/", JSON.stringify(_eposOffset))
                ,
                (message:frida.Message, data:Buffer) => {
                    if(message.type === 'send') {
                        const [channel, ...args] = [...message.payload];
                        if(channel == 'XigncodeClientSystem.initialize'){
                            exp = script.exports;
                            state("session", "active", "Xigncode Bypassed");
                        } else if(channel == 'Cocos2dxActivity.getCookie'){
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
                        ipcMain.on("reverse", (e) => {
                            script.post(['reverse']);
                        });
                        ipcMain.on("pos", (e, pos:number[]) => {
                            script.post(['pos', pos]);
                        });
                        ipcMain.on("skillcode", (e, code:number) => {
                            script.post(['skillcode', code]);
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
                        ipcMain.on("change-ads-reward", (e) => {
                            script.post(['change-ads-reward']);
                        });
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
                    ipcMain.removeAllListeners("reverse");
                    ipcMain.removeAllListeners("pos");
                    ipcMain.removeAllListeners("skillcode");
                    ipcMain.removeAllListeners("scan-epos");
                    ipcMain.removeAllListeners("scan-entity");
                    ipcMain.removeAllListeners("clear-all");
                    ipcMain.removeAllListeners("except-number");
                    ipcMain.removeAllListeners("change-ads-reward");
                    ipcMain.removeAllListeners("get-ranges");
                    ipcMain.removeAllListeners("find-ranges");
                    emitter.removeAllListeners("gyro");
                    emitter.removeAllListeners("execute-macro");
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
});

emitter.on("log", (...args:any[]) => {
    Logger.log(...args);
});
ipcMain.on("log", (e, ...args:any[]) => {
    Logger.log(...args);
});