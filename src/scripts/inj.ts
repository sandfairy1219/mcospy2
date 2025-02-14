const cookieMode = false;
const cookie = "3367af5c2f_ac269a16fe991b32d07f98c6cb2efd54_07ed2591a14619e6b32121443fa28508";

let modl = Module.findBaseAddress("libMyGame.so")

interface OffsetInfo {
    name: string;
    offset: string;
    args: NativeFunctionArgumentType[];
}

const cheatOffsets: Record<string, OffsetInfo> = {
    setClanExp: {
        name: "setClanExp",
        offset: "0x334F480",
        args: ["uint"],
    },
    forceEndGame: {
        name: "forceEndGame",
        offset: "334F564",
        args: ["pointer"],
    },
    disconnectGameServer: {
        name: "disconnectGameServer",
        offset: "0x334F648",
        args: ["uchar"],
    },
    setLatency: {
        name: "setLatency",
        offset: "0x334F72C",
        args: ["uint"],
    },
    setStarLeaguePoint: {
        name: "setStarLeaguePoint",
        offset: "0x334FBE8",
        args: ["uint16"],
    },
    getStarLeagueReward: {
        name: "getStarLeagueReward",
        offset: "0x334FCCC",
        args: ["void"],
    },
    setStarLeagueCoin: {
        name: "setStarLeagueCoin",
        offset: "0x334FD64",
        args: ["uint"],
    },
    setGradeAndPoint: {
        name: "setGradeAndPoint",
        offset: "0x3353E34",
        args: ["uchar", "uint"],
    },
    setPoint: {
        name: "setPoint",
        offset: "0x3353F28",
        args: ["uchar", "uint"],
    },
    setGold: {
        name: "setGold",
        offset: "0x3354838",
        args: ["int", "int"],
    },
    setBMoney: {
        name: "setBMoney",
        offset: "0x3354960",
        args: ["int", "int"],
    },
    setMoney: {
        name: "setMoney",
        offset: "0x3354A88",
        args: ["int", "int"],
    },
    setAllSkillCoolTimeOneSecond: {
        name: "setAllSkillCoolTimeOneSecond",
        offset: "0x3355124",
        args: ["bool"],
    },
    getStarLeagueMedal: {
        name: "getStarLeagueMedal",
        offset: "0x3355C70",
        args: ["uchar", "ulong"],
    },
}

const buyOffsets: Record<string, OffsetInfo> = {
    buyWithGold: {
        name: "buyWithGold",
        offset: "0x334D8D4",
        args: ["uchar"],
    },
    buyCharacter: {
        name: "buyCharacter",
        offset: "0x334D974",
        args: ["uchar"],
    },
    buyBoost: {
        name: "buyBoost",
        offset: "0x334DA14",
        args: ["uchar"],
    },
    buyWithClanGold: {
        name: "buyWithClanGold",
        offset: "0x334DAB4",
        args: ["uchar"],
    },
    buyResetKillDeathRatio: {
        name: "buyResetKillDeathRatio",
        offset: "0x334DB54",
        args: ["uchar"],
    },
    buyItem: {
        name: "buyItem",
        offset: "0x3351678",
        args: ["uchar", "uchar", "uchar", "uchar"], // character, slot, itemid, count (grenade)
    },
    buyRandomOption: {
        name: "buyRandomOption",
        offset: "0x3351740",
        args: ["uchar", "uchar", "uchar", "uchar"], // character, slot, ?, ?
    },
    buyToyItem: {
        name: "buyToyItem", // guess sky kong kong
        offset: "0x3351740",
        args: ["uint", "uchar", "int"],
    },
    equip: {
        name: "equip",
        offset: "0x3351ED0",
        args: ["uchar", "uchar", "uchar"],
    },
}

const inGameOffset: Record<string, OffsetInfo> = {
    hitUser: {
        name: "hitUser",
        offset: "0x335204C",
        args: ["pointer", "uchar", "pointer", "pointer", "int16", "float"],
    },
    buffHitElectric: {
        name: "buffHitElectric",
        offset: "0x3352B9C",
        args: ["pointer", "uint", "uint"],
    },
    buffHitElectricAi: {
        name: "buffHitElectricAi",
        offset: "0x3352C9C",
        args: ["pointer", "uint", "uint"],
    },
    buffHitElectricOff: {
        name: "buffHitElectricOff",
        offset: "0x335F2C4",
        args: ["pointer", "uint", "uint"],
    },
    debuffSkillMagoTotem: {
        name: "debuffSkillMagoTotem",
        offset: "0x3355DF8",
        args: ["uint", "uint"],
    },
}

