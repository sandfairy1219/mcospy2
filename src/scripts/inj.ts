const bypassMode = false;
const cookie = "";

let mynum:number = 0;
let excs:number[] = [];
const inj_defaultConfig = {
    elec: false,
    mago: false,
    bh: false,
    ws: true,
    nr: true,
    mv: false,
    skc: true,
    ld: false,
    win: false,
    // static
    clip: false,
    onek: true,
    onesk: true,
    resp: true,
}

const libMyGame = "libMyGame.so";
let modl = Module.findBaseAddress(libMyGame);

interface OffsetInfo {
    name: string;
    str: string;
    args: NativeFunctionArgumentType[];
}

const eposOffsets = {
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
    'slot':0xC0, // byte
    'movable':0xC2, // byte
    'timer':0xC8, // float
    'sc':0xCC, // float
    'dc':0xE0, // float
    'w1c':0xE8, // float
    'w2c':0xEC, // float
    'dz':0xFC, // float
    'dx':0x100, // float
    'dz2':0x110, // float
    'dx2':0x114, // float
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
    'pointer':0xED8, // pointer
};

const cheatOffsets: Record<string, OffsetInfo> = {
    setClanExp: {
        name: "setClanExp",
        str: "_ZN16SystemPacketSend15CheatSetClanExpEj",
        args: ["uint"],
    },
    forceEndGame: {
        name: "forceEndGame",
        str: "_ZN16SystemPacketSend17CheatForceEndGameENS_16ForceEndGameTypeE",
        args: ["pointer"],
    },
    disconnectGameServer: {
        name: "disconnectGameServer",
        str: "_ZN16SystemPacketSend39CheatDisconnectGameServerFromDataServerEh",
        args: ["uchar"],
    },
    setLatency: {
        name: "setLatency",
        str: "_ZN16SystemPacketSend15CheatSetLatencyEj",
        args: ["uint"],
    },
    setStarLeaguePoint: {
        name: "setStarLeaguePoint",
        str: "_ZN16SystemPacketSend23CheatSetStarLeaguePointEt",
        args: ["uint16"],
    },
    getStarLeagueReward: {
        name: "getStarLeagueReward",
        str: "_ZN16SystemPacketSend24CheatGetStarLeagueRewardEv",
        args: ["void"],
    },
    setStarLeagueCoin: {
        name: "setStarLeagueCoin",
        str: "_ZN16SystemPacketSend22CheatSetStarLeagueCoinEj",
        args: ["uint"],
    },
    setGradeAndPoint: {
        name: "setGradeAndPoint",
        str: "_ZN16SystemPacketSend21CheatSetGradeAndPointEhj",
        args: ["uchar", "uint"],
    },
    setPoint: {
        name: "setPoint",
        str: "_ZN16SystemPacketSend13CheatSetPointEhj",
        args: ["uchar", "uint"],
    },
    setGold: {
        name: "setGold",
        str: "_ZN16SystemPacketSend12CheatSetGoldEii",
        args: ["int", "int"],
    },
    setBMoney: {
        name: "setBMoney",
        str: "_ZN16SystemPacketSend14CheatSetBMoneyEii",
        args: ["int", "int"],
    },
    setMoney: {
        name: "setMoney",
        str: "_ZN16SystemPacketSend13CheatSetMoneyEii",
        args: ["int", "int"],
    },
    setAllSkillCoolTimeOneSecond: {
        name: "setAllSkillCoolTimeOneSecond",
        str: "_ZN16SystemPacketSend33CheatSetAllSkillCoolTimeOneSecondEb",
        args: ["bool"],
    },
    getStarLeagueMedal: {
        name: "getStarLeagueMedal",
        str: "_ZN16SystemPacketSend23CheatGetStarLeagueMedalEhm",
        args: ["uchar", "ulong"],
    },
}

