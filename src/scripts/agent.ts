"cut";
const xaOffset = /*xaOffset*/;
const anOffset = /*anOffset*/;
const eposOffset = /*eposOffset*/;

// 0 = ground stop
// 1 = ground walk
// 2 = air stop
// 3 = air walk
// 8 = shoot stop
// 9 = shoot walk
// 10 = shoot air stop
// 11 = shoot air walk
// 128 = grenade stop
// 129 = grenade walk
// 130 = grenade air stop
// 131 = grenade air walk
// 64 = reload
// 65 = reload walk
// 66 = reload air stop
// 67 = reload air walk
// 32 = jump
// 33 = jump walk
// 16 = death
// 256 = skill stop
// 257 = skill walk
// 258 = skill air stop
// 259 = skill air walk

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
let _libMyGame:Module | null = null;
let xa:NativePointer = null;
let an:NativePointer = null;
let cd:NativePointer = null;
let jit:NativePointer = null;
let jtRange:number = null;
let cas:RangeDetails[] = [];
let cambase:NativePointer = null;
let epos:NativePointer = null;
let entityList:Set<string> = new Set();
let excns:number[] = [];
let excepts:number[] = [];

let cheats:{[key:string]:boolean} = {};
let keybinds:{[key:string]:string} = {};
let config:{[key:string]:any} = {};
let keymap:{[key:string]:boolean} = {};
let macros:Macro[] = [];

let listenSub: boolean = false;
let listenMain: boolean = false;

// let activeTouches: Record<string, any> = {}
// let InputManager:any = null;

let setYaw: any = null;
let setPitch: any = null;
let endgame: any = null;
let setDia: any = null;
let setGold: any = null;
let setXp: any = null;
let setClanXp: any = null;
let setSLCoin: any = null;
let setSLPoint: any = null;
let unlockSLMedal: any = null;
let unlockChar: any = null;
let purchaseP: any = null;
let purchaseT: any = null;
let changeNickname: any = null;
let exploitServer: any = null;

const log = (...args:any[]) => send(['log', ...args]);

const loadModule = setInterval(() => {
    if(Module.getBaseAddress('libMyGame.so')) {
        _libMyGame = Process.findModuleByName('libMyGame.so');
        send(['Address.init', _libMyGame ? _libMyGame.base.toString() : 'null']);
        init();
        loop();
        clearInterval(loadModule);
    }
}, 500);
// Java.perform(() => {
    // let Activity = Java.use("android.app.Activity");
    // let MotionEvent = Java.use("android.view.MotionEvent");
    // Activity.dispatchTouchEvent.overload('android.view.MotionEvent').implementation = function(event: Java.Wrapper) {
    //     var actionMasked = event.getActionMasked();
    //     var pointerIndex = event.getActionIndex();
    //     var pointerId = event.getPointerId(pointerIndex);
    //     if (actionMasked === MotionEvent.ACTION_DOWN.value || actionMasked === MotionEvent.ACTION_POINTER_DOWN.value) {
    //         var x = event.getX(pointerIndex);
    //         var y = event.getY(pointerIndex);
    //         activeTouches[pointerId] = { x: x, y: y };
    //     }
    //     else if (actionMasked === MotionEvent.ACTION_MOVE.value) {
    //         var pointerCount = event.getPointerCount();
    //         for (var i = 0; i < pointerCount; i++) {
    //             var id = event.getPointerId(i);
    //             var x = event.getX(i);
    //             var y = event.getY(i);
    //             if (activeTouches[id]) {
    //                 activeTouches[id].x = x;
    //                 activeTouches[id].y = y;
    //             }
    //         }
    //     }
    //     else if (actionMasked === MotionEvent.ACTION_UP.value || actionMasked === MotionEvent.ACTION_POINTER_UP.value || actionMasked === MotionEvent.ACTION_CANCEL.value) {
    //         if (activeTouches.hasOwnProperty(pointerId)) {
    //             delete activeTouches[pointerId];
    //         }
    //     }
    //     var x = event.getX();
    //     var y = event.getY();
    //     if(listenSub){
    //         config['autoswap-subweapon-x'] = x;
    //         config['autoswap-subweapon-y'] = y;
    //         listenSub = false;
    //         send(['listen-sub', [x, y]]);
    //     }
    //     if(listenMain){
    //         config['autoswap-mainweapon-x'] = x;
    //         config['autoswap-mainweapon-y'] = y;
    //         listenMain = false;
    //         send(['listen-main', [x, y]]);
    //     }
    //     return this.dispatchTouchEvent(event);
    // };
    // const inp = Java.use("android.hardware.input.InputManager")
    // InputManager = inp.getInstance();
// });

function getFilteredEntityList(exceptMark:boolean):NativePointer[]{
    if(!epos) return [];
    if(epos.isNull()) return [];
    if(!entityList) return [];
    if(entityList.size === 0) return [];
    const reversed = config['except-reverse'] || false;
    return [...entityList].map(pt => ptr(pt))
    .filter(entity => entity.toString() !== '0x0')
    .filter(entity => !entity.isNull())
    .filter(entity => 
        entity.add(eposOffset['zr1']).readS32() === 0
        && entity.add(eposOffset['zr2']).readS32() === 0
        && entity.add(eposOffset["nickname"]).readCString() !== ""
    )
    .filter(entity => entity.toString() !== epos.toString())
    .filter(entity => !excns.includes(entity.add(eposOffset['number']).readS32()))
    .filter(entity => {
        if(exceptMark){
            const except = excepts.includes(entity.add(eposOffset['number']).readS32())
            return reversed ? except : !except;
        } else {
            return true;
        }
    })
}

