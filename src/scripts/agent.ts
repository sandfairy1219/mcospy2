"cut";
const xaOffset = {
    'no-recoil': 0x3311770, // -1124072416 => 505942016
    'no-clip': 0x330C87C, // 0.01 => 100
    'no-spread1': 0x34FDCDC, // -1119869952 => 505942016
    'no-spread2': 0x34FDCF4, // -1119870976 => 505942016
    'instant-respawn': 0x30B4FA8, // 505415712 => 505415680
    'body-one-kill': 0x34FDE28, // 506335232 => 505925632
    'head-one-kill': 0x34FDE20, // -1136594944 => 505925632
    'skill-damage': 0x3266148, // -1203335166 => 1384184322
}
const anOffset = {
    "camera-base": 0x8A900C,
    "position-base": 0x7A37E0,
    "cash-base": 0x2CDF60,
    "skill-base": 0x8B58A5,
    "grenade-base": 0x8B5805,
}
const cdOffset = {
    "epos-pointer": [[0x171E8, 0xBC], [0x0, 0x8]],
    "player1-pointer": [[0x171E8, 0xCC], [0x320, 0x110, 0x10]],
}
const eposOffset = {
    'number': 0x0, // int32
    'x': 0x190, // float
    'y': 0x194, // float
    'z': 0x198, // float
    'dx':0x100, // float
    'dy':0x134, // float
    'dz':0xFC, // float
    'state':0x12C, // int32
    'w1c':0xE8, // float
    'w2c':0xEC, // float
    'gc':0x1A8, // float
    'gx':0x13C, // float
    'gy':0x140, // float
    'gz':0x144, // float
    'sc':0xCC, // float
    'dc':0xE0, // float
    'timer':0xC8, // float
    'hp':0x2C, // int16
    'barrier':0x30, // int16,
    'sk':0xAD, // byte
    'fall':0xAF // byte
};

let xa:NativePointer = null;
let an:NativePointer = null;
let cd:NativePointer = null;

let frame:number = 60;
let cheats:{[key:string]:boolean} = {};
let keybinds:{[key:string]:string} = {};
let config:{[key:string]:any} = {};
let keymap:{[key:string]:boolean} = {};

Java.perform(() => {
    let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
    XigncodeClientSystem["initialize"].implementation = function (activity:any,str:string,str2:string,str3:string,callback:() => void) {
        send(["XigncodeClientSystem.initialize", activity, str, str2, str3]);
        return 0;
    };
    let Cocos2dxActivity = Java.use("org.cocos2dx.lib.Cocos2dxActivity");
    Cocos2dxActivity["getCookie"].implementation = function (str:string) {
        let result = this["getCookie"](str);
        send(["Cocos2dxActivity.getCookie"]);
        return '/*cookie*/';
    };
    function api(message:any[]) {
        const [name, ...args] = message;
        if(name === 'log'){
            send(['log', '[FRIDA]', args])
        } else if (name === 'init'){
            cheats = args[0];
            keybinds = args[1];
            config = args[2];
        } else if(name === 'addr'){
            const r = Process.enumerateRanges('r--')
            const rw = Process.enumerateRanges('rw-')
            send(['log', r.filter((v, i) => v.size >= 126950), rw.filter((v, i) => v.size >= 126950)])
            const _xa = r.filter((range:RangeDetails) =>
                range.file &&
                range.file.path.includes('libMyGame.so')
            )[0];
            const _an = rw.filter((range:RangeDetails) =>
                (!range.file) &&
                range.size >= 21921792
            )[0];
            const _cd = rw.filter((range:RangeDetails) =>
                range.file &&
                range.file.path.includes('libMyGame.so') &&
                range.size >= 126976
            )[0];
            if(_xa) xa = _xa.base;
            if(_an) an = _an.base;
            if(_cd) cd = _cd.base;
            if(!xa || !an || !cd) return recv(api);
            send(['Address.init', xa.toString(), an.toString(), cd.toString()])
        } else if(name === 'cheats'){
            if(!an || !xa || !cd) return recv(api);
            cheats[args[0]] = args[1];
            // Enable/Disable values
            switch(args[0]){
                case 'no-recoil':{
                    forceWriteS32(xa.add(xaOffset['no-recoil']), args[1] ? 505942016 : -1124072416);
                    break;
                }
                case 'no-clip':{
                    forceWriteFloat(xa.add(xaOffset['no-clip']), args[1] ? 100 : 0.01);
                    break;
                }
                case 'no-spread':{
                    forceWriteS32(xa.add(xaOffset['no-spread1']), args[1] ? 505942016 : -1119869952);
                    forceWriteS32(xa.add(xaOffset['no-spread2']), args[1] ? 505942016 : -1119870976);
                    break;
                }
                case 'instant-respawn':{
                    forceWriteS32(xa.add(xaOffset['instant-respawn']), args[1] ? 505415680 : 505415712);
                    break;
                }
                case 'one-kill':{
                    forceWriteS32(xa.add(xaOffset['body-one-kill']), args[1] ? 505925632 : 506335232);
                    forceWriteS32(xa.add(xaOffset['head-one-kill']), args[1] ? 505925632 : -1136594944);
                    break;
                }
                case 'skill-damage':{
                    forceWriteS32(xa.add(xaOffset['skill-damage']), args[1] ? 1384184322 : -1203335166);
                    break;
                }
            }
        } else if(name === 'frame'){
            frame = args[0];
        } else if(name === 'config'){
            config[args[0]] = args[1];
        } else if(name === 'keybind'){
            keybinds[args[0]] = args[1];
        } else if(name === 'keymap'){
            keymap = args[0];
        }
        recv(api)
    }
    recv(api)
});

