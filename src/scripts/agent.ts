"cut";
const xaOffset = {
    'no-recoil': 0x3376274, // -1124072416 => 505942016
    // 18 20 20 1E 0D 02 00 54 01 00 40 BD 21 00 44 F9 00
    // 1.50.2 0x330E7CC
    // 1.50.0 0x331078C
    'no-clip': 0x3371384, // 0.01 => 100
    // 0A D7 23 3C
    // 1.50.2 0x33098EC
    // 1.50.0 0x330B8AC
    'no-spread1': 0x35651DC, // -1119869952 => 505942016
    // 00 24 40 BD  C0 03 5F D6 FD 7B BF A9
    // 1.50.2 0x34F9304
    // 1.50.0 0x35020C4
    'no-spread2': 0x35651F4, // -1119870976 => 505942016
    // 00 20 40 BD C0 03 5F D6 FD 7B BE A9
    // 1.50.2 0x34F931C
    // 1.50.0 0x35020DC
    'no-reload': 0x35651C4, // -1136562176 => 505925632
    // 00 70 41 BC C0 03 5F D6 FD 7B BF A9
    // 1.50.2 0x34F92EC
    // 1.50.0 0x35020AC
    'instant-respawn': 0x3116344, // 505415712 => 505415680
    // 20 08 20 1E C0 03 5F D6 6F 12 83 3A FD 7B BE A9
    // 1.50.2 0x30B6FD8
    // 1.50.0 0x30B6FD8
    'body-one-kill': 0x3565340, // 506335232 => 505925632
    // 00 10 2E 1E C0 03 5F D6 FD 7B BF A9
    // 1.50.2 0x34F9450
    // 1.50.0 0x3502210
    'head-one-kill': 0x3565338, // -1136594944 => 505925632
    // 00 F0 40 BC C0 03 5F D6 00 10 2E 1E
    // 1.50.2 0x34F9448
    // 1.50.0 0x3502208
    'skill-damage': 0x32C9A24, // -1203335166 => 1384184322
    // 02 90 46 B8 E0 03 02 2A C0 03 5F D6 42 0C 40 F9
    // 1.50.2 0x32651B8
    // 1.50.0 0x3266178
    'cookerbuff': 0x3565B9C, // 506335232 => 505925632
    // 00 10 2E 1E C0 03 5F D6
    // 1.50.2 0x34F9C68
    // 1.50.0 0x3502A28
}
const anOffset = {
    "camera-base": 0x8AB0CC,
    // 1.50.2 0x8A917C
    // 1.50.0 0x8A900C
    "yaw": 0x8AB0CC + 0x4,
    "pitch": 0x8AB0CC + 0x0,
    "camX": 0x8AB0CC + 0xC,
    "camY": 0x8AB0CC + 0x10,
    "camZ": 0x8AB0CC + 0x14,
    "cam-distance": 0x8AB0CC + 0x24,

    "position-base": 0x7A55E0,
    // 1.50.2 0x7A3950
    // 1.50.0 0x7A37E0
    "x": 0x7A55E0 + 0x0,
    "y": 0x7A55E0 + 0x4,
    "z": 0x7A55E0 + 0x8,

    "cash-base": 0x2CF018,
    "dia": 0x2CF018 + 0x0,
    "dia-total": 0x2CF018 + 0x8,
    "dia-used": 0x2CF018 + 0xC,
    "gold": 0x2CF018 + 0x10,
    "gold-total": 0x2CF018 + 0x14,
    "gold-used": 0x2CF018 + 0x18,
    "clan-gold": 0x2CF018 + 0x1C,
    // 1.50.2 0x2CE0C8
    // 1.50.0 0x2CDF60
    "skill-base": 0x8B7985,
    // 1.50.2 0x8B5A15
    // 1.50.0 0x8B58A5
    "grenade-base": 0x8B78D9,
    // 1.50.2 0x8B5969
    // 1.50.0 0x8B5805
}
const cdOffset = {
    "epos-pointer": [0x668, 0x58, 0x178, 0x130, 0x200, 0x158],
}
const eposOffset = {
    'number': 0x0, // int32
    'exp': 0x4, // int32
    'totalkill': 0x8, // int32
    'totaldeath': 0xC, // int32
    'totalassist': 0x10, // int32
    'kda': 0x14, // float
    'kill': 0x18, // int32
    'death': 0x1C, // int32
    'assist': 0x20, // int32
    'hp':0x2C, // int16
    'weapon':0x2E, // int16
    'barrier':0x30, // int16
    'nickname':0x88, // string 10
    'sk':0xAD, // byte
    'fall':0xAF, // byte
    'timer':0xC8, // float
    'sc':0xCC, // float
    'dc':0xE0, // float
    'w1c':0xE8, // float
    'w2c':0xEC, // float
    'dz':0xFC, // float
    'dx':0x100, // float
    'state':0x12C, // int32
    'dy':0x134, // float
    'gx':0x13C, // float
    'gy':0x140, // float
    'gz':0x144, // float
    'zr1':0x18C, // float
    'x': 0x190, // float
    'y': 0x194, // float
    'z': 0x198, // float
    'zr2':0x19C, // float
    'gc':0x1A8, // float
    'ox':0x1AC, // float
    'oy':0x1B0, // float
    'oz':0x1B4, // float
    'pointer':0xEE8, // pointer
};