const buyOffsets: Record<string, OffsetInfo> = {
    buyWithGold: {
        name: "buyWithGold",
        str: "_ZN16SystemPacketSend11BuyWithGoldEh",
        args: ["uchar"],
    },
    buyCharacter: {
        name: "buyCharacter",
        str: "_ZN16SystemPacketSend12BuyCharacterEh",
        args: ["uchar"],
    },
    buyBoost: {
        name: "buyBoost",
        str: "_ZN16SystemPacketSend8BuyBoostEh",
        args: ["uchar"],
    },
    buyWithClanGold: {
        name: "buyWithClanGold",
        str: "_ZN16SystemPacketSend15BuyWithClanGoldEh",
        args: ["uchar"],
    },
    buyResetKillDeathRatio: {
        name: "buyResetKillDeathRatio",
        str: "_ZN16SystemPacketSend22BuyResetKillDeathRatioEh",
        args: ["uchar"],
    },
    buyItem: {
        name: "buyItem",
        str: "_ZN16SystemPacketSend7BuyItemEhhhh",
        args: ["uchar", "uchar", "uchar", "uchar"], // character, slot, itemid, count (grenade)
    },
    buyRandomOption: {
        name: "buyRandomOption",
        str: "_ZN16SystemPacketSend15BuyRandomOptionEhhhh",
        args: ["uchar", "uchar", "uchar", "uchar"], // character, slot, ?, ?
    },
    buyToyItem: {
        name: "buyToyItem", // guess sky kong kong
        str: "_ZN16SystemPacketSend10BuyToyItemEjhi",
        args: ["uint", "uchar", "int"],
    },
    equip: {
        name: "equip",
        str: "_ZN16SystemPacketSend5EquipEhhh",
        args: ["uchar", "uchar", "uchar"],
    },
    getRewardClassPacket: {
        name: "getRewardClassPackage",
        str: "_ZN16SystemPacketSend12ClassPackage23GetRewardInClassPackageEhhmhhhh",
        args: [],
    }
}