let lastEpos = false;
let assistSpeed = 0;
let lastTime = Date.now();
let shooting = false;
function makeNFunc(symbol: string, retType: any, argTypes: any[]): any {
    return new NativeFunction(Module.findExportByName('libMyGame.so', symbol), retType, argTypes);
}
function attachNFunc(symbol: string, callbacksOrProbe: InvocationListenerCallbacks | InstructionProbeCallback): void {
    Interceptor.attach(Module.findExportByName('libMyGame.so', symbol), callbacksOrProbe)
}
function init(){
    let item = makeNFunc('_ZN16SystemPacketSend7BuyItemEhhhh', 'void', ['uchar', 'uchar', 'uchar', 'uchar']);
    try {
        attachNFunc('_ZN16SystemPacketSend12RequestLoginEiRKSsS1_', {
            onEnter(args) {
            },
        })
        setYaw = makeNFunc('_ZN5Cloud10CameraData15SetCameraAngleXEf', 'void', ['float']);
        setPitch = makeNFunc('_ZN5Cloud10CameraData15SetCameraAngleYEf', 'void', ['float']);
        endgame = makeNFunc('_ZN16SystemPacketSend17CheatForceEndGameENS_16ForceEndGameTypeE', 'void', ['pointer']);
        setDia = (amount: number) => makeNFunc('_ZN16SystemPacketSend13CheatSetMoneyEii', 'void', ['int', 'int'])(amount, 0);
        setGold = (amount: number) => makeNFunc('_ZN16SystemPacketSend12CheatSetGoldEii', 'void', ['int', 'int'])(amount, 0);
        setXp = (amount: number) => makeNFunc('_ZN16SystemPacketSend21CheatSetGradeAndPointEhj', 'void', ['uchar', 'uint'])(1, amount);
        setClanXp = makeNFunc('_ZN16SystemPacketSend15CheatSetClanExpEj', 'void', ['uint']);
        setSLCoin = makeNFunc('_ZN16SystemPacketSend22CheatSetStarLeagueCoinEj', 'void', ['uint']);
        setSLPoint = makeNFunc('_ZN16SystemPacketSend23CheatSetStarLeaguePointEt', 'void', ['uint16']);
        unlockSLMedal = () => {
            for(let i = 1; i <= 12; i++){
                makeNFunc('_ZN16SystemPacketSend23CheatGetStarLeagueMedalEhm', 'void', ['uchar', 'ulong'])(i, 4);
            }
        }
        unlockChar = (charId: number) => {
            for(let i = 1; i <= 255; i++){item(charId, 0, i, 1)}
            for(let i = 1; i <= 255; i++){item(charId, 1, i, 1)}
            for(let i = 1; i <= 255; i++){item(charId, 2, i, 1)}
            for(let i = 1; i <= 255; i++){item(charId, 3, i, 1)}
            for(let i = 1; i <= 255; i++){item(charId, 4, i, 1)}
            for(let i = 1; i <= 127; i++){item(charId, 6, i, 1)}
            for(let i = 1; i <= 127; i++){item(charId, 7, i, 1)}
        };
        purchaseP = makeNFunc('_ZN16SystemPacketSend16SendPurchasePassEjh', 'void', ['uint', 'uchar']);
        purchaseT = makeNFunc('_ZN16SystemPacketSend20SendPurchasePassTierEjh', 'void', ['uint', 'uchar']);
        changeNickname = (name:string) => {
            const sp = Memory.allocUtf8String(name);
            makeNFunc('_ZN16SystemPacketSend14ChangeNicknameEhPKch', 'void', ["uchar", "pointer", "uchar"])(1, sp, 0);
        }
        exploitServer = () => {
            makeNFunc('_ZN16SystemPacketSend17SendReqPassRewardEjjhhh', 'void', ['uint', 'uint', 'uchar', 'uchar', 'uchar'])(1, 100, 1, 1, 1);
        }
        attachNFunc('_ZN5Cloud10CameraData24GetCameraUserInformationEv', {
            onLeave(retval) {
                if(config['epos-number'] && config['epos-number'] != '0'){
                    let ts = ptr(retval.toString());
                    if(ts && !ts.isNull()){
                        if(ts.readS32() === +config['epos-number']){
                            epos = ts;
                        } else epos = null;
                    } else epos = null;
                }
            },
        });
        attachNFunc('_ZN15UserInfoManager16GetUserByUserSeqEj', {
            onLeave(retval) {
                if(epos && !epos.isNull()){
                    let ts = ptr(retval.toString());
                    if(ts && !ts.isNull()){
                        if(ts.toString() === epos.toString()){
                            if(cheats['skill-cooldown']){
                                makeNFunc('_ZN16SystemPacketSend33CheatSetAllSkillCoolTimeOneSecondEb', 'void', ['bool'])(1);
                            }
                        } else {
                            entityList.add(ts.toString());
                            entityList.forEach(p => {
                                try{
                                    const pt = ptr(p);
                                    const myslot = epos.add(eposOffset['slot']).readU8() % 2;
                                    if(cheats['kick-all']) {
                                        let n = pt.readS32()
                                        let slot = pt.add(eposOffset['slot']).readU8() % 2
                                        if(n > 0 && myslot != slot && !excs.includes(n)){
                                            purchaseT(n, 0);
                                        }
                                    }
                                    const n = pt.add(eposOffset['nickname']).readCString();
                                    const zr1 = pt.add(eposOffset['zr1']).readFloat();
                                    const zr2 = pt.add(eposOffset['zr2']).readFloat();
                                    if(zr1 !== 0 || zr2 !== 0 || n === "") entityList.delete(p);
                                } catch (e){
                                    entityList.delete(p)
                                }
                            })
                        }
                    }
                }
            },
        });
        attachNFunc('_ZN5Cloud10CameraData15GetCameraAngleYEv', {
            onLeave(retval) {
                let ts = ptr(retval.toString());
                if(ts && !ts.isNull()){
                    cambase = ts;
                }
            },
        });
        attachNFunc('_ZN5Skill16GetMaxSkillCountEh', {onLeave: retval => {if(cheats['skill-cooldown']) retval.replace(12 as any)}})
        attachNFunc('_ZN5Skill16GetCurSkillCountEv', {onLeave: retval => {if(cheats['skill-cooldown']) retval.replace(12 as any)}})
        attachNFunc('_ZN5Skill16IsSkillManyTimesEh', {onLeave: retval => {if(cheats['skill-cooldown']) retval.replace(1 as any)}})
        attachNFunc('_ZN5Cloud8CharData12GetSkillTimeEv', {onLeave: retval => {if(cheats['skill-cooldown']) retval.writeFloat(1)}})
        const stateLoop = setInterval(() => {
            if(epos && !epos.isNull()) {
                send(['epos-state', 'succeed', epos.toString()]);
            } else {
                send(['epos-state', 'error', 'Epos not found']);
            }
            if(entityList.size > 0) {
                send(['entity-state', 'succeed', `${entityList.size} Found`]);
            } else {
                send(['entity-state', 'error', 'No entities found']);
            }
        }, 500);
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
                // } else if(name === 'addr'){
                    // isArm = Process.arch.includes('arm');
                    // const r = Process.enumerateRanges('r--');
                    // const rw = Process.enumerateRanges('rw-');
                    // const rx = Process.enumerateRanges('r-x');
                    // const rwx = Process.enumerateRanges('rwx');
                    // const _xa = r.filter((range:RangeDetails) =>
                    //     range.file &&
                    //     range.file.path.includes('libMyGame.so')
                    // );
                    // if(_xa[0]) xa = _xa[0].base
                    // else {
                    //     const __xa = rx.filter((range:RangeDetails) =>
                    //         range.file &&
                    //         range.file.path.includes('split_config.arm64_v8a.apk') &&
                    //         range.size >= 0x442_8000
                    //     );
                    //     if(__xa[0]) {
                    //         xa = __xa[0].base;
                    //     }
                    // }
                    // const _an = rw.filter((range:RangeDetails) =>
                    //     (!range.file) &&
                    //     range.size >= (isArm ? 0x1000 : 0x14E_8000)
                    // );
                    // if(_an[0]) an = _an[0].base;
                    // if(isArm) rwx.filter((range:RangeDetails) =>
                    //     range.size >= 0x1_0000
                    // ).forEach((range:RangeDetails) => {
                    //     const dia = range.base.add(anOffset['cash-base']).readS32();
                    //     if(dia === 17){
                    //         log("AN Found:", range.base.toString())
                    //     } else {
                    //         log(range.base.toString(), dia)
                    //     }
                    // });
                    // const _jt = rx.filter(range => range.file && range.file.path.includes("jit"));
                    // if(_jt[0]) {
                    //     jit = _jt[0].base;
                    //     jtRange = _jt[0].size;
                    // }
                    // if(!xa || !an) return recv(api);
                    // if(!isArm && !jit) return recv(api);
                    // send(['Address.init', xa.toString(), an.toString(), jit.toString()])
                    // _libMyGame = Process.findModuleByName('libMyGame.so');
                    // send(['Address.init', _libMyGame ? _libMyGame.base.toString() : 'null']);
                } else if(name === 'cheats'){
                    // if(!an || !xa) return recv(api);
                    if(!_libMyGame) return recv(api);
                    cheats[args[0]] = args[1];
                    // Enable/Disable values
                    switch(args[0]){
                        case 'esp':{
                            if(!args[1]) send(['clear-esp']);
                        }
                        case 'no-recoil':{
                            const _addr = Module.getExportByName('libMyGame.so', xaOffset['no-recoil'].name).add(xaOffset['no-recoil'].offset);
                            forceWriteS32(_addr, args[1] ? 505942016 : -1124072416);
                            break;
                        }
                        case 'no-clip':{
                            const _addr = Module.getExportByName('libMyGame.so', xaOffset['no-clip'].name).add(xaOffset['no-clip'].offset);
                            forceWriteFloat(_addr, args[1] ? 100 : 0.01);
                            break;
                        }
                        case 'no-spread':{
                            const _addr1 = Module.getExportByName('libMyGame.so', xaOffset['no-spread1'].name).add(xaOffset['no-spread1'].offset);
                            forceWriteS32(_addr1, args[1] ? 505942016 : -1119869952);
                            const _addr2 = Module.getExportByName('libMyGame.so', xaOffset['no-spread2'].name).add(xaOffset['no-spread2'].offset);
                            forceWriteS32(_addr2, args[1] ? 505942016 : -1119870976);
                            break;
                        }
                        case 'no-reload':{
                            const _addr = Module.getExportByName('libMyGame.so', xaOffset['no-reload'].name).add(xaOffset['no-reload'].offset);
                            forceWriteS32(_addr, args[1] ? 505925632 : -1136562176);
                            break;
                        }
                        case 'instant-respawn':{
                            const _addr = Module.getExportByName('libMyGame.so', xaOffset['instant-respawn'].name).add(xaOffset['instant-respawn'].offset);
                            forceWriteS32(_addr, args[1] ? 505415680 : 505415712);
                            break;
                        }
                        case 'one-kill':{
                            const _addr1 = Module.getExportByName('libMyGame.so', xaOffset['body-one-kill'].name).add(xaOffset['body-one-kill'].offset);
                            forceWriteS32(_addr1, args[1] ? 505925632 : 506335232);
                            const _addr2 = Module.getExportByName('libMyGame.so', xaOffset['head-one-kill'].name).add(xaOffset['head-one-kill'].offset);
                            forceWriteS32(_addr2, args[1] ? 505925632 : -1136594944);
                            break;
                        }
                        case 'skill-damage':{
                            const _addr = Module.getExportByName('libMyGame.so', xaOffset['skill-damage'].name).add(xaOffset['skill-damage'].offset);
                            forceWriteS32(_addr, args[1] ? 1384184322 : -1203335166);
                            break;
                        }
                        case 'cooker-buff':{
                            const _addr = Module.getExportByName('libMyGame.so', xaOffset['cooker-buff'].name).add(xaOffset['cooker-buff'].offset);
                            forceWriteS32(_addr, args[1] ? 505925632 : 506335232);
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
                    // if(key === keybinds['scan-epos'] && action === 'DOWN') {
                    //     epos = scanEpos();
                    // }
                    // if(key === keybinds['scan-entity'] && action === 'DOWN') {
                    //     entityList = scanEntityList(epos);
                    // }
                    // if(key === keybinds['clear-all'] && action === 'DOWN') clearAll();
                    if(key === keybinds['esp-mark'] && action === 'DOWN'){
                        if(!cambase) return recv(api);
                        if(cambase.isNull()) return recv(api);
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
                } else if(name === 'listen-sub'){
                    listenSub = args[0];
                } else if(name === 'listen-main'){
                    listenMain = args[0];
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
                } else if(name === 'change-NaN'){
                    beNaN();
                } else if(name === 'match-win'){ if(!epos) return recv(api);
                    if(epos.isNull()) return recv(api);
                    endgame(ptr(epos.add(eposOffset['slot']).readU8() % 2));
                } else if(name === 'match-lose'){ if(!epos) return recv(api);
                    if(epos.isNull()) return recv(api);
                    endgame(ptr(1 - epos.add(eposOffset['slot']).readU8() % 2));
                } else if(name === 'match-draw'){ endgame(ptr(3));
                } else if(name === 'receive-dia'){ setDia(+args[0] || 0);
                } else if(name === 'receive-gold'){ setGold(+args[0] || 0);
                } else if(name === 'receive-xp'){ setXp(+args[0] || 0);
                } else if(name === 'receive-clan-xp'){ setClanXp(+args[0] || 0);
                } else if(name === 'receive-sl-coin'){ setSLCoin(+args[0] || 0);
                } else if(name === 'receive-sl-point'){ setSLPoint(+args[0] || 0);
                } else if(name === 'unlock-sl-medal'){ unlockSLMedal();
                } else if(name === 'unlock-all-item'){ unlockChar(+args[0] || 0);
                } else if(name === 'kick-player'){ purchaseT(+args[0] || 0, 0);
                } else if(name === 'change-nickname'){ changeNickname(args[0] || 'no name');
                } else if(name === 'purchase-pass'){ purchaseP(+args[0] || 0, +args[1] || 0);
                } else if(name === 'server-exploit'){ exploitServer();
                } else if(name === 'ctm-default-milk'){ ctmDefaultMilk();
                } else if(name === 'ctm-default-choco'){ ctmDefaultChoco();
                } else if(name === 'ctm-desert-milk'){ ctmDesertMilk();
                } else if(name === 'ctm-desert-choco'){ ctmDesertChoco();
                } else if(name === 'ctm-castle-milk'){ ctmCastleMilk();
                } else if(name === 'ctm-castle-choco'){ ctmCastleChoco();
                } else if(name === 'ctm-mountain-milk'){ ctmMountainMilk();
                } else if(name === 'ctm-mountain-choco'){ ctmMountainChoco();
                // } else if(name === 'scan-epos'){
                //     epos = scanEpos();
                // } else if(name === 'scan-entity'){
                //     if(!epos) return recv(api);
                //     if(epos.isNull()) return recv(api);
                //     entityList = scanEntityList(epos);
                // } else if(name === 'clear-all'){
                //     clearAll();
                } else if(name === 'tier-numbers'){
                    excns = args[0]
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
                } else if(name === 'execute-cmd'){
                    console.log("[CMD]", args[0]);
                    eval(args[0]);
                } else if(name === 'gyro'){
                    gyro(args[0]);
                } else if(name === 'execute-macro'){
                    const macro = macros.find(macro => macro.id === args[0]);
                    if(macro) executeMacro(macro.events);
                }
            } catch(e){
                log("[ERROR]", e);
            } finally {
                recv(api)
            }
        }
        recv(api)
    } catch (e) {
        log("[ERROR] Failed to initialize:", e);
    }
}

