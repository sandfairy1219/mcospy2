import { Client } from "adb-ts"
import Logger from "electron-log"
import * as frida from "frida"

export const adb = new Client({})

export const getUrl = (version:string, arch:string) => `https://github.com/frida/frida/releases/download/${version}/${fileName(version, arch)}.xz`
export const fileNameFB = (version:string, arch:string) => `frida-server-${version}-freebsd-${arch}`
export const fileName = (version:string, arch:string) => `frida-server-${version}-android-${arch}`
export const getArch = async (id:string):Promise<string> => {
    if(id === '') {
        Logger.error('[*] ADB not connected')
        return ''
    }
    const os = await adb.shell(id, 'getprop ro.product.cpu.abi')
    let arch = 'arm'
    if (os.includes('x86')) {
        arch = 'x86'
    }
    const bits = await adb.shell(id, 'getprop ro.product.cpu.abilist')
    if (bits.includes('64')) {
        if(arch === 'x86') arch = 'x86_64'
        else arch = 'arm64'
    }
    return arch
}

export const startFrida = async (id:string, filename:string, onCrashed:() => void):Promise<boolean> => {
    if(id === '') {
        Logger.error('[*] ADB not connected');
        return false;
    }
    try{
        const server = adb.shell(id, `su -c /data/local/tmp/${filename}`)
        server.then(onCrashed)
        return true
    } catch (err) {
        Logger.error(`[*] Failed to start frida server`)
        return false
    }
}

export const conenctFrida = async (serial:string, onCrashed:() => void, onConnected:(d:frida.Device) => void) => {
    const deviceManager = frida.getDeviceManager();
    const ds = await deviceManager.enumerateDevices()
    if(ds.find(d => d.id === serial)) {
        const fridaDevice = await frida.getUsbDevice();
        fridaDevice.processCrashed.connect(onCrashed);
        onConnected(fridaDevice)
        return
    }
    const tar = await deviceManager.addRemoteDevice(serial)
    if (!tar) {
        Logger.error(`[*] Frida device not connected to ${serial}`)
        onConnected(null)
    }
    deviceManager.added.connect(async () => {
        const fridaDevice = await frida.getUsbDevice();
        fridaDevice.processCrashed.connect(onCrashed);
        onConnected(fridaDevice)
    })
}

export const connectAdbDevice = async (serial:string):Promise<string> => {
    const devices = await adb.map(async (device) => {
        if (device.id === serial) {
            await device.tcpip();
            return device.id
        }
        return ''
    })
    const result = (await Promise.all(devices)).find(d => d !== '')

    if (!result) {
        Logger.error(`[*] ADB device not connected to ${serial}`)
        return ''
    } else {
        return result
    }
}

export const fileExist = async (id:string, version:string):Promise<string> => {
    if(id === '') {
        Logger.error('[*] ADB not connected');
        return '';
    }
    const files = await adb.readDir(id, '/data/local/tmp');
    const arch = await getArch(id);
    const file = files.find(file => ["frida", "frida-server", fileName(version, arch), fileNameFB(version, arch)].includes(file.name))
    if (!file) {
        Logger.error('[*] Frida server not found')
        return ""
    }
    return file.name
}

export const checkFridaPerm = async (id:string, filename:string):Promise<boolean> => {
    if(id === '') {
        Logger.error('[*] ADB not connected');
        return false;
    }
    const permissions = await adb.shell(id, `ls -l /data/local/tmp/${filename}`)
    if (!permissions.includes('rwxrwxrwx')) {
        try{
            const chmod = await adb.shell(id, `su -c chmod 777 /data/local/tmp/${filename}`)
            return true
        } catch (err) {
            Logger.error(`[*] Failed to change permissions`)
            return false
        }
    } else {
        return true
    }
}

export const executeProcess = async (
    process:string,
    device:frida.Device,
    _script:string,
    recieveCallback:(message: frida.Message, data: Buffer | null) => void,
    attachCallback:() => void,
    disposeCallback:() => void
):Promise<[
    () => Promise<void>,
    frida.Script
]> => {
    const pid = await device.spawn([process])
    const session = await device.attach(pid)
    Logger.info(`[*] Process attached`)
    const script = await session.createScript(_script)
    await script.load()
    await session.resume()
    await device.resume(pid)
    Logger.info(`[*] Session resumed`)
    attachCallback()
    script.message.connect(recieveCallback)
    session.detached.connect(disposeCallback)
    const dispose = async () => {
        script.message.disconnect(recieveCallback)
        session.detached.disconnect(disposeCallback)
        await session.detach()
    }
    return [dispose, script]
}