function loop(){
    if(!an || !xa || !cd) return setTimeout(loop, 1000/frame);
    // Pin values
    try{
        const eposPointer = getChainedPointer(cd, cdOffset['epos-pointer'])
        send(['log', eposPointer]);
        if(cheats['shoot-speed']){
            if(eposPointer.isNull()) return setTimeout(loop, 1000/frame);
            if(keybinds['shoot-speed'] && !keymap[keybinds['shoot-speed']]) return setTimeout(loop, 1000/frame);
            eposPointer.add(eposOffset['w1c']).writeFloat(0);
            eposPointer.add(eposOffset['w2c']).writeFloat(0);
        }
        if(cheats['no-reload']){
            if(eposPointer.isNull()) return setTimeout(loop, 1000/frame);
            eposPointer.add(eposOffset['timer']).writeFloat(9999);
        }
        if(cheats['move-speed']){
            if(eposPointer.isNull()) return setTimeout(loop, 1000/frame);
            if(keybinds['move-speed'] && !keymap[keybinds['move-speed']]) return setTimeout(loop, 1000/frame);
            const half:number = Math.sin(45/180*Math.PI)
            if(keymap["W"] && keymap["A"]) eposPointer.add(eposOffset['dx']).writeFloat(half*config['move-speed-value']), eposPointer.add(eposOffset['dz']).writeFloat(half*config['move-speed-value']);
            else if(keymap["W"] && keymap["D"]) eposPointer.add(eposOffset['dx']).writeFloat(half*config['move-speed-value']), eposPointer.add(eposOffset['dz']).writeFloat(-half*config['move-speed-value']);
            else if(keymap["S"] && keymap["A"]) eposPointer.add(eposOffset['dx']).writeFloat(-half*config['move-speed-value']), eposPointer.add(eposOffset['dz']).writeFloat(half*config['move-speed-value']);
            else if(keymap["S"] && keymap["D"]) eposPointer.add(eposOffset['dx']).writeFloat(-half*config['move-speed-value']), eposPointer.add(eposOffset['dz']).writeFloat(-half*config['move-speed-value']);
            else if(keymap["W"]) eposPointer.add(eposOffset['dx']).writeFloat(config['move-speed-value']);
            else if(keymap["S"]) eposPointer.add(eposOffset['dx']).writeFloat(-config['move-speed-value']);
            else if(keymap["A"]) eposPointer.add(eposOffset['dz']).writeFloat(config['move-speed-value']);
            else if(keymap["D"]) eposPointer.add(eposOffset['dz']).writeFloat(-config['move-speed-value']);
            else {
                eposPointer.add(eposOffset['dx']).writeFloat(0);
                eposPointer.add(eposOffset['dz']).writeFloat(0);
            }
        }
        if(cheats['fly']){
            if(eposPointer.isNull()) return setTimeout(loop, 1000/frame);
            eposPointer.add(eposOffset['dy']).writeFloat(-.1);
            eposPointer.add(eposOffset['fall']).writeS8(0);
            const y = eposPointer.add(eposOffset['y']).readFloat();
            if(keybinds['fly-up']) eposPointer.add(eposOffset['y']).writeFloat(y + (config['fly-speed'] || 1));
            if(keybinds['fly-down']) eposPointer.add(eposOffset['y']).writeFloat(y - (config['fly-speed'] || 1));
        }
        if(cheats['skill-cooldown']){
            an.add(anOffset['skill-base']).writeS8(1);
        }
    } catch(e){
        send(['log', e.toString()]);
    }
    setTimeout(loop, 1000/frame);
}
loop();