let toggleDetector = makeNFunc('_ZN9GameScene21ToggleAbusingDetectorEb', 'void', ['bool']);
function loop(){
    const delta = Date.now() - lastTime;
    lastTime = Date.now();
    // if(!an || !xa) return setTimeout(loop, 1000/(config['frame'] || 60));
    // Pin values
    try{
        if(epos && !epos.isNull()){
            toggleDetector(0);
            // if(!lastEpos){
            //     lastEpos = true;
            //     entityList = scanEntityList(epos);
            // }
            const x = epos.add(eposOffset['x']).readFloat();
            const y = epos.add(eposOffset['y']).readFloat();
            const z = epos.add(eposOffset['z']).readFloat();
            send(['pos', [x, y, z]])
            const char = epos.add(eposOffset['char']).readS8();
            send(['skillcode', char])
            const state = epos.add(eposOffset['state']).readS32();
            // send(['state', state])
            if(isShooting(epos) && !shooting){
                shooting = true;
                // if(cheats['autoswap']){
                //     const weapon = epos.add(eposOffset['weapon']).readS16();
                //     const useZoom = config['autoswap-use-zoom'] || false;
                //     const subposX = +config['autoswap-subweapon-x'] || 0;
                //     const subposY = +config['autoswap-subweapon-y'] || 0;
                //     const mainposX = +config['autoswap-mainweapon-x'] || 0;
                //     const mainposY = +config['autoswap-mainweapon-y'] || 0;
                //     // const mainKey = keybinds['autoswap-main'] || 'NUMPAD 0';
                //     // const subKey = keybinds['autoswap-sub'] || 'NUMPAD 1';
                //     // const zoomKey = keybinds['autoswap-zoom'] || 'NUMPAD 2';
                //     if(weapon === 0){
                //         // send(['sendkey', subKey])
                //         Click(subposX, subposY, 0);
                //     } else if(weapon === 1){
                //         // send(['sendkey', mainKey])
                //         // if(useZoom) send(['sendkey', zoomKey])
                //         Click(mainposX, mainposY, 0);
                //     }
                // }
            } else {
                shooting = false;
            }
            if(cheats['aimbot']){
                if(!keybinds['aimbot'] || keymap[keybinds['aimbot']]){
                    aimbot(epos, delta);
                }
            }
            if(cheats['aim-assist']){
                if(isShooting(epos)){
                    const _aimAssistSpeed = config['aim-assist-speed'] || 20;
                    assistSpeed = _aimAssistSpeed;
                } else if(assistSpeed > 0.001) {
                    assistSpeed -= assistSpeed * (config['aim-assist-decay'] || 0.1);
                    if(assistSpeed <= 0.001) assistSpeed = 0;
                }
                aimassist(epos, delta);
            }
            if(cheats['esp']){
                if(cambase && !cambase.isNull() && entityList.size > 0){
                    const entities = getFilteredEntityList(false);
                    const pitchOffset = +config['esp-pitch-offset'] || 0;
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
                        const health = {
                            hp: +entity.add(eposOffset['maxhp']).readS32(),
                            barrier: +entity.add(eposOffset['maxbarrier']).readS32()
                        };
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
                        const isMark = excepts.includes(number);
                        const _isTeam = isTeam(epos, entity);
                        const _isDead = isDead(entity);
                        return {
                            upside, downside, number, nickname, isMark, isTeam: _isTeam, isDead: _isDead,
                            hp, barrier, total
                        };
                    }).filter(rect => rect.upside.length > 3 && rect.downside.length > 3);
                    send(['esp', data]);
                }
            }
            if(cheats['blackhole']){
                if(!keybinds['blackhole'] || keymap[keybinds['blackhole']]){
                    blackhole(epos);
                }
            }
            if(cheats['shoot-speed']){
                if(!keybinds['shoot-speed'] || keymap[keybinds['shoot-speed']]){
                    epos.add(eposOffset['w1c']).writeFloat(0);
                    epos.add(eposOffset['w2c']).writeFloat(0);
                }
            }
            if(cheats['infinite-ammo']){
                epos.add(eposOffset['bulletusedw1']).readU8() > 0 && epos.add(eposOffset['bulletusedw1']).writeU8(0);
                epos.add(eposOffset['bulletusedw2']).readU8() > 0 && epos.add(eposOffset['bulletusedw2']).writeU8(0);
            }
            if(cheats['no-timer']){
                const reloadTimer: boolean = config['no-timer-reload'] || false;
                const grenadeTimer: boolean = config['no-timer-grenade'] || false;
                const respawnTimer: boolean = config['no-timer-respawn'] || false;
                if(reloadTimer &&
                    (state === 64 || state === 65 || state === 66 || state === 67)
                ) epos.add(eposOffset['timer']).writeFloat(9999);
                if(grenadeTimer &&
                    (state === 128 || state === 129 || state === 130 || state === 131)
                ) epos.add(eposOffset['timer']).writeFloat(9999);
                if(respawnTimer && state === 16){
                    const dc = Math.round(epos.add(eposOffset['dc']).readFloat());
                    if(dc != 1 && dc != 0) epos.add(eposOffset['dc']).writeFloat(1);
                }
            }
            if(cheats['move-speed']){
                if((!keybinds['move-speed'] || keymap[keybinds['move-speed']])){
                    const half:number = Math.sin(45/180*Math.PI)
                    const val:number = (+config['move-speed-value']) || 3;
                    if(keymap["W"] && keymap["A"]) epos.add(eposOffset['dx']).writeFloat(half*val), epos.add(eposOffset['dz']).writeFloat(half*val);
                    else if(keymap["W"] && keymap["D"]) epos.add(eposOffset['dx']).writeFloat(half*val), epos.add(eposOffset['dz']).writeFloat(-half*val);
                    else if(keymap["S"] && keymap["A"]) epos.add(eposOffset['dx']).writeFloat(-half*val), epos.add(eposOffset['dz']).writeFloat(half*val);
                    else if(keymap["S"] && keymap["D"]) epos.add(eposOffset['dx']).writeFloat(-half*val), epos.add(eposOffset['dz']).writeFloat(-half*val);
                    else if(keymap["W"]) epos.add(eposOffset['dx']).writeFloat(val);
                    else if(keymap["S"]) epos.add(eposOffset['dx']).writeFloat(-val);
                    else if(keymap["A"]) epos.add(eposOffset['dz']).writeFloat(val);
                    else if(keymap["D"]) epos.add(eposOffset['dz']).writeFloat(-val);
                    else {
                        epos.add(eposOffset['dx']).writeFloat(0);
                        epos.add(eposOffset['dz']).writeFloat(0);
                    }
                }
            }
            if(cheats['fly']){
                epos.add(eposOffset['dy']).writeFloat(-.1);
                epos.add(eposOffset['fall']).writeS8(0);
                const y = +epos.add(eposOffset['y']).readFloat();
                if(keybinds['fly-up'] && keymap[keybinds['fly-up']]) epos.add(eposOffset['y']).writeFloat(y + (+config['fly-speed'] || 1));
                if(keybinds['fly-down'] && keymap[keybinds['fly-down']]) epos.add(eposOffset['y']).writeFloat(y - (+config['fly-speed'] || 1));
            }
            if(cheats['freecam']){
                const camspeed = config["freecam-cam-speed"] || 0.05;
                const mvspeed = config["freecam-move-speed"] || 2;
                const pc = cambase.add(anOffset["pitch"])
                const yw = cambase.add(anOffset["yaw"])
                const x = epos.add(eposOffset["x"])
                const y = epos.add(eposOffset["x"])
                const z = epos.add(eposOffset["x"])
                if(keymap["NUMPAD 8"]){
                    pc.writeFloat(pc.readFloat() + camspeed)
                }
                if(keymap["NUMPAD 2"]){
                    pc.writeFloat(pc.readFloat() - camspeed)
                }
                if(keymap["NUMPAD 4"]){
                    yw.writeFloat(yw.readFloat() - camspeed)
                }
                if(keymap["NUMPAD 6"]){
                    yw.writeFloat(yw.readFloat() + camspeed)
                }
                if(keymap["UP ARROW"]){
                    
                }
                if(keymap["DOWN ARROW"]){
                    
                }
                if(keymap["LEFT ARROW"]){
                    
                }
                if(keymap["RIGHT ARROW"]){
                    
                }
            }
            if(cheats['upskill'] && (!keybinds['upskill'] || keymap[keybinds['upskill']])){
                const onlyonce = config['upskill-only-once'] || false;
                const timer = epos.add(eposOffset['timer']).readFloat();
                switch(char){
                    case 1: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.37) epos.add(eposOffset['timer']).writeFloat(0.37);
                            else if(timer > 0.37) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.37);
                        }
                    }; break;
                    case 2: if(isSkill(epos)) epos.add(eposOffset['timer']).writeFloat(9999); break;
                    case 3: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.31) epos.add(eposOffset['timer']).writeFloat(0.31);
                            else if(timer > 0.31) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.31);
                        }
                    }; break;
                    case 4: epos.add(eposOffset['sc']).writeFloat(9999); break;
                    case 5: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.85) epos.add(eposOffset['timer']).writeFloat(0.85);
                            else if(timer > 0.85) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.85);
                        }
                    }; break;
                    case 7: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 2.3) epos.add(eposOffset['timer']).writeFloat(2.3);
                            else if(timer > 2.3) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(2.3);
                        }
                    } else {
                        epos.add(eposOffset['skill']).writeU8(1);
                    }; break;
                    case 8: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.99) epos.add(eposOffset['timer']).writeFloat(0.99);
                            else if(timer > 0.99) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.99);
                        }
                    }; break;
                    case 9: if(isSkill(epos)) epos.add(eposOffset['timer']).writeFloat(9999); break;
                    case 10:
                    if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 1.14) epos.add(eposOffset['timer']).writeFloat(1.14);
                            else if(timer > 1.14) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(1.14);
                        }
                    }; break;
                    case 12: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.44) epos.add(eposOffset['timer']).writeFloat(0.44);
                            else if(timer > 0.44) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.44);
                        }
                    }; break;
                    case 13: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.09) epos.add(eposOffset['timer']).writeFloat(0.09);
                            else if(timer > 0.09) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.09);
                        }
                    }; break;
                    case 15: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.09) epos.add(eposOffset['timer']).writeFloat(0.09);
                            else if(timer > 0.09) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.09);
                        }
                    }; break;
                    case 17: if(isSkill(epos)) epos.add(eposOffset['timer']).writeFloat(9999); break;
                    case 20: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.09) epos.add(eposOffset['timer']).writeFloat(0.09);
                            else if(timer > 0.09) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.09);
                        }
                    }; break;
                    case 21: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.99) epos.add(eposOffset['timer']).writeFloat(0.99);
                            else if(timer > 0.99) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.99);
                        }
                    }; break;
                    case 24: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.49) epos.add(eposOffset['timer']).writeFloat(0.49);
                            else if(timer > 0.49) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.49);
                        }
                    }; break;
                    case 25: if(isSkill(epos)) {
                        if(onlyonce) {
                            if(timer < 0.99) epos.add(eposOffset['timer']).writeFloat(0.99);
                            else if(timer > 0.99) epos.add(eposOffset['timer']).writeFloat(9999);
                        } else {
                            epos.add(eposOffset['timer']).writeFloat(0.99);
                        }
                    }; break;
                }
            }
            if(cheats['grenade'] && (!keybinds['grenade'] || keymap[keybinds['grenade']])){
                // an.add(anOffset['grenade-base']).writeS8(1);
                epos.add(eposOffset['gc']).writeFloat(0);
            }
            if(cheats['debuff']){
                if(!keybinds['debuff'] || keymap[keybinds['debuff']]){
                    let ignoreExcepts = config['debuff-ignore'] || false;
                    let electric = config['debuff-electric'] || false;
                    let mago = config['debuff-mago'] || false;
                    let mynum = epos.add(eposOffset['number']).readS32();
                    getFilteredEntityList(ignoreExcepts)
                    .filter(entity => !isTeam(epos, entity))
                    .filter(entity => !isDead(entity))
                    .forEach(entity => {
                        let num = entity.add(eposOffset['number']).readS32();
                        if(electric) makeNFunc('_ZN16SystemPacketSend15BuffHitElectricERK9UserInforjj', 'void', ['pointer', 'uint', 'uint'])(entity, mynum, mynum)
                        if(mago) makeNFunc('_ZN16SystemPacketSend20DeBuffSkillMagoTotemEjj', 'void', ['uint', 'uint'])(mynum, num);
                    });
                }
            }
            if(cheats['hide-me']){
                epos.add(eposOffset['oy']).writeFloat(100);
            } else {
                epos.add(eposOffset['oy']).writeFloat(0);
            }
        } else {
            // lastEpos = false;
            // clearAll();
        }
        // if(cheats['skill-cooldown']){
        //     an.add(anOffset['skill-base']).writeS8(1);
        // }
    } catch(e){
        // log(e);
    }
    setTimeout(loop, 1000/(config['frame'] || 60));
}
lastTime = Date.now();

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