const charHealth = [
    {hp: 208, barrier: 27},
    {hp: 249, barrier: 45},
    {hp: 240, barrier: 31},
    {hp: 269, barrier: 30},
    {hp: 240, barrier: 59},
    {hp: 263, barrier: 55},
    {hp: 244, barrier: 19},
    {hp: 191, barrier: 18},
    {hp: 265, barrier: 24},
    {hp: 255, barrier: 16},
    {hp: 271, barrier: 10},
    {hp: 288, barrier: 73},
    {hp: 236, barrier: 13},
    {hp: 256, barrier: 23},
    {hp: 222, barrier: 18},
    {hp: 254, barrier: 22},
    {hp: 224, barrier: 21},
    {hp: 220, barrier: 15},
    {hp: 274, barrier: 27},
    {hp: 247, barrier: 32},
    {hp: 220, barrier: 25},
    {hp: 253, barrier: 16},
    {hp: 240, barrier: 0},
    {hp: 245, barrier: 20},
    {hp: 200, barrier: 70},
    {hp: 225, barrier: 35},
]

// 0 = ground stop
// 1 = ground walk
// 2 = air stop
// 3 = air walk
// 8 = shoot stop
// 9 = shoot walk
// 10 = shoot air stop
// 11 = shoot air walk
// 128 = grenade stop
// 127 = grenade walk
// 126 = grenade air stop
// 125 = grenade air walk
// 64 = reload
// 65 = reload walk
// 66 = reload air stop
// 67 = reload air walk
// 32 = jump
// 33 = jump walk
// 16 = death

const camFov = [92, 52];
const upSize = 9;
const downSize = -0.5;
const sideSize = 2.5;

interface Point{
    x:number;
    y:number;
}

interface DrawRect{
    upside:Point[];
    downside:Point[];
    number:number;
    nickname:string;
    hp:number;
    barrier:number;
    total:number;
    isTeam:boolean;
    isDead:boolean;
}

interface Macro{
    id: string;
    events: MacroEvent[];
}

interface MacroEvent{
    base: "xa" | "an" | "epos";
    type: "float" | "int32" | "int16" | "byte";
    offset: string; // offset name in xaOffset, anOffset, eposOffset
    target?: "self" | "enemy" | "all"; // only for epos
    index?: number; // only for epos & target is entity
    value: number;
}

let isArm = false
let xa:NativePointer = null;
let an:NativePointer = null;
let cd:NativePointer = null;
let jit:NativePointer = null;
let jtRange:number = null;
let cas:RangeDetails[] = [];
let epos:NativePointer = null;
let entityList:NativePointer[] = [];
let excepts:number[] = [];

let cheats:{[key:string]:boolean} = {};
let keybinds:{[key:string]:string} = {};
let config:{[key:string]:any} = {};
let keymap:{[key:string]:boolean} = {};
let macros:Macro[] = [];

const log = (...args:any[]) => send(['log', ...args]);