const inGameOffsets: Record<string, OffsetInfo> = {
    hitUser: {
        name: "hitUser",
        str: "_ZN16SystemPacketSend7HitUserERK9UserInforhS2_RKN7cocos2d4Vec3Esf",
        args: ["pointer", "uchar", "pointer", "pointer", "int16", "float"],
    },
    buffHitElectric: {
        name: "buffHitElectric",
        str: "_ZN16SystemPacketSend15BuffHitElectricERK9UserInforjj",
        args: ["pointer", "uint", "uint"],
    },
    buffHitElectricAi: {
        name: "buffHitElectricAi",
        str: "_ZN16SystemPacketSend21BuffHitElectricAIUserERK9UserInforjj",
        args: ["pointer", "uint", "uint"],
    },
    buffHitElectricOff: {
        name: "buffHitElectricOff",
        str: "_ZN19SystemOfflinePacket15BuffHitElectricERK9UserInforjj",
        args: ["pointer", "uint", "uint"],
    },
    debuffToUser: {
        name: "debuffToUser",
        str: "_ZN9GameScene25ElectricDebuffToUserSkillER9UserInforR5CBuff",
        args: ["pointer", "pointer"],
    },
    debuffSkillMagoTotem: {
        name: "debuffSkillMagoTotem",
        str: "_ZN16SystemPacketSend20DeBuffSkillMagoTotemEjj",
        args: ["uint", "uint"],
    },
    updateHookSkill: {
        name: "updateHookSkill",
        str: "_ZN9GameScene15UpdateHookSkillEP9UserInfor",
        args: ["pointer"],
    },
    medicSelfHeal: {
        name: "medicSelfHeal",
        str: "_ZN19SystemOfflinePacket20ProcessMedicSelfHealERK9UserInfor",
        args: ["pointer"],
    },
    buffOnWheelleg: {
        name: "buffOnWheelleg",
        str: "_ZN16SystemPacketSend14BuffOnWheellegERK9UserInfor",
        args: ["pointer"],
    },
    buffMagoTotem: {
        name: "buffMagoTotem",
        str: "_ZN16SystemPacketSend18BuffSkillMagoTotemEjRKSt4listIjSaIjEE",
        args: ["uint", "pointer"],
    },
    timeOverRespawn: {
        name: "timeOverRespawn",
        str: "_ZN16SystemPacketSend22TimeOverRespawnWaitingERK9UserInfor",
        args: ["pointer"],
    },
    changeMissionCount: {
        name: "changeMissionCount",
        str: "_ZN16SystemPacketSend22SendChangeMissionCountEjmjt",
        args: ["uint", "ulong", "uint", "uint16"],
    },
    completeGameData: {
        name: "completeGameData",
        str: "_ZN16SystemPacketSend20SendCompleteGameDataEi",
        args: ["uint"],
    },
    MoveAi: {
        name: "MoveAi",
        str: "_ZN14UserMoveSystem6MoveAIERNS_13CollisionDataERN7cocos2d4Vec3ES4_fR9GameSceneR9UserInforf",
        args: ["pointer", "pointer", "pointer", "float", "pointer", "pointer", "float"],
    },
    getMySkillCoolTime: {
        name: "getMySkillCoolTime",
        str: "_ZN5Skill18GetMySkillCoolTimeEv",
        args: ["void"],
    },
    getMaxSkill: {
        name: "getMaxSkill",
        str: "_ZN5Skill16GetMaxSkillCountEh",
        args: ["uchar"],
    },
    getCurSkill: {
        name: "getCurSkill",
        str: "_ZN5Skill16GetCurSkillCountEv",
        args: ["void"],
    },
    isSkillManyTimes: {
        name: "isSkillManyTimes",
        str: "_ZN5Skill16IsSkillManyTimesEh",
        args: ["uchar"],
    },
    calculateSpeed: {
        name: "calculateSpeed",
        str: "_ZN14UserMoveSystem14CalculateSpeedERfR9GameSceneR9UserInforf",
        args: ["float", "pointer", "pointer", "float"],
    },
    createMoveSpeed: {
        name: "createMoveSpeed",
        str: "_ZN16SystemPacketSend19CreateMoveSpeedBuffEjj",
        args: ["uint", "uint"],
    },
    createMaxBarrier: {
        name: "createMaxBarrier",
        str: "_ZN16SystemPacketSend20CreateMaxBarrierBuffEjj",
        args: ["uint", "uint"],
    },
    createDamageReduction: {
        name: "createDamageReduction",
        str: "_ZN16SystemPacketSend25CreateDamagereductionBuffERK9UserInfor",
        args: ["pointer"],
    },
    createChooChoo: {
        name: "createChooChoo",
        str: "_ZN16SystemPacketSend18CreateChooChooBuffERK9UserInfor",
        args: ["pointer"],
    },
    getRespawnTime: {
        name: "getRespawnTime",
        str: "_ZNK9GameScene14GetRespawnTimeEv",
        args: ["pointer"],
    },
    wheellegSpeedUpBuffApplyBuff: {
        name: "wheellegSpeedUpBuffApplyBuff",
        str: "_ZN20CWheellegSpeedUpBuff9ApplyBuffEP9UserInfor",
        args: ["pointer"],
    },
}

const charStatusOffsets: Record<string, OffsetInfo> = {
    getMaxHP: {
        name: "getMaxHP",
        str: "_ZN20CharStatusCalculator8GetMaxHPERK9UserInforh",
        args: ["pointer", "uchar"],
    },
    getMaxBarrier: {
        name: "getMaxBarrier",
        str: "_ZN20CharStatusCalculator13GetMaxBarrierERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getShootDelay: {
        name: "getShootDelay",
        str: "_ZN20CharStatusCalculator13GetShootDelayERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getReloadSpeed: {
        name: "getReloadSpeed",
        str: "_ZN20CharStatusCalculator18GetReloadSpeedRateERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getMoveSpeed: {
        name: "getMoveSpeed",
        str: "_ZN20CharStatusCalculator12GetMoveSpeedER9UserInfor",
        args: ["pointer", "uchar"],
    },
    getSkillDamage: {
        name: "getSkillDamage",
        str: "_ZN20CharStatusCalculator14GetSkillDamageERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getSkillCooltime: {
        name: "getSkillCooltime",
        str: "_ZN20CharStatusCalculator16GetSkillCoolTimeERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getShotgunBullet: {
        name: "getShotgunBullet",
        str: "_ZN20CharStatusCalculator16GetShotGunBulletERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getBodyshotDamage: {
        name: "getBodyshotDamage",
        str: "_ZN20CharStatusCalculator21GetBodyShotDamageRateERK9UserInfor",
        args: ["pointer"],
    },
    getHeadshotDamage: {
        name: "getHeadshotDamage",
        str: "_ZN20CharStatusCalculator21GetHeadShotDamageRateERK9UserInfor",
        args: ["pointer"],
    },
    cookerBuffWeight: {
        name: "cookerBuffWeight",
        str: "_ZN20CharStatusCalculator19GetCookerBuffWeightERK9UserInfor",
        args: ["pointer"],
    },
}