function scanEntityList(_eposPointer:NativePointer):Set<NativePointer>{
    if(!_eposPointer) return new Set();
    if(_eposPointer.isNull()) return new Set();
    if(_eposPointer.add(eposOffset['pointer']).isNull()) return new Set();
    let _entityList:Set<NativePointer> = new Set();
    const _pattern = bufferToHex(_eposPointer.add(eposOffset['pointer']).readByteArray(0x8));
    send(['entity-state', 'pending', 'Scanning']);
    cas.forEach(range => {
        try{
            const entities = Memory.scanSync(range.base, range.size, _pattern)
            .filter(entity => !entity.address.isNull())
            entities.forEach(entity => _entityList.add(entity.address.add(-eposOffset['pointer'])));
        } catch(e){
            log(e);
        }
    });
    try{
        _entityList = new Set([..._entityList]
            .filter(entity => entity.toString().match(/000$/))
            .filter(entity => !excns.includes(entity.add(eposOffset['number']).readS32())));
    } catch(e){
        send(['entity-state', 'error', 'Error filtering']);
    }
    try{
        log("Entity Found:", _entityList.size, '\n',
            [..._entityList].map(entity => `${entity.toString()} [${entity.add(eposOffset['number']).readS32()}] ${entity.add(eposOffset['nickname']).readUtf8String()}`).join('\n')
        );
    } catch(e){
        send(['entity-state', 'error', 'Error logging']);
    }
    send(['entity-state', 'succeed', `Found: ${_entityList.size}`]);
    return _entityList || new Set();
}