Java.perform(() => {
    let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
    XigncodeClientSystem["initialize"].implementation = function (activity:any,str:string,str2:string,str3:string,callback:() => void) {
        send(["XigncodeClientSystem.initialize", activity, str, str2, str3]);
        return 0;
    };
    // let Cocos2dxActivity = Java.use("org.cocos2dx.lib.Cocos2dxActivity");
    XigncodeClientSystem["getCookie2"].implementation = function (str:string) {
        let result = this["getCookie2"](str);
        log(result)
        send(["Cocos2dxActivity.getCookie"]);
        return '/*cookie*/';
    };
    function api(message:any[]) {
        try{
            const [name, ...args] = message;
            if(name === 'log'){
                log("[FRIDA]", ...args);
            } else if (name === 'init'){
                cheats = args[0];
                keybinds = args[1];
                config = args[2];
                excepts = (config['except-number'] as string || "").split(',').filter(v => v).map(v => parseInt(v) || 0).filter(v => v) || [];
            } else if(name === 'addr'){
                const r = Process.enumerateRanges('r--');
                const rw = Process.enumerateRanges('rw-');
                const rx = Process.enumerateRanges('r-x');
                const rwx = Process.enumerateRanges('rwx');
                const _xa = r.filter((range:RangeDetails) =>
                    range.file &&
                    range.file.path.includes('libMyGame.so')
                );
                if(_xa[0]) xa = _xa[0].base
                else {
                    const __xa = rx.filter((range:RangeDetails) =>
                        range.file &&
                        range.file.path.includes('split_config.arm64_v8a.apk') &&
                        range.size >= 0x442_8000
                    );
                    if(__xa[0]) {
                        xa = __xa[0].base;
                    }
                }
                isArm = Process.arch.includes('arm');
                const _an = rw.filter((range:RangeDetails) =>
                    (!range.file) &&
                    range.size >= (isArm ? 0x1000 : 0x14E_8000)
                );
                if(_an[0]) an = _an[0].base;
                if(isArm) rwx.filter((range:RangeDetails) =>
                    range.size >= 0x1_0000
                ).forEach((range:RangeDetails) => {
                    const dia = range.base.add(anOffset['cash-base']).readS32();
                    if(dia === 17){
                        log("AN Found:", range.base.toString())
                    } else {
                        log(range.base.toString(), dia)
                    }
                });
                const _jt = rx.filter(range => range.file && range.file.path.includes("jit"));
                if(_jt[0]) {
                    jit = _jt[0].base;
                    jtRange = _jt[0].size;
                }
                if(!xa || !an) return recv(api);
                if(!isArm && !jit) return recv(api);
                send(['Address.init', xa.toString(), an.toString(), jit.toString()])
            } else if(name === 'cheats'){
                if(!an || !xa) return recv(api);
                cheats[args[0]] = args[1];
                // Enable/Disable values
                switch(args[0]){
                    case 'esp':{
                        if(!args[1]) send(['clear-esp']);
                    }
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
                    case 'no-reload':{
                        forceWriteS32(xa.add(xaOffset['no-reload']), args[1] ? 505925632 : -1136562176);
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
                    case 'cooker-buff':{
                        forceWriteS32(xa.add(xaOffset['cookerbuff']), args[1] ? 505925632 : 506335232);
                        break;
                    }
                }
            } else if(name === 'config'){
                config[args[0]] = args[1];
            } else if(name === 'keybind'){
                keybinds[args[0]] = args[1];
            } else if(name === 'keyevent'){
                const key = args[0];
                const action = args[1];
                keymap = args[2];
                if(key === keybinds['reverse'] && action === 'DOWN') reverse();
                if(key === keybinds['scan-epos'] && action === 'DOWN') {
                    epos = scanEpos();
                }
                if(key === keybinds['scan-entity'] && action === 'DOWN') {
                    entityList = scanEntityList(epos);
                }
                if(key === keybinds['clear-all'] && action === 'DOWN') clearAll();
                if(key === keybinds['esp-mark'] && action === 'DOWN'){
                    if(!an) return recv(api);
                    if(an.isNull()) return recv(api);
                    const cambase = an.add(anOffset['camera-base']);
                    const camX = cambase.add(0xc).readFloat();
                    const camY = cambase.add(0x10).readFloat();
                    const camZ = cambase.add(0x14).readFloat();
                    const yaw = cambase.add(0x4).readFloat();
                    const pitch = cambase.readFloat() + (+config['esp-pitch-offset'] || 0);
                    getFilteredEntityList(false).forEach(entity => {
                        const x = entity.add(eposOffset['x']).readFloat();
                        const y = entity.add(eposOffset['y']).readFloat();
                        const z = entity.add(eposOffset['z']).readFloat();
                        const number = entity.add(eposOffset['number']).readS32();
                        const list:Point[] = [
                            {x: x + sideSize, y: y + upSize, z: z + sideSize},
                            {x: x - sideSize, y: y + upSize, z: z + sideSize},
                            {x: x - sideSize, y: y + upSize, z: z - sideSize},
                            {x: x + sideSize, y: y + upSize, z: z - sideSize},
                            {x: x + sideSize, y: y + downSize, z: z + sideSize},
                            {x: x - sideSize, y: y + downSize, z: z + sideSize},
                            {x: x - sideSize, y: y + downSize, z: z - sideSize},
                            {x: x + sideSize, y: y + downSize, z: z - sideSize},
                        ].map(vec3 => calcESP(vec3, {x: camX, y: camY, z: camZ}, yaw, pitch, camFov)).filter(point => point);
                        const minX = Math.min(...list.map(point => point.x)), maxX = Math.max(...list.map(point => point.x));
                        const minY = Math.min(...list.map(point => point.y)), maxY = Math.max(...list.map(point => point.y));
                        if(minX < 0 && maxX > 0 && minY < 0 && maxY > 0){
                            if(excepts.includes(number)){
                                excepts = excepts.filter(n => n !== number);
                            } else {
                                excepts.push(number);
                            }
                            send(['except-number', excepts]);
                        }
                    });
                    macros.forEach(macro => {
                        if(keybinds[macro.id]){
                            if(key === keybinds[macro.id] && action === 'DOWN'){
                                executeMacro(macro.events);
                            }
                        }
                    });
                }
                if(key === keybinds['infinite-jump'] && action === 'DOWN' && cheats['infinite-jump']){
                    if(!epos) return recv(api);
                    if(epos.isNull()) return recv(api);
                    const y = epos.add(eposOffset['y']).readFloat();
                    epos.add(eposOffset['state']).writeS32(isWalking(epos) ? 33 : 32);
                    epos.add(eposOffset['dy']).writeFloat(-0.01);
                    epos.add(eposOffset['fall']).writeS8(0);
                    epos.add(eposOffset['y']).writeFloat(y + 0.1);
                }
            } else if(name === 'reverse'){
                reverse();
            } else if(name === 'pos'){
                pos(args[0]);
            } else if(name === 'skillcode'){
                skillcode(+args[0]);
            } else if(name === 'change-ads-reward'){
                if(!an) return recv(api);
                if(an.isNull()) return recv(api);
                const cashBase = an.add(anOffset['cash-base']);
                cashBase.add(0x58).writeS32(19);
            } else if(name === 'ctm-default-milk'){ ctmDefaultMilk();
            } else if(name === 'ctm-default-choco'){ ctmDefaultChoco();
            } else if(name === 'ctm-desert-milk'){ ctmDesertMilk();
            } else if(name === 'ctm-desert-choco'){ ctmDesertChoco();
            } else if(name === 'ctm-castle-milk'){ ctmCastleMilk();
            } else if(name === 'ctm-castle-choco'){ ctmCastleChoco();
            } else if(name === 'ctm-mountain-milk'){ ctmMountainMilk();
            } else if(name === 'ctm-mountain-choco'){ ctmMountainChoco();
            } else if(name === 'scan-epos'){
                epos = scanEpos();
            } else if(name === 'scan-entity'){
                if(!epos) return recv(api);
                if(epos.isNull()) return recv(api);
                entityList = scanEntityList(epos);
            } else if(name === 'clear-all'){
                clearAll();
            } else if(name === 'except-number'){
                excepts = args[0];
            } else if(name === 'get-ranges'){
                const r = Process.getRangeByAddress(ptr(args[0]));
                log(r)
            } else if(name === 'find-ranges'){
                const r = Process.findRangeByAddress(ptr(args[0]));
                const f = Process.enumerateRanges('rw-').find(range => range.base.equals(ptr(args[0])))
                const c = !r.file && r.size >= 0x20_0000 && r.size % 0x10_0000 == 0
                log(r, f, c)
            } else if(name === 'search-pattern'){
                if(jit && !jit.isNull()){
                    log("[JIT] scanning pattern in jit ranges:", args[0], jit.toString(), jtRange)
                    Memory.scan(jit, jtRange, args[0], {
                        onMatch: (addr, sz) => {
                            log("[JIT] pattern found:", addr.toString(), sz)
                        },
                        onComplete: () => {
                            log("[JIT] scan complete")
                        }
                    })
                }
            } else if(name === 'gyro'){
                gyro(args[0]);
            } else if(name === 'execute-macro'){
                const macro = macros.find(macro => macro.id === args[0]);
                if(macro) executeMacro(macro.events);
            }
        } catch(e){
            log("[ERROR]", e);
        }
        recv(api)
    }
    recv(api)
});

function getFilteredEntityList(exceptTeam:boolean):NativePointer[]{
    if(!epos) return [];
    if(epos.isNull()) return [];
    if(!entityList) return [];
    if(entityList.length === 0) return [];
    const reversed = config['except-reverse'] || false;
    return entityList
    .filter(entity => !entity.isNull())
    .filter(entity => entity.toString() !== epos.toString())
    .filter(entity => {
        if(exceptTeam){
            const except = excepts.includes(entity.add(eposOffset['number']).readS32())
            return reversed ? except : !except;
        } else {
            return true;
        }
    })
    .filter(entity => 
        entity.add(eposOffset['zr1']).readS32() === 0
        && entity.add(eposOffset['zr2']).readS32() === 0
    )
}

let lastEpos = false;
let assistSpeed = 0;
let lastTime = Date.now();

function loop(){
    const delta = Date.now() - lastTime;
    lastTime = Date.now();
    if(!an || !xa) return setTimeout(loop, 1000/(config['frame'] || 60));
    // Pin values
    try{
        const eposPointer = epos;
        if(eposPointer && !eposPointer.isNull()){
            if(!lastEpos){
                lastEpos = true;
                entityList = scanEntityList(eposPointer);
            }
            const x = eposPointer.add(eposOffset['x']).readFloat();
            const y = eposPointer.add(eposOffset['y']).readFloat();
            const z = eposPointer.add(eposOffset['z']).readFloat();
            send(['pos', [x, y, z]])
            const sk = eposPointer.add(eposOffset['sk']).readS8();
            send(['skillcode', sk])
            if(cheats['aimbot']){
                if(!keybinds['aimbot'] || keymap[keybinds['aimbot']]){
                    aimbot(eposPointer, delta);
                }
            }
            if(cheats['aim-assist']){
                if(isShooting(eposPointer)){
                    const _aimAssistSpeed = config['aim-assist-speed'] || 20;
                    assistSpeed = _aimAssistSpeed;
                } else if(assistSpeed > 0.001) {
                    assistSpeed -= assistSpeed * (config['aim-assist-decay'] || 0.1);
                    if(assistSpeed <= 0.001) assistSpeed = 0;
                }
                aimassist(eposPointer, delta);
            }
            if(cheats['esp']){
                if(an && !an.isNull() && entityList.length > 0){
                    const entities = getFilteredEntityList(false);
                    const pitchOffset = +config['esp-pitch-offset'] || 0;
                    const cambase = an.add(anOffset['camera-base']);
                    const camX = cambase.add(0xc).readFloat();
                    const camY = cambase.add(0x10).readFloat();
                    const camZ = cambase.add(0x14).readFloat();
                    const yaw = cambase.add(0x4).readFloat();
                    const pitch = cambase.readFloat() + pitchOffset;
                    const data:DrawRect[] = entities.map(entity => {
                        const x = entity.add(eposOffset['x']).readFloat();
                        const y = entity.add(eposOffset['y']).readFloat();
                        const z = entity.add(eposOffset['z']).readFloat();
                        const number = entity.add(eposOffset['number']).readS32();
                        const nickname = entity.add(eposOffset['nickname']).readUtf8String();
                        const hp = entity.add(eposOffset["hp"]).readS16();
                        const barrier = entity.add(eposOffset["barrier"]).readS16();
                        const char:number = entity.add(eposOffset["sk"]).readU8();
                        const health = charHealth[char-1] || {hp: 200, barrier:0};
                        const total = health.hp + health.barrier;
                        const upside = [
                            {x: x + sideSize, y: y + upSize, z: z + sideSize},
                            {x: x - sideSize, y: y + upSize, z: z + sideSize},
                            {x: x - sideSize, y: y + upSize, z: z - sideSize},
                            {x: x + sideSize, y: y + upSize, z: z - sideSize},
                        ].map(vec3 => calcESP(vec3, {x: camX, y: camY, z: camZ}, yaw, pitch, camFov)).filter(point => point);
                        const downside = [
                            {x: x + sideSize, y: y + downSize, z: z + sideSize},
                            {x: x - sideSize, y: y + downSize, z: z + sideSize},
                            {x: x - sideSize, y: y + downSize, z: z - sideSize},
                            {x: x + sideSize, y: y + downSize, z: z - sideSize},
                        ].map(vec3 => calcESP(vec3, {x: camX, y: camY, z: camZ}, yaw, pitch, camFov)).filter(point => point);
                        const isTeam = excepts.includes(number);
                        const _isDead = isDead(entity);
                        return {
                            upside, downside, number, nickname, isTeam, isDead: _isDead,
                            hp, barrier, total
                        };
                    }).filter(rect => rect.upside.length > 3 && rect.downside.length > 3);
                    send(['esp', data]);
                }
            }
            if(cheats['blackhole']){
                if(!keybinds['blackhole'] || keymap[keybinds['blackhole']]){
                    blackhole(eposPointer);
                }
            }
            if(cheats['shoot-speed']){
                if(!keybinds['shoot-speed'] || keymap[keybinds['shoot-speed']]){
                    eposPointer.add(eposOffset['w1c']).writeFloat(0);
                    eposPointer.add(eposOffset['w2c']).writeFloat(0);
                }
            }
            if(cheats['no-reload']){
                eposPointer.add(eposOffset['timer']).writeFloat(9999);
            }
            if(cheats['move-speed']){
                if((!keybinds['move-speed'] || keymap[keybinds['move-speed']])){
                    const half:number = Math.sin(45/180*Math.PI)
                    const val:number = (+config['move-speed-value']) || 3;
                    if(keymap["W"] && keymap["A"]) eposPointer.add(eposOffset['dx']).writeFloat(half*val), eposPointer.add(eposOffset['dz']).writeFloat(half*val);
                    else if(keymap["W"] && keymap["D"]) eposPointer.add(eposOffset['dx']).writeFloat(half*val), eposPointer.add(eposOffset['dz']).writeFloat(-half*val);
                    else if(keymap["S"] && keymap["A"]) eposPointer.add(eposOffset['dx']).writeFloat(-half*val), eposPointer.add(eposOffset['dz']).writeFloat(half*val);
                    else if(keymap["S"] && keymap["D"]) eposPointer.add(eposOffset['dx']).writeFloat(-half*val), eposPointer.add(eposOffset['dz']).writeFloat(-half*val);
                    else if(keymap["W"]) eposPointer.add(eposOffset['dx']).writeFloat(val);
                    else if(keymap["S"]) eposPointer.add(eposOffset['dx']).writeFloat(-val);
                    else if(keymap["A"]) eposPointer.add(eposOffset['dz']).writeFloat(val);
                    else if(keymap["D"]) eposPointer.add(eposOffset['dz']).writeFloat(-val);
                    else {
                        eposPointer.add(eposOffset['dx']).writeFloat(0);
                        eposPointer.add(eposOffset['dz']).writeFloat(0);
                    }
                }
            }
            if(cheats['fly']){
                eposPointer.add(eposOffset['dy']).writeFloat(-.1);
                eposPointer.add(eposOffset['fall']).writeS8(0);
                const y = eposPointer.add(eposOffset['y']).readFloat();
                if(keybinds['fly-up'] && keymap[keybinds['fly-up']]) eposPointer.add(eposOffset['y']).writeFloat(y + (config['fly-speed'] || 1));
                if(keybinds['fly-down'] && keymap[keybinds['fly-down']]) eposPointer.add(eposOffset['y']).writeFloat(y - (config['fly-speed'] || 1));
            }
            if(cheats['upskill'] && (!keybinds['upskill'] || keymap[keybinds['upskill']])){
                const hp = eposPointer.add(eposOffset['hp']).readS16();
                eposPointer.add(eposOffset['hp']).writeS16(hp + 1);
                const exceptTimer = config['upskill-except-timer'] || false;
                eposPointer.add(eposOffset['sc']).writeFloat(+config['upskill-value'] || 0);
                if(!exceptTimer) eposPointer.add(eposOffset['timer']).writeFloat(+config['upskill-value'] || 0);
            }
            if(cheats['grenade'] && (!keybinds['grenade'] || keymap[keybinds['grenade']])){
                an.add(anOffset['grenade-base']).writeS8(1);
                eposPointer.add(eposOffset['gc']).writeFloat(0);
            }
            if(cheats['hide-me']){
                eposPointer.add(eposOffset['oy']).writeFloat(100);
            } else {
                eposPointer.add(eposOffset['oy']).writeFloat(0);
            }
        } else {
            lastEpos = false;
            clearAll();
        }
        if(cheats['skill-cooldown']){
            an.add(anOffset['skill-base']).writeS8(1);
        }
    } catch(e){
        log(e);
    }
    setTimeout(loop, 1000/(config['frame'] || 60));
}
lastTime = Date.now();
loop();

function scanEpos():NativePointer{
    if(!an) return null;
    if(an.isNull()) return null;
    if(an.add(anOffset['position-base']).isNull()) {
        send(['epos-state', 'error', 'Base Not Found']);
        return null;
    }
    send(['epos-state', 'pending', 'Scanning']);
    const _arr = an.add(anOffset['position-base']).readByteArray(0xC);
    const _pattern = bufferToHex(_arr);
    cas = Process.enumerateRanges('rw-').filter(range =>
        !range.file &&
        range.size >= 0x20_0000 &&
        range.size < 0x1000_0000 &&
        range.size % 0x10_0000 == 0 &&
        range.base.toString().length > 10
    );
    for(let range of cas){
        const eposes = Memory.scanSync(range.base, range.size, _pattern);
        if(eposes.length > 0){
            const _epos = eposes.find(np => np.address.toString().match(/190$/));
            if(_epos){
                const _pointer = _epos.address.add(-0x190);
                log("Epos Found:", _pointer.toString())
                send(['epos-state', 'succeed', _pointer.toString().toUpperCase()]);
                return _pointer;
            }
        }
    }
    send(['epos-state', 'error', 'Not Found']);
    return null;
}

function scanEntityList(_eposPointer:NativePointer):NativePointer[]{
    if(!_eposPointer) return [];
    if(_eposPointer.isNull()) return [];
    if(_eposPointer.add(eposOffset['pointer']).isNull()) return [];
    let _entityList:NativePointer[] = [];
    const _pattern = bufferToHex(_eposPointer.add(eposOffset['pointer']).readByteArray(0x8));
    send(['entity-state', 'pending', 'Scanning']);
    cas.forEach(range => {
        try{
            const entities = Memory.scanSync(range.base, range.size, _pattern)
            .filter(entity => !entity.address.isNull())
            _entityList = [..._entityList, ...entities.map(entity => entity.address.add(-eposOffset['pointer']))];
        } catch(e){
            log(e);
        }
    });
    try{
        _entityList = _entityList.filter(entity => entity.toString().match(/000$/))
    } catch(e){
        send(['entity-state', 'error', 'Error filtering']);
    }
    try{
        log("Entity Found:", _entityList.length, '\n',
            _entityList.map(entity => `${entity.toString()} [${entity.add(eposOffset['number']).readS32()}] ${entity.add(eposOffset['nickname']).readUtf8String()}`).join('\n')
        );
    } catch(e){
        send(['entity-state', 'error', 'Error logging']);
    }
    send(['entity-state', 'succeed', `Found: ${_entityList.length}`]);
    return _entityList || [];
}

function clearAll(){
    epos = null;
    entityList = [];
    send(['clear-all']);
    assistSpeed = 0;
}

function reverse(){
    // if(!cd) return;
    const eposPointer = epos;
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    const x = eposPointer.add(eposOffset['x']).readFloat();
    const z = eposPointer.add(eposOffset['z']).readFloat();
    eposPointer.add(eposOffset['x']).writeFloat(-x);
    eposPointer.add(eposOffset['z']).writeFloat(-z);
}

function pos(nums:number[]){
    // if(!cd) return;
    const eposPointer = epos;
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    eposPointer.add(eposOffset['x']).writeFloat(nums[0]);
    eposPointer.add(eposOffset['y']).writeFloat(nums[1]);
    eposPointer.add(eposOffset['z']).writeFloat(nums[2]);
}

function skillcode(num:number){
    // if(!cd) return;
    const eposPointer = epos;
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    eposPointer.add(eposOffset['sk']).writeS8(num);
}

function aimbot(eposPointer:NativePointer, delta:number){
    if(!an) return;
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    if(config['aimbot-main-weapon-only'] && eposPointer.add(eposOffset["weapon"]).readS16() == 1) return;
    const cambase = an.add(anOffset['camera-base']);
    const mode = config['aimbot-mode'] || 'normal';
    const speed = (config['aimbot-speed'] || 20) * (delta/10);
    const angle = config['aimbot-angle'] || 10;
    const ignoreTeam = config['aimbot-ignore'] || false;
    const ignoreDead = config['aimbot-ignore-dead'] || false;
    const pitchOffset = +config['aimbot-pitch-offset'] || 0;
    const rad = angle/180*Math.PI;
    const camX = cambase.add(0xc).readFloat();
    const camY = cambase.add(0x10).readFloat();
    const camZ = cambase.add(0x14).readFloat();
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat() + pitchOffset;
    const targets = getFilteredEntityList(ignoreTeam)
    .filter(entity => ignoreDead ? !isDead(entity) : true)
    .map((entity:NativePointer) => {
        let dx = entity.add(eposOffset["x"]).readFloat() - camX;
        let dy = entity.add(eposOffset["y"]).readFloat()+4.7 - camY;
        let dz = entity.add(eposOffset["z"]).readFloat() - camZ;
        if(config["aimbot-acceleration"]){
            dx += entity.add(eposOffset["dx"]).readFloat();
            if(!isGround(entity)) dy -= entity.add(eposOffset["dy"]).readFloat();
            dz += entity.add(eposOffset["dz"]).readFloat();
            dx -= eposPointer.add(eposOffset["dx"]).readFloat();
            if(!isGround(eposPointer)) dy += eposPointer.add(eposOffset["dy"]).readFloat();
            dz -= eposPointer.add(eposOffset["dz"]).readFloat();
        }
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
            cambase.add(0x4).writeFloat(target[0]);
            cambase.writeFloat(target[1] - pitchOffset);
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
            cambase.add(0x4).writeFloat(nyaw);
            cambase.writeFloat(npitch - pitchOffset);
        }
    }
}

function aimassist(eposPointer:NativePointer, delta:number){
    if(!an) return;
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    const cambase = an.add(anOffset['camera-base']);
    const angle = config['aim-assist-angle'] || 10;
    const ignoreTeam = config['aim-assist-ignore'] || false;
    const ignoreDead = config['aim-assist-ignore-dead'] || false;
    const pitchOffset = +config['aim-assist-pitch-offset'] || 0;
    const rad = angle/180*Math.PI;
    const camX = cambase.add(0xc).readFloat();
    const camY = cambase.add(0x10).readFloat();
    const camZ = cambase.add(0x14).readFloat();
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat() + pitchOffset;
    const targets = getFilteredEntityList(ignoreTeam)
    .filter(entity => ignoreDead ? !isDead(entity) : true)
    .map((entity:NativePointer) => {
        const dx = entity.add(eposOffset["x"]).readFloat() - camX;
        const dy = entity.add(eposOffset["y"]).readFloat()+4.7 - camY;
        const dz = entity.add(eposOffset["z"]).readFloat() - camZ;
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
        const radyaw = target[2] > 0 ? rad : -rad;
        const radpitch = target[3] > 0 ? rad : -rad;
        const ry = target[2] > 0 ? Math.max(radyaw, target[2]) : Math.min(radyaw, target[2]);
        const rp = target[3] > 0 ? Math.max(radpitch, target[3]) : Math.min(radpitch, target[3]);
        const ry2 = ry - target[2];
        const rp2 = rp - target[3];
        const ry3 = target[2] > 0 ? Math.min(target[2], ry2) : Math.max(target[2], ry2);
        const rp3 = target[3] > 0 ? Math.min(target[3], rp2) : Math.max(target[3], rp2);
        const nyaw = yaw - ry3 * (assistSpeed/100 * (delta/10));
        const npitch = pitch - rp3 * (assistSpeed/100 * (delta/10));
        cambase.add(0x4).writeFloat(nyaw);
        cambase.writeFloat(npitch - pitchOffset);
    }
}

function calcESP(vec3:{x:number; y:number; z:number;}, cam3:{x:number; y:number; z:number;}, yaw:number, pitch:number, fov:number[]):Point{
    const camX = cam3.x;
    const camY = cam3.y;
    const camZ = cam3.z;
    const dx = vec3.x - camX;
    const dy = vec3.y - camY;
    const dz = vec3.z - camZ;
    let rotatedX:number = dx * Math.cos(yaw + Math.PI) - dz * Math.sin(yaw + Math.PI);
    let rotatedZ:number = dz * Math.cos(yaw + Math.PI) + dx * Math.sin(yaw + Math.PI);
    let rotatedY:number = - dy * Math.cos(-pitch) + rotatedZ * Math.sin(-pitch);
    rotatedZ = rotatedZ * Math.cos(-pitch) + dy * Math.sin(-pitch);
    if(rotatedZ >= 0) return null;
    return {
        x:-(rotatedX / rotatedZ)*(90/fov[0]),
        y:-(rotatedY / rotatedZ)*(90/fov[1])
    };
}

function blackhole(eposPointer:NativePointer){
    if(!an) return;
    if(eposPointer.isNull()) return;
    const ignoreTeam = config['blackhole-ignore'] || false;
    const ignoreDead = config['blackhole-ignore-dead'] || false;
    const preventLagger = config['blackhole-prevent-lagger'] || false;
    const forceDrop = config['blackhole-force-drop'] || false;
    const target = config['blackhole-target'] || 'crosshair';
    let resX:number, resY:number, resZ:number;
    if(target === 'crosshair'){
    const cambase = an.add(anOffset['camera-base']);
    const camX = cambase.add(0xc).readFloat();
    const camY = cambase.add(0x10).readFloat();
    const camZ = cambase.add(0x14).readFloat();
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat();
    const camDist = - cambase.add(0x24).readFloat();
    const dist = camDist + (+config['blackhole-distance'] || 20);
    resX = camX + Math.sin(yaw) * dist;
    resY = camY + Math.sin(pitch) * dist;
    resZ = camZ + Math.cos(yaw) * dist;
    } else if(target === 'position'){
        resX = +config['blackhole-x'] || 0;
        resY = +config['blackhole-y'] || 0;
        resZ = +config['blackhole-z'] || 0;
    }
    getFilteredEntityList(ignoreTeam)
    .filter(entity => ignoreDead ? !isDead(entity) : true)
    .filter(entity => preventLagger ? entity.add(eposOffset['y']).readFloat() < -64 : true)
    .forEach((entity:NativePointer) => {
        entity.add(eposOffset['x']).writeFloat(resX);
        entity.add(eposOffset['y']).writeFloat(resY - 4.7);
        entity.add(eposOffset['z']).writeFloat(resZ);
        if(forceDrop) {
            entity.add(eposOffset['dx']).writeFloat(1);
            entity.add(eposOffset['dy']).writeFloat(0.1);
            entity.add(eposOffset['dz']).writeFloat(1);
            if(!isDead(entity)) entity.add(eposOffset['state']).writeS32(1);
        } else {
            entity.add(eposOffset['dx']).writeFloat(0);
            entity.add(eposOffset['dy']).writeFloat(0);
            entity.add(eposOffset['dz']).writeFloat(0);
        }
    });
}

function isShooting(eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    const state = eposPointer.add(eposOffset['state']).readS32();
    return state === 8 || state === 9 || state === 10 || state === 11;
}

function isGround(eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    const state = eposPointer.add(eposOffset['state']).readS32();
    return state % 4 >= 2;
}

function isWalking(eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    const state = eposPointer.add(eposOffset['state']).readS32();
    return state % 2 === 1;
}

function isDead(eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    return eposPointer.add(eposOffset['hp']).readS16() <= 0 || eposPointer.add(eposOffset['state']).readS32() === 16;
}

function gyro(data:{
    alpha:number;
    beta:number;
    gamma:number;
}){
    if(!an) return;
    if(an.isNull()) return;
    const cambase = an.add(anOffset['camera-base']);
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat();
    const sensitivity = (config['gyro-scope-sensitivity'] || 10) / 180 * Math.PI;
    const alpha = data.alpha * sensitivity;
    const beta = data.beta * sensitivity;
    const gamma = data.gamma * sensitivity;
    const pitchAdd = (config['gyro-scope-use-gamma'] ? gamma : beta) * (config['gyro-scope-invert'] ? -1 : 1);
    cambase.add(0x4).writeFloat(yaw + alpha);
    cambase.writeFloat(pitch + pitchAdd);
}

function executeMacro(events:MacroEvent[]){
    if(!xa) return;
    if(xa.isNull()) return;
    if(!an) return;
    if(an.isNull()) return;
    if(!epos) return;
    if(epos.isNull()) return;
    events.forEach(event => {
        if(event.base === "epos"){
            const offset = eposOffset[event.offset as keyof typeof eposOffset];
            const value = event.value;
            const type = event.type;
            const apply = (base:NativePointer) => {
                if(type === "byte"){
                    base.add(offset).writeS8(value);
                } else if(type === "int16"){
                    base.add(offset).writeU16(value);
                } else if(type === "int32"){
                    base.add(offset).writeU32(value);
                } else if(type === "float"){
                    base.add(offset).writeFloat(value);
                }
            }
            if(event.target === "self"){
                const base = epos;
                apply(base);
            } else if(event.target === "all"){
                const entities = getFilteredEntityList(false);
                if(entities.length > 0){
                    if(event.index !== undefined){
                        apply(entities[event.index]);
                    } else {
                        entities.forEach(entity => {
                            apply(entity);
                        });
                    }
                }
            } else if(event.target === "enemy"){
                const entities = getFilteredEntityList(true);
                if(entities.length > 0){
                    if(event.index !== undefined){
                        apply(entities[event.index]);
                    } else {
                        entities.forEach(entity => {
                            apply(entity);
                        });
                    }
                }
            }
        } else {
            const base = event.base === "xa" ? xa : an;
            const offset = event.base === "xa" ? xaOffset[event.offset as keyof typeof xaOffset] : anOffset[event.offset as keyof typeof anOffset];
            const value = event.value;
            const type = event.type;
            if(type === "byte"){
                base.add(offset).writeS8(value);
            } else if(type === "int16"){
                base.add(offset).writeU16(value);
            } else if(type === "int32"){
                base.add(offset).writeU32(value);
            } else if(type === "float"){
                base.add(offset).writeFloat(value);
            }
        }
    });
}

async function sleep(ms:number){
    return await new Promise(resolve => setTimeout(resolve, ms));
}

async function teleport(eposPointer:NativePointer, x:number, y:number, z:number){
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    eposPointer.add(eposOffset['x']).writeFloat(x);
    eposPointer.add(eposOffset['y']).writeFloat(y);
    eposPointer.add(eposOffset['z']).writeFloat(z);
    await sleep(170);
}

async function ctmDefaultMilk(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, -255, 48.22, 0);
    await teleport(epos, 262, 48.22, -44);
    await home();
    await teleport(epos, 262, 48.22, -72);
    await home();
    await teleport(epos, 262, 48.22, 44);
    await home();
    await teleport(epos, 262, 48.22, 72);
    await home();
}

async function ctmDefaultChoco(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, 255, 48.22, 0);
    await teleport(epos, -262, 48.22, -44);
    await home();
    await teleport(epos, -262, 48.22, -72);
    await home();
    await teleport(epos, -262, 48.22, 44);
    await home();
    await teleport(epos, -262, 48.22, 72);
    await home();
}