const charRefOffsets: Record<string, OffsetInfo> = {
    getJumpSpeed: {
        name: "getJumpSpeed",
        str: "_ZNK13CCharacterRef12GetJumpSpeedEh",
        args: ["uchar"],
    },
    getMoveSpeed: {
        name: "getMoveSpeed",
        str: "_ZNK13CCharacterRef12GetMoveSpeedEh",
        args: ["uchar"],
    },
    getMaxBarrier: {
        name: "getMaxBarrier",
        str: "_ZNK13CCharacterRef13GetMaxBarrierEh",
        args: ["uchar"],
    },
    getSkillDamage: {
        name: "getSkillDamage",
        str: "_ZNK13CCharacterRef14GetSkillDamageEh",
        args: ["uchar"],
    },
    getSkillCooltime: {
        name: "getSkillCooltime",
        str: "_ZNK13CCharacterRef16GetSkillCoolTimeEh",
        args: ["uchar"],
    },
    getBarrierRecovery: {
        name: "getBarrierRecovery",
        str: "_ZNK13CCharacterRef18GetBarrierRecoveryEh",
        args: ["uchar"],
    },
}

const clanOffsets: Record<string, OffsetInfo> = {
    matchEndGame: {
        name: "matchEndGame",
        str: "_ZN16SystemPacketSend16ClanMatchEndGameEjhj",
        args: ["uint", "uchar", "uint"],
    },
    reqInfoEndMatch: {
        name: "reqInfoEndMatch",
        str: "_ZN16SystemPacketSend30ClanRequestInformationEndMatchEj",
        args: ["uint"],
    },
}

const cloudOffsets: Record<string, OffsetInfo> = {
    getSkillTime: {
        name: "getSkillTime",
        str: "_ZN5Cloud8CharData12GetSkillTimeEv",
        args: ["void"],
    },
    getSkillElapsed: {
        name: "getSkillElapsed",
        str: "_ZN5Cloud8CharData19GetSkillElapsedTimeEv",
        args: ["void"],
    },
    isSkillAvailable: {
        name: "isSkillAvailable",
        str: "_ZN5Cloud8CharData16IsSkillAvailableEv",
        args: ["void"],
    },
    getSendContribPacketTime: {
        name: "getSendContribPacketTime",
        str: "_ZN5Cloud8GameData24GetSendContribPacketTimeEv",
        args: ["void"],
    },
    setSendContribPacketTime: {
        name: "setSendContribPacketTime",
        str: "_ZN5Cloud8GameData24SetSendContribPacketTimeEf",
        args: ["float"],
    },
    getIsVisibleSnail: {
        name: "getIsVisibleSnail",
        str: "_ZN5Cloud8GameData17GetIsVisibleSnailEv",
        args: ["void"],
    },
    setIsVisibleSnail: {
        name: "setIsVisibleSnail",
        str: "_ZN5Cloud8GameData17SetIsVisibleSnailEb",
        args: ["bool"],
    },
    getAbusingDetector: {
        name: "getAbusingDetector",
        str: "_ZN5Cloud7NetData18GetAbusingDetectorEv",
        args: ["void"],
    },
}

