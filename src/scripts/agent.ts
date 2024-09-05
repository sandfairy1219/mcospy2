"cut";
// setTimeout(() => {
//     setImmediate(function() {
        Java.perform(() => {
            let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
            XigncodeClientSystem["initialize"].implementation = function (activity:any,str:string,str2:string,str3:string,callback:() => void) {
                send(["XigncodeClientSystem.initialize", activity, str, str2, str3]);
                return 0;
            };
            let Cocos2dxActivity = Java.use("org.cocos2dx.lib.Cocos2dxActivity");
            Cocos2dxActivity["getCookie"].implementation = function (str:string) {
                let result = this["getCookie"](str);
                send(["Cocos2dxActivity.getCookie", str, result]);
                return '/*cookie*/';
            };
        });
//     });
// }, 100)
rpc.exports = {
    log: function(str) {
        send(["frida-log", str]);
        return str;
    },
    readArrayBytes: function(addr, size) {
        return ptr(addr).readByteArray(size);
    },
    readByte: function(addr) {
        return ptr(addr).readU8();
    },
    readInt16: function(addr) {
        return ptr(addr).readS16();
    },
    readInt32: function(addr) {
        return ptr(addr).readS32();
    },
    readFloat: function(addr) {
        return ptr(addr).readFloat();
    },
    readDouble: function(addr) {
        return ptr(addr).readDouble();
    },
    writeArrayBytes: function(addr, data) {
        ptr(addr).writeByteArray(data);
    },
    writeByte: function(addr, data) {
        ptr(addr).writeU8(data);
    },
    writeInt16: function(addr, data) {
        ptr(addr).writeS16(data);
    },
    writeInt32: function(addr, data) {
        ptr(addr).writeS32(data);
    },
    writeFloat: function(addr, data) {
        ptr(addr).writeFloat(data);
    },
    writeDouble: function(addr, data) {
        ptr(addr).writeDouble(data);
    },
    scan: function(base, size, pattern) {
        return Memory.scanSync(ptr(base), size, pattern);
    },
    enumerateModules: function() {
        return Process.enumerateModules();
    },
    aimbot: function(posbase, cambase, mode, speed, angle, datas){
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