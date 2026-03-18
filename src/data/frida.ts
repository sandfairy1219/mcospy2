import { Client } from "adb-ts";
import { copyFileSync, existsSync } from "fs";
import path from "path";
import type * as Frida from "frida";

const getArgValue = (name: string): string | null => {
    const idx = process.argv.indexOf(name);
    if (idx === -1) return null;
    return process.argv[idx + 1] || null;
};

const ensureFridaBinding = () => {
    const target = path.join(process.cwd(), "frida_binding.node");

    const explicitCandidates = [
        process.env.FRIDA_BINDING_PATH,
        getArgValue("--frida-binding")
    ].filter((v): v is string => Boolean(v));

    for (const candidate of explicitCandidates) {
        if (!existsSync(candidate)) continue;
        try {
            copyFileSync(candidate, target);
            return;
        } catch {
            // try next candidate
        }
    }

    if (existsSync(target)) return;

    const appName = process.env.npm_package_name || "mcospy";
    const candidateRoots = [
        process.cwd(),
        path.dirname(process.execPath),
        path.join(path.dirname(process.execPath), "resources"),
        path.resolve(path.dirname(process.execPath), "..", "resources"),
        path.join(process.env.LOCALAPPDATA || "", "Programs", appName, "resources"),
        path.join(process.env.LOCALAPPDATA || "", appName, "resources"),
        path.join(process.env.ProgramFiles || "", appName, "resources"),
        path.resolve(__dirname, "..", "..", "node_modules", "frida", "build"),
        path.resolve(__dirname, "..", "..", "..", "node_modules", "frida", "build")
    ];

    for (const root of candidateRoots) {
        const candidate = path.join(root, "frida_binding.node");
        if (!existsSync(candidate)) continue;
        try {
            copyFileSync(candidate, target);
            return;
        } catch {
            // try next candidate
        }
    }

    console.warn("frida_binding.node not found in expected locations", {
        explicitCandidates,
        candidateRoots
    });
};

let _frida: typeof import("frida") | null = null;
const getFrida = (): typeof import("frida") => {
    if (!_frida) {
        ensureFridaBinding();
        _frida = require("frida");
    }
    return _frida;
};

export const adb = new Client({});

export const getUrl = (version: string, arch: string) => `https://github.com/frida/frida/releases/download/${version}/${fileName(version, arch)}.xz`;
export const fileNameFB = (version: string, arch: string) => `frida-server-${version}-freebsd-${arch}`;
export const fileName = (version: string, arch: string) => `frida-server-${version}-android-${arch}`;
export const getArch = async (id: string): Promise<string> => {
    if (id === "") {
        console.error("[*] ADB not connected");
        return "";
    }
    const os = await adb.shell(id, "getprop ro.product.cpu.abi");
    let arch = "arm";
    if (os.includes("x86")) {
        arch = "x86";
    }
    const bits = await adb.shell(id, "getprop ro.product.cpu.abilist");
    if (bits.includes("64")) {
        if (arch === "x86") arch = "x86_64";
        else arch = "arm64";
    }
    return arch;
};

let fridaServerGeneration = 0;
export const startFrida = async (id: string, filename: string, onCrashed: () => void): Promise<boolean> => {
    if (id === "") {
        console.error("[*] ADB not connected");
        return false;
    }
    try {
        const gen = ++fridaServerGeneration;
        try { await adb.shell(id, `su -c "killall frida-server"`); } catch {}
        const server = adb.shell(id, `su -c /data/local/tmp/${filename}`);
        const guardedCrash = async () => {
            if (gen !== fridaServerGeneration) return;
            try {
                const pid = await adb.shell(id, "pidof frida-server");
                if (pid.trim()) return;
            } catch {}
            onCrashed();
        };
        server.then(guardedCrash).catch(guardedCrash);
        return true;
    } catch {
        console.error("[*] Failed to start frida server");
        return false;
    }
};