const globalOffsets: Record<string, OffsetInfo> = {
    updatePacketReceiveTime: {
        name: "updatePacketReceiveTime",
        str: "_ZN16SystemPacketSend23UpdatePacketReceiveTimeEf",
        args: ["float"],
    },
    requestLogin: {
        name: "requestLogin",
        str: "_ZN16SystemPacketSend12RequestLoginEiRKSsS1_",
        args: ["int", "pointer", "pointer"],
    },
    testDeleteAccount: {
        name: "testDeleteAccount",
        str: "_ZN16SystemPacketSend17TestDeleteAccountEv",
        args: ["void"],
    },
    chatting: {
        name: "chatting",
        str: "_ZN16SystemPacketSend8ChattingEhOSs",
        args: ["uchar", "pointer"],
    },
    getUserByOrder: {
        name: "getUserByOrder",
        str: "_ZN15UserInfoManager14GetUserByOrderEh",
        args: ["uchar"],
    },
    getUserByUserSeq: {
        name: "getUserByUserSeq",
        str: "_ZN15UserInfoManager16GetUserByUserSeqEj",
        args: ["uint"],
    },
    resetPacketReceive: {
        name: "resetPacketReceive",
        str: "_ZN16SystemPacketSend22ResetPacketReceiveTimeEv",
        args: ["void"],
    },
    sendPacket: {
        name: "sendPacket",
        str: "_ZN16SystemPacketSend10SendPacketEv",
        args: ["void"],
    },
    addPacketData: {
        name: "addPacketData",
        str: "_ZN16SystemPacketSend13AddPacketDataIhEEvRKT_",
        args: ["pointer"],
    },
    getTCPSocketManager: {
        name: "getTCPSocketManager",
        str: "_ZN5Cloud7NetData19GetTCPSocketManagerEv",
        args: ["void"],
    },
}

const cameraOffsets: Record<string, OffsetInfo> = {
    update: {
        name: "update",
        str: "_ZN10GameCamera6UpdateEf",
        args: ["float"],
    },
    setCameraPos: {
        name: "setCameraPos",
        str: "_ZN10GameCamera12SetCameraPosER9GameSceneb",
        args: ["pointer", "bool"],
    },
    updateAimAssist: {
        name: "updateAimAssist",
        str: "_ZN9GameScene15UpdateAimAssistEf",
        args: ["float"],
    },
    isAimAssist: {
        name: "isAimAssist",
        str: "_ZNK9GameScene11IsAimAssistEv",
        args: ["void"],
    },
    sendAimAssist: {
        name: "sendAimAssist",
        str: "_ZN16SystemPacketSend19SendAimAssistOptionEb",
        args: ["bool"],
    },
    canTrackAimAssist: {
        name: "canTrackAimAssist",
        str: "_ZN9GameScene26CanTrackTargetForAimAssistEP9UserInforS1_",
        args: ["pointer", "pointer"],
    },
    onClickedAimAssist: {
        name: "onClickedAimAssist",
        str: "_ZN20UIPopupOptionSetting30OnClickedToggle_EventAimAssistEPN7cocos2d3RefE",
        args: ["pointer"],
    },
}

async function inj_sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function changeArgs(args:NativeFunctionArgumentType[], target:InvocationArguments){
    let _args = [];
    for(let i = 0; i < args.length; i++){
        let type = args[i]
        let tar = target[i]
        let val;
        switch (type) {
            case "bool":
                val = !!tar.toInt32();
                break;
            case "char":
            case "int16":
            case "int":
            case "long":
                val = tar.toInt32();
                break;
            case "uchar":
            case "uint16":
            case "uint":
            case "ulong":
                val = tar.toUInt32();
                break;
            case "float":
                val = tar.readFloat();
                break;
            case "double":
                val = tar.readDouble();
                break;
            case "void":
                val = tar;
                break;
            case "pointer":
                val = tar.toString();
                break;
            default:
                val = tar;
                break;
        }
        _args.push(val)
    }
    return _args;
}