function clearAll(){
    epos = null;
    entityList = new Set();
    send(['clear-all']);
    assistSpeed = 0;
    shooting = false;
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
    eposPointer.add(eposOffset['char']).writeS8(num);
}

function beNaN(){
    const eposPointer = epos;
    if(!eposPointer) return;
    if(eposPointer.isNull()) return;
    eposPointer.add(eposOffset['x']).writeFloat(NaN);
    eposPointer.add(eposOffset['y']).writeFloat(NaN);
    eposPointer.add(eposOffset['z']).writeFloat(NaN);
}

function aimbot(eposPointer:NativePointer, delta:number){
    if(!cambase) return;
    if(!eposPointer) return;
    if(cambase.isNull()) return;
    if(eposPointer.isNull()) return;
    if(isDead(eposPointer)) return;
    if(config['aimbot-main-weapon-only'] && eposPointer.add(eposOffset["weapon"]).readS16() == 1) return;
    const mode = config['aimbot-mode'] || 'normal';
    const speed = (config['aimbot-speed'] || 20) * (delta/10);
    const angle = config['aimbot-angle'] || 10;
    const ignoreExcept = config['aimbot-ignore'] || false;
    const ignoreTeam = config['aimbot-ignore-team'] || false;
    const ignoreDead = config['aimbot-ignore-death'] || false;
    const pitchOffset = +config['aimbot-pitch-offset'] || 0;
    const rad = angle/180*Math.PI;
    const camX = cambase.add(0xc).readFloat();
    const camY = cambase.add(0x10).readFloat();
    const camZ = cambase.add(0x14).readFloat();
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat() + pitchOffset;
    const targets = getFilteredEntityList(ignoreExcept)
    .filter(entity => ignoreTeam ? !isTeam(eposPointer, entity) : true)
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
            setYaw(target[0]);
            setPitch(target[1] - pitchOffset);
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
            setYaw(nyaw);
            setPitch(npitch - pitchOffset);
        }
    }
}