async function ctmDesertMilk(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, -200, 38.4, 128);
    await teleport(epos, 209, 38.4, -112);
    await home();
    await teleport(epos, 209, 38.4, -144);
    await home();
    await teleport(epos, 175, 38.4, -112);
    await home();
    await teleport(epos, 175, 38.4, -144);
    await home();
}

async function ctmDesertChoco(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, 200, 38.4, -128);
    await teleport(epos, -209, 38.4, 112);
    await home();
    await teleport(epos, -209, 38.4, 144);
    await home();
    await teleport(epos, -175, 38.4, 112);
    await home();
    await teleport(epos, -175, 38.4, 144);
    await home();
}

async function ctmCastleMilk(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, -250, 54.4, 0);
    await teleport(epos, 242, 19.2, -37);
    await home();
    await teleport(epos, 242, 19.2, -60);
    await home();
    await teleport(epos, 242, 19.2, 37);
    await home();
    await teleport(epos, 242, 19.2, 60);
    await home();
}

async function ctmCastleChoco(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, 250, 54.4, 0);
    await teleport(epos, -242, 19.2, -37);
    await home();
    await teleport(epos, -242, 19.2, -60);
    await home();
    await teleport(epos, -242, 19.2, 37);
    await home();
    await teleport(epos, -242, 19.2, 60);
    await home();
}