function attach(ofst:OffsetInfo){
    const pt = Module.findExportByName(libMyGame, ofst.str);
    if(pt){
        Interceptor.attach(pt, {
            onEnter: (args) => {
                const _args = changeArgs(ofst.args, args);
                console.log(`[+] ${ofst.name} (${pt.toString()}) Called:`, ..._args)
            },
            onLeave: (retval) => {
                console.log(`[-] ${ofst.name} (${pt.toString()}) Returned:`, retval, retval.toUInt32())
            }
        })
    }
}

function attachStr(str: string, fargs?: NativeFunctionArgumentType[]){
    const pt = Module.findExportByName(libMyGame, str);
    Interceptor.attach(pt, {
        onEnter: args => {
            console.log(`[+] (${pt.toString()}) Called:`, fargs ? changeArgs(fargs, args) : args[0])
        },
        onLeave: (retval) => {
            console.log(`[-] (${pt.toString()}) Returned:`, retval, retval.toUInt32())
        }
    })
}

function func(ofst: OffsetInfo): NativeFunction<any, any>{
    const pt = Module.findExportByName(libMyGame, ofst.str)
    if(pt) return new NativeFunction(pt, "bool", ofst.args)
    else return null;
}

function intercept(ofst: OffsetInfo, callbacksOrProbe: InvocationListenerCallbacks | InstructionProbeCallback) {
    Interceptor.attach(Module.findExportByName(libMyGame, ofst.str), callbacksOrProbe)
}

function isValidAddress(ptrAddr:NativePointer) {
    try {
        return Process.findRangeByAddress(ptrAddr) !== null;
    } catch (e) {
        return false;
    }
}

class Ch{
    elec:boolean = inj_defaultConfig.elec;
    mago:boolean = inj_defaultConfig.mago;
    bh:boolean = inj_defaultConfig.bh;
    ws:boolean = inj_defaultConfig.ws;
    nr:boolean = inj_defaultConfig.nr;
    mv:boolean = inj_defaultConfig.mv;
    skc:boolean = inj_defaultConfig.skc;
    ld:boolean = inj_defaultConfig.ld;
    win:boolean = inj_defaultConfig.win;
    _clip:boolean = true;
    _onek:boolean = false;
    _onesk:boolean = false;
    _resp:boolean = false;

    me:string = "";

    constructor(clip: boolean, onek: boolean, onesk: boolean, resp: boolean){
        this.clip = clip;
        this.onek = onek;
        this.onesk = onesk;
        this.resp = resp;
    }

    sk(n: number){
        if(this.me && ptr(this.me) && !ptr(this.me).isNull()){
            ptr(this.me).add(eposOffsets.sk).writeU8(n);
        };
    }

    set clip(b:boolean){
        this._clip = b;
        const pt = Module.findExportByName(libMyGame, inGameOffsets.MoveAi.str).sub(0x4);
        Memory.protect(pt, Process.pageSize, 'rwx');
        pt.writeFloat(b ? 0.01 : 100);
        Memory.protect(pt, Process.pageSize, 'r-x');
    }
    set onek(b:boolean){
        this._onek = b;
        const bd = Module.findExportByName(libMyGame, charStatusOffsets.getBodyshotDamage.str);
        Memory.protect(bd, Process.pageSize, 'rwx');
        bd.writeS32(b ? 505_925_632 : 506_335_232);
        Memory.protect(bd, Process.pageSize, 'r-x');
        const hd = Module.findExportByName(libMyGame, charStatusOffsets.getHeadshotDamage.str).add(0x10);
        Memory.protect(hd, Process.pageSize, 'rwx');
        hd.writeS32(b ? 505_925_632 : -1_136_594_944);
        Memory.protect(hd, Process.pageSize, 'r-x');
    }
    set onesk(b:boolean){
        this._onesk = b;
        const pt = Module.findExportByName(libMyGame, charRefOffsets.getSkillDamage.str).add(0x60);
        Memory.protect(pt, Process.pageSize, 'rwx');
        pt.writeS32(b ? 1_384_184_322 : -1_203_335_166);
        Memory.protect(pt, Process.pageSize, 'r-x');
    }
    set resp(b:boolean){
        this._resp = b;
        const pt = Module.findExportByName(libMyGame, inGameOffsets.getRespawnTime.str).add(0x18);
        Memory.protect(pt, Process.pageSize, 'rwx');
        pt.writeS32(b ? 505_415_680 : 505_415_712);
        Memory.protect(pt, Process.pageSize, 'r-x');
    }
}

