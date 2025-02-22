const cookieMode = false;
const cookie = "4167b91571_b1c6d0c8bc5b1d7783a8c6faeec50dc4_e4395e811f1a0fd9ff17f8d92fdcd1c1";

const libMyGame = "libMyGame.so";
let modl = Module.findBaseAddress(libMyGame);

interface OffsetInfo {
    name: string;
    str: string;
    args: NativeFunctionArgumentType[];
}

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
    medicSelfHeal: {
        name: "medicSelfHeal",
        str: "_ZN19SystemOfflinePacket20ProcessMedicSelfHealERK9UserInfor",
        args: ["pointer"],
    },
    magoHeal: {
        name: "magoHeal",
        str: "_ZN19SystemOfflinePacket20ProcessMedicSelfHealERK9UserInfor",
        args: ["pointer", "pointer"],
    },
    timeOverRespawn: {
        name: "timeOverRespawn",
        str: "_ZN16SystemPacketSend22TimeOverRespawnWaitingERK9UserInfor",
        args: ["pointer"],
    },
    changeMissionCount: {
        name: "changeMissionCount",
        str: "_ZN16SystemPacketSend22SendChangeMissionCountEjmjt",
        args: ["uint", "ulong", "uint", "uchar"],
    },
    completeGameData: {
        name: "completeGameData",
        str: "_ZN16SystemPacketSend20SendCompleteGameDataEi",
        args: ["uint"],
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

const globalOffsets: Record<string, OffsetInfo> = {
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

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function attach(ofst:OffsetInfo){
    const pt = Module.findExportByName(libMyGame, ofst.str);
    if(pt){
        Interceptor.attach(pt, {
            onEnter: (args) => {
                let _args = [];
                for(let i = 0; i < ofst.args.length; i++){
                    let type = ofst.args[i]
                    let tar = args[i]
                    let val;
                    switch (type) {
                        case "bool":
                            val = !!tar.toInt32();
                            break;
                        case "char":
                        case "int16":
                        case "int":
                            val = tar.toInt32();
                            break;
                        case "uchar":
                        case "uint16":
                        case "uint":
                            val = tar.toUInt32();
                            break;
                        case "long":
                            val = tar.readLong();
                            break;
                        case "ulong":
                            val = tar.readULong();
                            break;
                        case "float":
                            val = tar.toString();
                            break;
                        case "double":
                            val = tar.toString();
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
                console.log(`[+] ${ofst.name} (${pt.toString()}) Called:`, ..._args)
            },
            onLeave: (retval) => {
                console.log("[-]", pt.toString(), "Returned:", retval, retval.toUInt32())
            }
        })
    }
}

function func(ofst: OffsetInfo): NativeFunction<any, any>{
    const pt = Module.findExportByName(libMyGame, ofst.str)
    if(pt) return new NativeFunction(pt, "bool", ofst.args)
    else return null;
}

function isValidAddress(ptrAddr:NativePointer) {
    try {
        return Process.findRangeByAddress(ptrAddr) !== null;
    } catch (e) {
        return false;
    }
}

let mynum:number = 0;
let excs:number[] = [];
let me:string = "";
let players:Set<string> = new Set();
let dia: any, gold: any, league: any, point: any, skill: any, clan: any, item: any, char: any, unlock: any, elec: any, elecAll: any;
const main = async () => {
    if(!Process.arch.includes("arm")) return console.log("[!] Only can execute this script on ARM.");
    if(modl.isNull()) return console.log("[!] No Module Found.");

    console.log("[*] Initialized - Pixel Injection CLI v1.2");
    dia = (amount:number) => func(cheatOffsets.setMoney)(amount, 0);
    gold = (amount:number) => func(cheatOffsets.setGold)(amount, 0);
    league = func(cheatOffsets.setStarLeagueCoin);
    point = (amount:number) => func(cheatOffsets.setPoint)(amount, 0);
    skill = func(cheatOffsets.setAllSkillCoolTimeOneSecond);
    clan = func(cheatOffsets.setClanExp);
    item = func(buyOffsets.buyItem);
    char = func(buyOffsets.buyCharacter);
    unlock = (ch:number) => {
        for(let i = 1; i < 254; i++){item(ch, 0, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 1, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 2, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 3, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 4, i, 1)}
        for(let i = 1; i < 127; i++){item(ch, 6, i, 1)}
        for(let i = 1; i < 127; i++){item(ch, 7, i, 1)}
    }
    elec = func(inGameOffsets.buffHitElectric);
    elecAll = () => {
        if(mynum){
            Array.from(players).forEach(str => {
                const num = ptr(str).readS32();
                if(num !== mynum && !excs.includes(num)) elec(ptr(str), mynum, mynum)
            })
        }
    }

    // setInterval(elecAll, 100)

    Interceptor.attach(Module.findExportByName(libMyGame, globalOffsets.getUserByUserSeq.str), {
        onLeave: retval => {
            players.add(retval.toString());
            me = "";
            players.forEach(player => {
                try{
                    if(ptr(player).add(0x0).readUInt() == mynum){
                        me = player;
                    }
                    const n = ptr(player).add(0x88).readCString();
                    const zr1 = ptr(player).add(0x18C).readFloat();
                    const zr2 = ptr(player).add(0x19C).readFloat();
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
        if(cookieMode) this["initialize"](activity, str, app, str3, fakeCallback)
        console.log("[*] XigncodeClientSystem.initialize", activity, str, app, str3);
        return 0;
    };
    XigncodeClientSystem["getCookie2"].implementation = function (str:string) {
        let result = this["getCookie2"](str);
        console.log("[*] XigncodeClientSystem.getCookie2", result);
        return cookieMode ? result : (cookie || null);
    }
    while(!modl){
        await sleep(500)
        modl = Module.getBaseAddress(libMyGame)
    }
    await main().catch(e => console.log("[!]", e))
})