rpc.exports = {
    log: function(str) {
        send(["frida-log", str]);
        return str;
    },
    readArrayBytes: function(addr, size, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readByteArray(size);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    readByte: function(addr, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readU8();
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    readInt16: function(addr, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readS16();
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    readInt32: function(addr, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readS32();
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    readFloat: function(addr, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readFloat();
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    readDouble: function(addr, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readDouble();
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    readPointer: function(addr, ignoreProtection:boolean = false) {
        const pointer = ptr(addr)
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
        const res = pointer.readPointer();
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r--');
        return res;
    },
    writeArrayBytes: function(addr, data, ignoreProtection:boolean = false) {
        const pointer = ptr(addr);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'rwx');
        pointer.writeByteArray(data);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
    },
    writeByte: function(addr, data, ignoreProtection:boolean = false) {
        const pointer = ptr(addr);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'rwx');
        pointer.writeS8(data);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
    },
    writeInt16: function(addr, data, ignoreProtection:boolean = false) {
        const pointer = ptr(addr);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'rwx');
        pointer.writeS16(data);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
    },
    writeInt32: function(addr, data, ignoreProtection:boolean = false) {
        const pointer = ptr(addr);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'rwx');
        pointer.writeS32(data);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
    },
    writeFloat: function(addr, data, ignoreProtection:boolean = false) {
        const pointer = ptr(addr);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'rwx');
        pointer.writeFloat(data);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
    },
    writeDouble: function(addr, data, ignoreProtection:boolean = false) {
        const pointer = ptr(addr);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'rwx');
        pointer.writeDouble(data);
        if(ignoreProtection) Memory.protect(pointer, Process.pageSize, 'r-x');
    },
    writePointer: function(addr, data, ignoreProtection:boolean = false) {
        if(ignoreProtection) Memory.protect(ptr(addr), Process.pageSize, 'rwx');
        ptr(addr).writePointer(ptr(data));
        if(ignoreProtection) Memory.protect(ptr(addr), Process.pageSize, 'r-x');
    },
    scan: function(base, size, pattern) {
        return Memory.scanSync(ptr(base), size, pattern);
    },
    enumerateModules: function() {
        return Process.enumerateModules();
    },
    aimbot: function(cambase, mode, speed, angle, datas){
        const rad = angle/180*Math.PI;
        const camX = ptr(cambase).add(0xc).readFloat();
        const camY = ptr(cambase).add(0x10).readFloat();
        const camZ = ptr(cambase).add(0x14).readFloat();
        const yaw = ptr(cambase).add(0x4).readFloat();
        const pitch = ptr(cambase).readFloat();
        const targets = datas.map((vec3:any) => {
            const dx = vec3.x - camX;
            const dy = vec3.y - camY;
            const dz = vec3.z - camZ;
            const yo = Math.atan2(dx, dz)
            let ya = yo - yaw;
            while(ya > Math.PI) ya -= Math.PI * 2;
            while(ya < -Math.PI) ya += Math.PI * 2;
            const po = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz))
            let pi = po - pitch;
            const from = Math.sqrt(ya * ya + pi * pi);
            return [yo, po, -ya, -pi, from];
        }).filter((d:any[]) => d[4] <= rad).sort((a:any[], b:any[]) => a[4] - b[4]);
        const target = targets[0];
        if(target){
            if(mode === "instant") {
                ptr(cambase).add(0x4).writeFloat(target[0]);
                ptr(cambase).writeFloat(target[1]);
            } else {
                const radyaw = target[2] > 0 ? rad : -rad;
                const radpitch = target[3] > 0 ? rad : -rad;
                const ry = target[2] > 0 ? Math.max(radyaw, target[2]) : Math.min(radyaw, target[2]);
                const rp = target[3] > 0 ? Math.max(radpitch, target[3]) : Math.min(radpitch, target[3]);
                const ry2 = ry - target[2];
                const rp2 = rp - target[3];
                const ry3 = target[2] > 0 ? Math.min(target[2], ry2) : Math.max(target[2], ry2);
                const rp3 = target[3] > 0 ? Math.min(target[3], rp2) : Math.max(target[3], rp2);
                const nyaw = yaw - (mode === 'smooth' ? ry3 * (speed/100) : target[2] * (speed/100));
                const npitch = pitch - (mode === 'smooth' ? rp3 * (speed/100) : target[3] * (speed/100));
                ptr(cambase).add(0x4).writeFloat(nyaw);
                ptr(cambase).writeFloat(npitch);
            }
        }
    }
}

function getChainedPointer(_bs:NativePointer, iters:number[][]):NativePointer{
    let pt = _bs;
    iters.forEach((iter, i) => {
        for(let offset of iter){
            pt = pt.add(offset);
            pt = i ? pt.readPointer() : ptr(readHex(pt));
            if(pt.isNull()) return null;
        }
    });
    return pt;
}
function readHex(ptr: NativePointer): string {
    const buffer = ptr.readByteArray(4);
    const byteArray = new Uint8Array(buffer).reverse();
    
    let hexString = '';
    for (let byte of byteArray) {
        hexString += byte.toString(16).padStart(2, '0');
    }
    return "0x" + hexString;
}
function forceWriteS32(_ptr:NativePointer, value:number){
    Memory.protect(_ptr, Process.pageSize, 'rwx');
    _ptr.writeS32(value);
    Memory.protect(_ptr, Process.pageSize, 'r--');
}

function forceWriteFloat(_ptr:NativePointer, value:number){
    Memory.protect(_ptr, Process.pageSize, 'rwx');
    _ptr.writeFloat(value);
    Memory.protect(_ptr, Process.pageSize, 'r--');
}