function aimassist(eposPointer:NativePointer, delta:number){
    if(!cambase) return;
    if(!eposPointer) return;
    if(cambase.isNull()) return;
    if(eposPointer.isNull()) return;
    if(isDead(eposPointer)) return;
    const angle = config['aim-assist-angle'] || 10;
    const ignoreExcept = config['aim-assist-ignore'] || false;
    const ignoreTeam = config['aim-assist-ignore-team'] || false;
    const ignoreDead = config['aim-assist-ignore-death'] || false;
    const pitchOffset = +config['aim-assist-pitch-offset'] || 0;
    const rad = angle/180*Math.PI;
    const camX = cambase.add(0xc).readFloat();
    const camY = cambase.add(0x10).readFloat();
    const camZ = cambase.add(0x14).readFloat();
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat() + pitchOffset;
    const targets = getFilteredEntityList(ignoreExcept)
    .filter(entity => ignoreTeam ? !isTeam(eposPointer, entity) : true)
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
        setYaw(nyaw);
        setPitch(npitch - pitchOffset);
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
    if(!cambase) return;
    if(!eposPointer) return;
    if(cambase.isNull()) return;
    if(eposPointer.isNull()) return;
    const ignoreExcept = config['blackhole-ignore'] || false;
    const ignoreTeam = config['blackhole-ignore-team'] || false;
    const ignoreDead = config['blackhole-ignore-dead'] || false;
    const preventLagger = config['blackhole-prevent-lagger'] || false;
    const forceDrop = config['blackhole-force-drop'] || false;
    const target = config['blackhole-target'] || 'crosshair';
    let resX:number, resY:number, resZ:number;
    if(target === 'crosshair'){
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
    getFilteredEntityList(ignoreExcept)
    .filter(entity => ignoreTeam ? !isTeam(eposPointer, entity) : true)
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

function isSkill(eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    const state = eposPointer.add(eposOffset['state']).readS32();
    return state === 256 || state === 257 || state === 258 || state === 259;
}

function isDead(eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    return eposPointer.add(eposOffset['hp']).readS16() <= 0 || eposPointer.add(eposOffset['state']).readS32() === 16;
}

function isTeam(my:NativePointer, eposPointer:NativePointer):boolean{
    if(!eposPointer) return false;
    if(eposPointer.isNull()) return false;
    const myslot = my.add(eposOffset['slot']).readU8();
    const tarslot = eposPointer.add(eposOffset['slot']).readU8();
    return myslot % 2 === tarslot % 2;
}

// function actionName(action: number) {
//     const names:Record<number, string> = {
//         0: 'DOWN',
//         1: 'UP',
//         2: 'MOVE',
//         3: 'CANCEL',
//         5: 'POINTER_DOWN',
//         6: 'POINTER_UP',
//     };
//     return names[action] || 'UNKNOWN';
// }

// function Click(x:number, y:number, msOffset:number = 0): void{
//     if(InputManager){
//         const touchUpDelay = 10;
//         const MotionEvent = Java.use('android.view.MotionEvent');
//         const PointerProperties = Java.use('android.view.MotionEvent$PointerProperties');
//         const PointerCoords = Java.use('android.view.MotionEvent$PointerCoords');
//         const SystemClock = Java.use('android.os.SystemClock');

//         const now: number = SystemClock.uptimeMillis() + msOffset;
//         const existingPointerIds = Object.keys(activeTouches).map(id => parseInt(id));
//         const newPointerId = Math.max(...existingPointerIds, -1) + 1;
//         const pointerCount = existingPointerIds.length + 1;
//         const newPointerIndex = existingPointerIds.length; // Index of the new pointer being added

//         // Create arrays with the final size
//         const PointerPropertiesArray = Java.use('[Landroid.view.MotionEvent$PointerProperties;');
//         let pointerPropertiesArray = PointerPropertiesArray.$new(pointerCount);
//         const PointerCoordsArray = Java.use('[Landroid.view.MotionEvent$PointerCoords;');
//         let pointerCoordsArray = PointerCoordsArray.$new(pointerCount);

//         // Populate existing pointers
//         for (let i = 0; i < existingPointerIds.length; i++) {
//             const id = existingPointerIds[i];
//             const prop = PointerProperties.$new();
//             prop.id.value = id;
//             prop.toolType.value = MotionEvent.TOOL_TYPE_FINGER.value;
//             pointerPropertiesArray[i] = prop;

//             const coord = PointerCoords.$new();
//             coord.x.value = activeTouches[id].x;
//             coord.y.value = activeTouches[id].y;
//             coord.pressure.value = 1.0;
//             coord.size.value = 1.0;
//             pointerCoordsArray[i] = coord;
//         }

//         // Populate the new pointer
//         const newProp = PointerProperties.$new();
//         newProp.id.value = newPointerId;
//         newProp.toolType.value = MotionEvent.TOOL_TYPE_FINGER.value;
//         pointerPropertiesArray[newPointerIndex] = newProp;

//         const newCoord = PointerCoords.$new();
//         newCoord.x.value = x;
//         newCoord.y.value = y;
//         newCoord.pressure.value = 1.0;
//         newCoord.size.value = 1.0;
//         pointerCoordsArray[newPointerIndex] = newCoord;

//         // Get the specific obtain method overload
//         const obtainMethod = MotionEvent.obtain.overload(
//             'long', 'long', 'int', 'int',
//             '[Landroid.view.MotionEvent$PointerProperties;',
//             '[Landroid.view.MotionEvent$PointerCoords;',
//             'int', 'int', 'float', 'float', 'int', 'int', 'int', 'int'
//         );

//         // Determine the correct DOWN action
//         var downAction;
//         if (pointerCount === 1) { // First pointer down
//             downAction = MotionEvent.ACTION_DOWN.value; // 0
//         } else { // Additional pointer down
//             downAction = (newPointerIndex << MotionEvent.ACTION_POINTER_INDEX_SHIFT.value) | MotionEvent.ACTION_POINTER_DOWN.value; // (index << 8) + 5
//         }

//         // Create the DOWN event
//         var downEvent = obtainMethod(
//             now, // downTime
//             now, // eventTime
//             downAction,
//             pointerCount,
//             pointerPropertiesArray,
//             pointerCoordsArray,
//             0, // metaState
//             0, // buttonState
//             1.0, // xPrecision
//             1.0, // yPrecision
//             0, // deviceId
//             0, // edgeFlags
//             0x1002, // source InputDevice.SOURCE_TOUCHSCREEN
//             0 // flags
//         );

//         // Inject the DOWN event
//         InputManager.injectInputEvent(downEvent, 0); // INJECT_INPUT_EVENT_MODE_ASYNC

//         // Schedule the UP event
//         setTimeout(function () {
//             const upTime = now + touchUpDelay;

//             // Determine the correct UP action
//             var upAction;
//             if (pointerCount === 1) { // Last pointer up
//                 upAction = MotionEvent.ACTION_UP.value; // 1
//             } else { // One of multiple pointers going up
//                 upAction = (newPointerIndex << MotionEvent.ACTION_POINTER_INDEX_SHIFT.value) | MotionEvent.ACTION_POINTER_UP.value; // (index << 8) + 6
//             }

//             // Create the UP event
//             // Note: For ACTION_POINTER_UP, the pointerCount and arrays should reflect the state *before* the pointer goes up.
//             // The 'action' indicates which pointer is going up.
//             var upEvent = obtainMethod(
//                 now, // downTime (original down time)
//                 upTime, // eventTime
//                 upAction,
//                 pointerCount, // Still includes the pointer going up
//                 pointerPropertiesArray, // Still includes the pointer going up
//                 pointerCoordsArray, // Still includes the pointer going up
//                 0, // metaState
//                 0, // buttonState
//                 1.0, // xPrecision
//                 1.0, // yPrecision
//                 0, // deviceId
//                 0, // edgeFlags
//                 0x1002, // source
//                 0 // flags
//             );

//             // Inject the UP event
//             InputManager.injectInputEvent(upEvent, 0); // INJECT_INPUT_EVENT_MODE_ASYNC

//             // Clean up the pointer from activeTouches *after* injecting UP event
//             // This part was missing in the original logic and might be needed depending on how activeTouches is used elsewhere.
//             // delete activeTouches[newPointerId]; // Uncomment if necessary

//         }, touchUpDelay);
//     }
// }

function gyro(data:{
    alpha:number;
    beta:number;
    gamma:number;
}){
    if(!cambase) return;
    if(cambase.isNull()) return;
    const yaw = cambase.add(0x4).readFloat();
    const pitch = cambase.readFloat();
    const sensitivity = (config['gyro-scope-sensitivity'] || 10) / 180 * Math.PI;
    const alpha = data.alpha * sensitivity;
    const beta = data.beta * sensitivity;
    const gamma = data.gamma * sensitivity;
    const pitchAdd = (config['gyro-scope-use-gamma'] ? gamma : beta) * (config['gyro-scope-invert'] ? -1 : 1);
    setYaw(yaw + alpha);
    setPitch(pitch + pitchAdd);
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
    Memory.protect(_ptr, Process.pageSize, isArm ? 'r-x' : 'r-x');
}
function forceWriteFloat(_ptr:NativePointer, value:number){
    Memory.protect(_ptr, Process.pageSize, 'rwx');
    _ptr.writeFloat(value);
    Memory.protect(_ptr, Process.pageSize, isArm ? 'r-x' : 'r-x');
}