let ch = new Ch(inj_defaultConfig.clip, inj_defaultConfig.onek, inj_defaultConfig.onesk, inj_defaultConfig.resp)
let players:Set<string> = new Set();
let dia: any, gold: any, league: any, medal: any, point: any, skill: any, clan: any,
    eq: any, item: any, char: any, unlock: any, win: any,
    ex: any, unlockAll: any;
const inj_all = (callback:(pt: NativePointer) => void) => {
    Array.from(players).forEach(str => callback(ptr(str)))
}
const inj_main = async () => {
    if(!Process.arch.includes("arm")) return console.log("[!] Only ARM architect can execute this script.");
    if(modl.isNull()) return console.log("[!] No Module Found.");

    console.log("[*] Initialized - Pixel Injection CLI v1.7", `(LibMyGame: ${modl}), PID: ${Process.getCurrentThreadId()}, Arch: ${Process.arch}`);
    dia = (amount:number) => func(cheatOffsets.setMoney)(amount, 0);
    gold = (amount:number) => func(cheatOffsets.setGold)(amount, 0);
    league = func(cheatOffsets.setStarLeagueCoin);
    medal = func(cheatOffsets.getStarLeagueMedal);
    point = (amount:number) => func(cheatOffsets.setPoint)(amount, 0);
    skill = func(cheatOffsets.setAllSkillCoolTimeOneSecond);
    clan = func(cheatOffsets.setClanExp);
    eq = func(buyOffsets.equip);
    item = func(buyOffsets.buyItem);
    char = func(buyOffsets.buyCharacter);
    unlock = (ch:number) => {
        for(let i = 1; i <= 255; i++){item(ch, 0, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 1, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 2, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 3, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 4, i, 1)}
        for(let i = 1; i <= 127; i++){item(ch, 6, i, 1)}
        for(let i = 1; i <= 127; i++){item(ch, 7, i, 1)}
    }
    win = (team:number) => func(cheatOffsets.forceEndGame)(ptr(team));
    ex = () => {
        dia(15_9999_9999)
        gold(15_9999_9999)
        league(15_9999_9999)
        point(15_9999_9999)
        for(let i = 1; i <= 12; i++){
            medal(i, 4)
        }
    }
    unlockAll = () => {
        for(let i = 2; i <= 27; i++){char(i)}
        for(let i = 1; i <= 27; i++){unlock(i)}
    }

    // Debug Zone
    // ==========

    // attach(cloudOffsets.getAbusingDetector)
    // attach(globalOffsets.resetPacketReceive)
    // attach(cloudOffsets.getSendContribPacketTime)
    intercept(inGameOffsets.getMaxSkill, {onLeave: retval => {if(ch.skc) retval.replace(12 as any)}})
    intercept(inGameOffsets.getCurSkill, {onLeave: retval => {if(ch.skc) retval.replace(12 as any)}})
    intercept(inGameOffsets.isSkillManyTimes, {onLeave: retval => {if(ch.skc) retval.replace(1 as any)}})
    intercept(cloudOffsets.getSkillTime, {onLeave: retval => {if(ch.skc) retval.writeFloat(1)}})

    setInterval(() => {
        if(mynum){
            const mypt = ptr(ch.me);
            if(!mypt || mypt.isNull()) return;
            let slot = mypt.add(eposOffsets.slot).readU8();
            inj_all(async pt => {
                const num = pt.readS32(), sl = pt.add(eposOffsets.slot).readU8();
                if(ch.elec){
                    if(num !== mynum && slot % 2 != sl % 2 && !excs.includes(num)) func(inGameOffsets.buffHitElectric)(pt, mynum, mynum)
                }
                if(ch.mago){
                    await inj_sleep(400)
                    if(num !== mynum && slot % 2 != sl % 2 && !excs.includes(num)) func(inGameOffsets.debuffSkillMagoTotem)(mynum, num)
                }
            })
        }
    }, 800)
    setInterval(() => {
        if(mynum){
            const mypt = ptr(ch.me);
            if(!mypt || mypt.isNull()) return;
            let x = mypt.add(eposOffsets.x).readFloat(), y = mypt.add(eposOffsets.y).readFloat(), z = mypt.add(eposOffsets.z).readFloat();
            let st = mypt.add(eposOffsets.state).readS32();
            if(ch.bh){
                inj_all(pt => {
                    const num = pt.readS32();
                    if(num !== mynum && !excs.includes(num)){
                        pt.add(eposOffsets.x).writeFloat(x);
                        pt.add(eposOffsets.y).writeFloat(y);
                        pt.add(eposOffsets.z).writeFloat(z + 10);
                    }
                })
            }
            if(ch.ws){
                mypt.add(eposOffsets.w1c).writeFloat(0);
                mypt.add(eposOffsets.w2c).writeFloat(0);
            }
            if(ch.nr){
                if(st >= 64 && st <= 67) mypt.add(eposOffsets.timer).writeFloat(9999);
            }
            if(ch.mv){
                mypt.add(eposOffsets.dx).writeFloat(Math.min(Math.max(mypt.add(eposOffsets.dx2).readFloat()*3, -3), 3))
                mypt.add(eposOffsets.dz).writeFloat(Math.min(Math.max(mypt.add(eposOffsets.dz2).readFloat()*3, -3), 3))
            }
            if(ch.ld){
                if(mypt.add(eposOffsets.state).readS32() != 16 && mypt.add(eposOffsets.hp).readS16() > 0){
                    mypt.add(eposOffsets.y).writeFloat(-999)
                    mypt.add(eposOffsets.state).writeS32(3)
                }
            }
        }
    }, 10)

    intercept(globalOffsets.getUserByUserSeq, {
        onLeave: retval => {
            players.add(retval.toString());
            ch.me = "";
            players.forEach(player => {
                try{
                    const pt = ptr(player);
                    if(pt.add(0x0).readUInt() == mynum) {
                        ch.me = player;
                        if(ch.win) win(pt.add(eposOffsets.slot).readU8() % 2);
                    }
                    const n = pt.add(eposOffsets.nickname).readCString();
                    const zr1 = pt.add(eposOffsets.zr1).readFloat();
                    const zr2 = pt.add(eposOffsets.zr2).readFloat();
                    if(zr1 !== 0 || zr2 !== 0 || n === "") players.delete(player);
                } catch (e){
                    players.delete(player)
                }
            })
        }
    })
}