async function ctmMountainMilk(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, -170, 0, -124);
    await teleport(epos, 162, 0, 142);
    await home();
    await teleport(epos, 162, 0, 158);
    await home();
    await teleport(epos, 162, 0, 106);
    await home();
    await teleport(epos, 162, 0, 90);
    await home();
}

async function ctmMountainChoco(){
    if(!epos) return;
    if(epos.isNull()) return;
    epos.add(eposOffset['state']).writeS32(1);
    const home = async () => await teleport(epos, 170, 0, 124);
    await teleport(epos, -162, 0, -142);
    await home();
    await teleport(epos, -162, 0, -158);
    await home();
    await teleport(epos, -162, 0, -106);
    await home();
    await teleport(epos, -162, 0, -90);
    await home();
}

rpc.exports = {
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
    }
}

function getChainedPointer(_bs:NativePointer, iter:number[]):NativePointer{
    let pt = _bs;
    for(let offset of iter){
        pt = pt.add(offset);
        pt = pt.readPointer();
        if(pt.isNull()) return null;
    }
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
function bufferToHex(buffer: ArrayBuffer): string {
    const byteArray = new Uint8Array(buffer)
    const str:string[] = []
    byteArray.forEach(byte => {
        str.push(byte.toString(16).padStart(2, '0'))
    })
    return str.join(' ')
}
function qwordToHex(qword: Int64): string {
    const x = qword.toString(16)
    return x.match(/.{2}/g).reverse().join(' ')
}
function forceWriteS32(_ptr:NativePointer, value:number){
    Memory.protect(_ptr, Process.pageSize, 'rwx');
    _ptr.writeS32(value);
    Memory.protect(_ptr, Process.pageSize, isArm ? 'r-x' : 'r--');
}
function forceWriteFloat(_ptr:NativePointer, value:number){
    Memory.protect(_ptr, Process.pageSize, 'rwx');
    _ptr.writeFloat(value);
    Memory.protect(_ptr, Process.pageSize, isArm ? 'r-x' : 'r--');
}