export const connectFrida = async (serial: string, onCrashed: () => void, onConnected: (d: Frida.Device | null) => void) => {
    const frida = getFrida();
    try {
        const devc = await frida.getDevice(serial);
        if (devc) {
            devc.processCrashed.connect(onCrashed);
            onConnected(devc);
            return;
        }
    } catch {
        // device not found by id, try other methods
    }
    const deviceManager = frida.getDeviceManager();
    const ds = await deviceManager.enumerateDevices();
    if (ds.find(d => d.id === serial)) {
        const fridaDevice = await frida.getUsbDevice();
        fridaDevice.processCrashed.connect(onCrashed);
        onConnected(fridaDevice);
        return;
    }
    const tar = await deviceManager.addRemoteDevice(serial);
    if (!tar) {
        console.error(`[*] Frida device not connected to ${serial}`);
        onConnected(null);
        return;
    }
    tar.processCrashed.connect(onCrashed);
    onConnected(tar);
};

export const conenctFrida = connectFrida;

export const connectAdbDevice = async (serial: string): Promise<string> => {
    try {
        await adb.disconnect(serial);
    } catch {
        // ignore
    }
    const result = await adb.connect(serial);
    if (!result) {
        console.error("[*] Failed to connect to adb server");
        return "";
    }
    return result;
};

export const fileExist = async (id: string, version: string): Promise<string> => {
    if (id === "") {
        console.error("[*] ADB not connected");
        return "";
    }
    const files = await adb.readDir(id, "/data/local/tmp");
    const arch = await getArch(id);
    const file = files.find(file => ["frida", "frida-server", fileName(version, arch), fileNameFB(version, arch)].includes(file.name));
    if (!file) {
        console.error("[*] Frida server not found");
        return "";
    }
    return file.name;
};

export const checkFridaPerm = async (id: string, filename: string): Promise<boolean> => {
    if (id === "") {
        console.error("[*] ADB not connected");
        return false;
    }
    const permissions = await adb.shell(id, `ls -l /data/local/tmp/${filename}`);
    if (!permissions.includes("rwxrwxrwx")) {
        try {
            await adb.shell(id, `su -c "chmod 777 /data/local/tmp/${filename}"`);
            return true;
        } catch (err) {
            console.error(`[*] Failed to change permissions: ${err}`);
            return false;
        }
    }
    return true;
};

export const executeProcess = async (
    process: string,
    device: Frida.Device,
    _script: string,
    recieveCallback: (message: Frida.Message, data: Buffer | null) => void,
    attachCallback: () => void,
    disposeCallback: () => void,
    useEmulator: boolean = false
): Promise<[
    () => Promise<void>,
    Frida.Script,
    number | null
]> => {
    const pid = await device.spawn([process]);
    const frida = getFrida();
    const session = await device.attach(pid, { realm: useEmulator ? frida.Realm.Emulated : frida.Realm.Native });
    console.info("[*] Process attached");
    const script = await session.createScript(_script);
    await script.load();
    await session.resume();
    await device.resume(pid);
    console.info("[*] Session resumed");
    attachCallback();
    script.message.connect(recieveCallback);
    session.detached.connect(disposeCallback);
    const dispose = async () => {
        script.message.disconnect(recieveCallback);
        session.detached.disconnect(disposeCallback);
        await session.detach();
    };
    return [dispose, script, pid];
};

export const attachProcess = async (
    pid: number,
    device: Frida.Device,
    _script: string,
    recieveCallback: (message: Frida.Message, data: Buffer | null) => void,
    attachCallback: () => void,
    disposeCallback: () => void,
    useEmulator: boolean = false
): Promise<[
    () => Promise<void>,
    Frida.Script | null
]> => {
    if (!pid) {
        console.error("[*] Process not found");
        return [async () => {}, null];
    }
    const frida = getFrida();
    const session = await device.attach(pid, { realm: useEmulator ? frida.Realm.Emulated : frida.Realm.Native });
    const script = await session.createScript(_script);
    await script.load();
    attachCallback();
    script.message.connect(recieveCallback);
    session.detached.connect(disposeCallback);
    const dispose = async () => {
        script.message.disconnect(recieveCallback);
        session.detached.disconnect(disposeCallback);
        await session.detach();
    };
    return [dispose, script];
};