Java.perform(async () => {
    let callbackClass = Java.use("com.wellbia.xigncode.XigncodeClientSystem$Callback");
    var FakeCallback = Java.registerClass({
        name: "com.wellbia.xigncode.FakeCallback",
        implements: [callbackClass],
        methods: {
            OnHackDetected: function (code, message) {
                console.log("[*] Hack Detected! (Blocked)");
                console.log(code, message)
            },
            OnLog: function (logMessage) {
                console.log("[*] Xigncode Log:", logMessage);
                return;
            },
            SendPacket: function (data) {
                console.log("[*] SendPacket intercepted!");
                return 0;
            }
        }
    });
    let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
    XigncodeClientSystem["initialize"].implementation = function (activity:any, str:string, app:string, str3:string, callback:any) {
        var fakeCallback = FakeCallback.$new();
        if(!bypassMode) this["initialize"](activity, str, app, str3, fakeCallback)
        console.log("[*] XigncodeClientSystem.initialize", activity, str, app, str3);
        return 0;
    };
    XigncodeClientSystem["getCookie2"].implementation = function (str:string) {
        let result = this["getCookie2"](str);
        // console.log("[*] XigncodeClientSystem.getCookie2", result);
        return bypassMode ? (cookie || null) : result;
    }
    while(!modl){
        await inj_sleep(500)
        modl = Module.getBaseAddress(libMyGame)
    }
    await inj_main().catch(e => console.log("[!]", e))
})