const charStatusOffset: Record<string, OffsetInfo> = {
    getMaxHP: {
        name: "getMaxHP",
        offset: "0x3565450",
        args: ["pointer", "uchar"],
    }
}

const clanOffsets: Record<string, OffsetInfo> = {
    matchEndGame: {
        name: "matchEndGame",
        offset: "0x33536CC",
        args: ["uint", "uchar", "uint"],
    },
    reqInfoEndMatch: {
        name: "reqInfoEndMatch",
        offset: "0x334E488",
        args: ["uint"],
    },
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function attach(ofst:OffsetInfo){
    const pt = modl.add(ptr(ofst.offset))
    Interceptor.attach(pt, {
        onEnter: (args) => {
            let _args = []
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
            console.log(`[+] ${ofst.name} (${pt.toString()}) Called:`, ..._args)
        },
        onLeave: (retval) => {
            console.log("[-]", pt.toString(), "Returned:", retval, retval.toUInt32())
        }
    })
}

function func(ofst: OffsetInfo): NativeFunction<any, any>{
    return new NativeFunction(modl.add(ofst.offset), "bool", ofst.args)
}

function isValidAddress(ptrAddr:NativePointer) {
    try {
        return Process.findRangeByAddress(ptrAddr) !== null;
    } catch (e) {
        return false;
    }
}

let dia: any, gold: any, league: any, point: any, skill: any, clanexp: any, item: any, char: any, unlockAll: any;
const main = async () => {
    if(!Process.arch.includes("arm")) return console.log("[!] Only can execute this script on ARM.");
    if(modl.isNull()) return console.log("[!] No Module Found.");
    console.log("[*] Initialized");
    
    dia = func(cheatOffsets.setMoney);
    gold = func(cheatOffsets.setGold);
    league = func(cheatOffsets.setStarLeagueCoin);
    point = func(cheatOffsets.setPoint);
    skill = func(cheatOffsets.setAllSkillCoolTimeOneSecond);
    clanexp = func(cheatOffsets.setClanExp);
    item = func(buyOffsets.buyItem);
    char = func(buyOffsets.buyCharacter);
    unlockAll = (ch:number) => {
        for(let i = 1; i < 254; i++){item(ch, 0, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 1, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 2, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 3, i, 1)}
        for(let i = 1; i < 254; i++){item(ch, 4, i, 1)}
        for(let i = 1; i < 127; i++){item(ch, 6, i, 1)}
        for(let i = 1; i < 127; i++){item(ch, 7, i, 1)}
    }

    attach(clanOffsets.matchEndGame)
    attach(clanOffsets.reqInfoEndMatch)
}

Java.perform(async () => {
    let callbackClass = Java.use("com.wellbia.xigncode.XigncodeClientSystem$Callback");
    var FakeCallback = Java.registerClass({
        name: "com.wellbia.xigncode.FakeCallback",
        implements: [callbackClass],
        methods: {
            OnHackDetected: function (code, message) {
                console.log("[FAKE] Hack Detected! (Blocked)");
                console.log(code, message)
            },
            OnLog: function (logMessage) {
                console.log("[FAKE] Xigncode Log:", logMessage);
                return;
            },
            SendPacket: function (data) {
                console.log("[FAKE] SendPacket intercepted!");
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
        modl = Module.getBaseAddress("libMyGame.so")
    }
    await main().catch(e => console.log("[!]", e))
})

function debuffHack(num:number) {
    const elec = func(inGameOffset.buffHitElectric);

    let players = new Set<NativePointer>()
    Interceptor.attach(modl.add(ptr(inGameOffset.hitUser.offset)), {
        onEnter: (args) => {
            const pt = args[2]
            players.add(pt)
        }
    })
    let idx = 0
    setInterval(() => {
        let pls = Array.from(players)
        if(pls.length === 0) return;
        let p = pls[idx]
        if(!p) return;
        try{
            if(p && !p.isNull()){
                elec(p, num, num)
            } else {
                players.delete(p)
            }
        } catch(e) {
            players.delete(p)
        }
        idx = (idx + 1) % pls.length
    }, 10)
}