"cut";
const xaOffset = {
    'no-recoil': 0x331176C,
    'no-clip': 0x330C87C,
    'no-spread1': 0x34FDCDC,
    'no-spread2': 0x34FDCF4,
    'instant-respawn': 0x30B4FA8,
    'body-one-kill': 0x34FDE28, // 506335232 => 505925632
    'head-one-kill': 0x34FDE20, // -1136594944 => 505925632
}
const anOffset = {
    "camera-base": 0x8A900C,
    "position-base": 0x7A37E0,
    "cash-base": 0x2CDF60,
    "skill-base": 0x8B58A5,
    "grenade-base": 0x8B5805,
}
const cdOffset = {
    "epos-pointer": [0x171E8, 0xBC, 0x0, 0x8],
    "player1-pointer": [0x171E8, 0xCC, 0x320, 0x110, 0x10],
}
const eposOffset = {
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
let config:{[key:string]:any} = {};

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
        } else if(name === 'addr'){
            const r = Process.enumerateRanges('r--')
            const rw = Process.enumerateRanges('rw-')
            const _xa = r.filter((range:RangeDetails) =>
                range.file &&
                range.file.path.includes('libMyGame.so') &&
                range.size >= 51068928
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
            send(['Address.init', xa.toString(), an.toString(), cd.toString()])
        } else if(name === 'cheats'){
            cheats[args[0]] = args[1];
            // Enable/Disable static address cheats
            switch(args[0]){

            }
        } else if(name === 'frame'){
            frame = args[0];
        } else if(name === 'config'){
            config[args[0]] = args[1];
        }
        recv(api)
    }
    recv(api)
});

function loop(){
    if(xa){
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